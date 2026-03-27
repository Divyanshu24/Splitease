import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getGroup } from '../api/groups';
import { createExpense } from '../api/expenses';
import { Group, Member, SplitType } from '../types';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

interface SplitEntry {
  userId: string;
  name: string;
  amount: string;
  percentage: string;
  included: boolean;
}

export default function AddExpense() {
  const { id: groupId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [splits, setSplits] = useState<SplitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!groupId) return;
    getGroup(groupId)
      .then((g: Group) => {
        setGroup(g);
        setPaidById(user?.id || '');
        setSplits(
          (g.members || []).map((m) => ({
            userId: m.id,
            name: m.name,
            amount: '',
            percentage: '',
            included: true,
          })),
        );
      })
      .catch(() => navigate('/groups'))
      .finally(() => setLoading(false));
  }, [groupId, user, navigate]);

  const includedSplits = splits.filter((s) => s.included);

  const toggleIncluded = (userId: string) => {
    setSplits((prev) =>
      prev.map((s) => (s.userId === userId ? { ...s, included: !s.included } : s)),
    );
  };

  const updateSplitField = (userId: string, field: 'amount' | 'percentage', value: string) => {
    setSplits((prev) =>
      prev.map((s) => (s.userId === userId ? { ...s, [field]: value } : s)),
    );
  };

  const getSplitPayload = () => {
    const total = parseFloat(amount);
    const included = splits.filter((s) => s.included);

    if (splitType === 'equal') {
      return included.map((s) => ({ userId: s.userId }));
    }
    if (splitType === 'percentage') {
      return included.map((s) => ({
        userId: s.userId,
        percentage: parseFloat(s.percentage) || 0,
      }));
    }
    // exact
    return included.map((s) => ({
      userId: s.userId,
      amount: parseFloat(s.amount) || 0,
    }));
  };

  const validateSplits = (): string | null => {
    const total = parseFloat(amount);
    if (isNaN(total) || total <= 0) return 'Enter a valid amount';
    if (includedSplits.length === 0) return 'Select at least one person to split with';

    if (splitType === 'percentage') {
      const pctTotal = includedSplits.reduce((s, x) => s + (parseFloat(x.percentage) || 0), 0);
      if (Math.abs(pctTotal - 100) > 0.01) return `Percentages must sum to 100 (currently ${pctTotal})`;
    }
    if (splitType === 'exact') {
      const amtTotal = includedSplits.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
      if (Math.abs(amtTotal - total) > 0.01)
        return `Split amounts must sum to ₹${total.toFixed(2)} (currently ₹${amtTotal.toFixed(2)})`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validateSplits();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      await createExpense({
        groupId: groupId!,
        description,
        amount: parseFloat(amount),
        paidById,
        splitType,
        splits: getSplitPayload(),
      });
      navigate(`/groups/${groupId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create expense');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to={`/groups/${groupId}`} className="text-sm text-indigo-500 hover:underline mb-4 block">
          ← Back to {group?.name}
        </Link>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Expense</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner at restaurant"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Amount & Paid By */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paid by <span className="text-red-500">*</span>
              </label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {group?.members?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.id === user?.id ? '(you)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Split Type */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">Split type</label>
            <div className="flex gap-2">
              {(['equal', 'percentage', 'exact'] as SplitType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSplitType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition capitalize ${
                    splitType === t
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-300 text-gray-600 hover:border-indigo-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Split Among */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Split among
              {splitType === 'equal' && (
                <span className="text-gray-400 font-normal ml-1 text-xs">
                  (equal share per included person)
                </span>
              )}
              {splitType === 'percentage' && (
                <span className="text-gray-400 font-normal ml-1 text-xs">
                  (must sum to 100%)
                </span>
              )}
              {splitType === 'exact' && (
                <span className="text-gray-400 font-normal ml-1 text-xs">
                  (must sum to total amount)
                </span>
              )}
            </label>
            <div className="space-y-2">
              {splits.map((s) => (
                <div key={s.userId} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={s.included}
                    onChange={() => toggleIncluded(s.userId)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="flex-1 text-sm text-gray-700">
                    {s.name}
                    {s.userId === user?.id && (
                      <span className="text-gray-400 text-xs ml-1">(you)</span>
                    )}
                  </span>
                  {s.included && splitType === 'percentage' && (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={s.percentage}
                      onChange={(e) => updateSplitField(s.userId, 'percentage', e.target.value)}
                      placeholder="%"
                      className="w-20 text-right border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  )}
                  {s.included && splitType === 'exact' && (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={s.amount}
                      onChange={(e) => updateSplitField(s.userId, 'amount', e.target.value)}
                      placeholder="₹"
                      className="w-24 text-right border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  )}
                  {s.included && splitType === 'equal' && amount && (
                    <span className="text-xs text-gray-400 w-20 text-right">
                      ₹{(parseFloat(amount) / includedSplits.length).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm"
          >
            {submitting ? 'Adding expense…' : 'Add Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}
