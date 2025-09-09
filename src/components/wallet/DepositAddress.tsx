'use client';

import React, { useState } from 'react';
import { useDeposits, useClipboard } from '@/hooks/useSparkWalletHooks';

export const DepositAddress: React.FC = () => {
  const {
    generateDepositAddress,
    loadUnusedAddresses,
    claimDepositFunds,
    depositAddresses,
    selectedDepositType,
    setSelectedDepositType,
    depositTxId,
    setDepositTxId,
    isLoading,
    error,
  } = useDeposits();

  const { copyToClipboard, copied } = useClipboard();
  const [generatedAddress, setGeneratedAddress] = useState<string | null>(null);
  const [showUnused, setShowUnused] = useState(false);

  const handleGenerateAddress = async () => {
    const address = await generateDepositAddress();
    if (address) {
      setGeneratedAddress(address);
    }
  };

  const handleLoadUnused = async () => {
    await loadUnusedAddresses();
    setShowUnused(true);
  };

  const handleClaimDeposit = async () => {
    try {
      await claimDepositFunds();
      setDepositTxId('');
    } catch (err) {
      console.error('Failed to claim deposit:', err);
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
      <h3 className="text-xl font-bold text-gray-100 mb-4">Deposit Bitcoin</h3>

      {error && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Deposit Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Deposit Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center text-gray-300">
              <input
                type="radio"
                value="single"
                checked={selectedDepositType === 'single'}
                onChange={(e) => setSelectedDepositType('single')}
                className="mr-2"
              />
              <span className="text-sm">Single Use</span>
            </label>
            <label className="flex items-center text-gray-300">
              <input
                type="radio"
                value="static"
                checked={selectedDepositType === 'static'}
                onChange={(e) => setSelectedDepositType('static')}
                className="mr-2"
              />
              <span className="text-sm">Static (Reusable)</span>
            </label>
          </div>
        </div>

        {/* Generate Address Button */}
        <button
          onClick={handleGenerateAddress}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Generating...' : 'Generate Deposit Address'}
        </button>

        {/* Generated Address Display */}
        {generatedAddress && (
          <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4">
            <p className="text-green-400 font-medium mb-2">✓ Deposit Address Generated!</p>
            <div className="bg-gray-900/50 border border-gray-800 rounded p-3 break-all text-sm font-mono text-gray-300">
              {generatedAddress}
            </div>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => copyToClipboard(generatedAddress)}
                className="text-green-400 hover:text-green-300 text-sm font-medium"
              >
                {copied ? '✓ Copied!' : 'Copy Address'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Send Bitcoin to this address to deposit funds into your Spark wallet.
            </p>
          </div>
        )}

        {/* Claim Deposit Section */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Claim Deposit</h4>
          <div className="space-y-3">
            <div>
              <label htmlFor="deposit-txid" className="block text-sm font-medium text-gray-300 mb-1">
                Transaction ID
              </label>
              <input
                id="deposit-txid"
                type="text"
                value={depositTxId}
                onChange={(e) => setDepositTxId(e.target.value)}
                placeholder="Enter Bitcoin transaction ID..."
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-100 placeholder-gray-500"
              />
            </div>
            <button
              onClick={handleClaimDeposit}
              disabled={isLoading || !depositTxId}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Claiming...' : 'Claim Deposit'}
            </button>
          </div>
        </div>

        {/* Unused Addresses */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-gray-300">Unused Addresses</h4>
            <button
              onClick={handleLoadUnused}
              disabled={isLoading}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Load Addresses
            </button>
          </div>
          
          {showUnused && depositAddresses.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {depositAddresses.map((address, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-900/50 border border-gray-800 rounded text-sm">
                  <span className="text-gray-300 font-mono truncate mr-2">{address}</span>
                  <button
                    onClick={() => copyToClipboard(address)}
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {showUnused && depositAddresses.length === 0 && (
            <p className="text-sm text-gray-400">No unused addresses found.</p>
          )}
        </div>
      </div>
    </div>
  );
};