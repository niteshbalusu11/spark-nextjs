'use client';

import React, { useState } from 'react';
import { useTransfers, useFormatters, useClipboard } from '@/hooks/useSparkWalletHooks';

export const SendTransfer: React.FC = () => {
  const { sendTransfer, recipient, setRecipient, amount, setAmount, isLoading, error } = useTransfers();
  const { formatSats, btcToSats } = useFormatters();
  const { copyToClipboard } = useClipboard();
  const [unit, setUnit] = useState<'sats' | 'btc'>('sats');
  const [txResult, setTxResult] = useState<any>(null);

  const handleSend = async () => {
    try {
      const amountInSats = unit === 'btc' ? btcToSats(amount).toString() : amount;
      setAmount(amountInSats);
      const result = await sendTransfer();
      if (result) {
        setTxResult(result);
        // Clear form
        setRecipient('');
        setAmount('');
      }
    } catch (err) {
      console.error('Transfer failed:', err);
    }
  };

  const toggleUnit = () => {
    if (unit === 'sats' && amount) {
      const btcAmount = (parseInt(amount) / 100000000).toFixed(8);
      setAmount(btcAmount);
    } else if (unit === 'btc' && amount) {
      const satsAmount = btcToSats(amount).toString();
      setAmount(satsAmount);
    }
    setUnit(unit === 'sats' ? 'btc' : 'sats');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Send Transfer</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {txResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-800 font-medium mb-2">✓ Transfer Successful!</p>
          <div className="text-sm text-green-700 space-y-1">
            <p>Transaction ID: {txResult.id}</p>
            <p>Amount: {formatSats(txResult.amount.toString())} sats</p>
            <button
              onClick={() => copyToClipboard(txResult.id)}
              className="text-green-600 hover:text-green-700 underline"
            >
              Copy Transaction ID
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Spark Address
          </label>
          <input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="spark1..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <button
              onClick={toggleUnit}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Switch to {unit === 'sats' ? 'BTC' : 'Sats'}
            </button>
          </div>
          <div className="relative">
            <input
              id="amount"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={unit === 'sats' ? '100000' : '0.001'}
              className="w-full px-4 py-2 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
              {unit.toUpperCase()}
            </span>
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={isLoading || !recipient || !amount}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Sending...' : 'Send Transfer'}
        </button>
      </div>
    </div>
  );
};