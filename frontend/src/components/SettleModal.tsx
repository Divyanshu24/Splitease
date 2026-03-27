import React, { useState } from 'react';
import { Transaction } from '../types';

interface SettleModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onSettle: (amount: number) => Promise<void>;
  isLoading: boolean;
}

export default function SettleModal({
  transaction,
  onClose,
  onSettle,
  isLoading,
}: SettleModalProps) {
  const [amount, setAmount] = useState<string>(
    transaction?.amount.toString() || ''
  );
  const [error, setError] = useState('');

  if (!transaction) return null;

  const maxAmount = transaction.amount;
  const numAmount = parseFloat(amount);

  const handleSettle = async () => {
    setError('');

    if (!amount || isNaN(numAmount)) {
      setError('Please enter a valid amount');
      return;
    }

    if (numAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (numAmount > maxAmount) {
      setError(`Amount cannot exceed ₹${maxAmount.toFixed(2)}`);
      return;
    }

    try {
      await onSettle(numAmount);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to settle');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-96">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Settle Payment
        </h3>

        <div className="bg-indigo-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-semibold text-indigo-700">
              {transaction.fromUserName}
            </span>{' '}
            pays{' '}
            <span className="font-semibold text-indigo-700">
              {transaction.toUserName}
            </span>
          </p>
          <p className="text-xs text-gray-500">
            Suggested amount: ₹{transaction.amount.toFixed(2)}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            max={maxAmount}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum: ₹{maxAmount.toFixed(2)}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSettle}
            disabled={isLoading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            {isLoading ? '...' : 'Settle'}
          </button>
        </div>
      </div>
    </div>
  );
}
