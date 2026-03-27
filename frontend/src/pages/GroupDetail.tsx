import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getGroup, addMember } from '../api/groups';
import { getExpenses, deleteExpense } from '../api/expenses';
import { getSettlements, recordSettlement } from '../api/settlements';
import { Group, Expense, SettlementData, Transaction } from '../types';
import Navbar from '../components/Navbar';
import SettleModal from '../components/SettleModal';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'expenses' | 'balances' | 'settlements';

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<SettlementData | null>(null);
  const [tab, setTab] = useState<Tab>('expenses');
  const [loading, setLoading] = useState(true);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [settlingTransaction, setSettlingTransaction] = useState(false);

  const loadAll = useCallback(async () => {
    if (!id) return;
    try {
      const [g, e, s] = await Promise.all([
        getGroup(id),
        getExpenses(id),
        getSettlements(id),
      ]);
      setGroup(g);
      setExpenses(e);
      setSettlements(s);
    } catch {
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');
    setAddingMember(true);
    try {
      await addMember(id!, addMemberEmail);
      setAddMemberEmail('');
      loadAll();
    } catch (err: any) {
      setMemberError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await deleteExpense(expenseId);
      loadAll();
    } catch {
      alert('Failed to delete expense');
    }
  };

  const handleSettleClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleSettleTransaction = async (amount: number) => {
    if (!selectedTransaction || !id) return;
    setSettlingTransaction(true);
    try {
      await recordSettlement(
        id,
        selectedTransaction.fromUserId,
        selectedTransaction.toUserId,
        amount,
      );
      setSelectedTransaction(null);
      loadAll();
    } catch {
      throw new Error('Failed to record settlement');
    } finally {
      setSettlingTransaction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  if (!group) return null;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <Link to="/groups" className="text-sm text-indigo-500 hover:underline">
              ← Back to groups
            </Link>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">{group.name}</h2>
            {group.description && (
              <p className="text-gray-500 text-sm mt-0.5">{group.description}</p>
            )}
          </div>
          <Link
            to={`/groups/${id}/add-expense`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap"
          >
            + Add Expense
          </Link>
        </div>

        <div className="flex gap-6 text-sm text-gray-500 mb-6 mt-2">
          <span>{group.members?.length ?? 0} members</span>
          <span>{expenses.length} expenses</span>
          <span className="font-semibold text-gray-700">
            Total: ₹{totalExpenses.toFixed(2)}
          </span>
        </div>

        {/* Members section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Members</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {group.members?.map((m) => (
              <span
                key={m.id}
                className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full font-medium"
              >
                {m.name}
                {m.id === user?.id && (
                  <span className="text-indigo-400 ml-1 text-xs">(you)</span>
                )}
              </span>
            ))}
          </div>
          <form onSubmit={handleAddMember} className="flex gap-2 mt-2">
            <input
              type="email"
              value={addMemberEmail}
              onChange={(e) => setAddMemberEmail(e.target.value)}
              placeholder="Add member by email"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={addingMember || !addMemberEmail}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-lg disabled:opacity-50 transition"
            >
              {addingMember ? '…' : 'Add'}
            </button>
          </form>
          {memberError && <p className="text-red-500 text-xs mt-1">{memberError}</p>}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-5">
          {(['expenses', 'balances', 'settlements'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium capitalize transition border-b-2 ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Expenses Tab */}
        {tab === 'expenses' && (
          <div className="space-y-3">
            {expenses.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">🧾</div>
                <p>No expenses yet. Add the first one!</p>
              </div>
            )}
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800">{expense.description}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Paid by{' '}
                      <span className="font-medium text-gray-700">
                        {expense.paidBy?.id === user?.id ? 'you' : expense.paidBy?.name}
                      </span>{' '}
                      · {new Date(expense.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-800">
                      ₹{expense.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-gray-300 hover:text-red-500 transition text-lg"
                      title="Delete expense"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                    {expense.splitType} split
                  </span>
                  {expense.splits.map((s) => (
                    <span
                      key={s.userId}
                      className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
                    >
                      {s.userName || s.userId}: ₹{s.amount.toFixed(2)}
                      {s.percentage != null && ` (${s.percentage}%)`}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Balances Tab */}
        {tab === 'balances' && settlements && (
          <div className="space-y-3">
            {settlements.balances.length === 0 && (
              <p className="text-gray-400 text-center py-8">No expenses to calculate balances</p>
            )}
            {settlements.balances.map((b) => (
              <div
                key={b.userId}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {b.userName}
                    {b.userId === user?.id && (
                      <span className="text-gray-400 font-normal text-sm ml-1">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{b.userEmail}</p>
                </div>
                <div
                  className={`text-right font-bold text-lg ${
                    b.amount > 0.01
                      ? 'text-green-600'
                      : b.amount < -0.01
                      ? 'text-red-500'
                      : 'text-gray-400'
                  }`}
                >
                  {b.amount > 0.01 ? (
                    <span>+₹{b.amount.toFixed(2)} owed to you</span>
                  ) : b.amount < -0.01 ? (
                    <span>−₹{Math.abs(b.amount).toFixed(2)} you owe</span>
                  ) : (
                    <span className="text-sm font-normal">Settled up</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Settlements Tab */}
        {tab === 'settlements' && settlements && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Optimal payment plan to settle all debts with minimum transactions.
            </p>
            {settlements.transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">✅</div>
                <p className="font-medium">Everyone is settled up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.transactions.map((t, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
                  >
                    <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm shrink-0">
                      {t.fromUserName[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">
                          {t.fromUserId === user?.id ? 'You' : t.fromUserName}
                        </span>{' '}
                        pays{' '}
                        <span className="font-semibold">
                          {t.toUserId === user?.id ? 'you' : t.toUserName}
                        </span>
                      </p>
                    </div>
                    <span className="text-lg font-bold text-indigo-700">
                      ₹{t.amount.toFixed(2)}
                    </span>
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm shrink-0">
                      {t.toUserName[0].toUpperCase()}
                    </div>
                    <div style={{ color: 'red', fontSize: 12 }}>
                      DEBUG: fromUserId={t.fromUserId} userId={user?.id} match={String(t.fromUserId === user?.id)}
                    </div>
                    {t.fromUserId === user?.id && (
                      <button
                        onClick={() => handleSettleClick(t)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shrink-0"
                      >
                        Settle
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <SettleModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onSettle={handleSettleTransaction}
          isLoading={settlingTransaction}
        />
      </div>
    </div>
  );
}
