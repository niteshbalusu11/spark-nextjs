'use client';

import React from 'react';
import { useWalletBalance, useFormatters } from '@/hooks/useSparkWalletHooks';

export const WalletBalance: React.FC = () => {
  const { balance, balanceInBTC, balanceInSats, tokenBalances, refreshBalance, isRefreshing } = useWalletBalance();
  const { formatSats } = useFormatters();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Wallet Balance</h3>
        <button
          onClick={refreshBalance}
          disabled={isRefreshing}
          className="text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefreshing ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-1">Bitcoin Balance</p>
          <p className="text-3xl font-bold">{balanceInBTC} BTC</p>
          <p className="text-sm opacity-90 mt-2">{formatSats(balanceInSats)} sats</p>
        </div>

        {tokenBalances && tokenBalances.size > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Token Balances</h4>
            <div className="space-y-2">
              {Array.from(tokenBalances.entries()).map(([tokenId, balance]) => (
                <div key={tokenId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                    {tokenId}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {balance.toString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};