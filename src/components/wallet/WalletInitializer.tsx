'use client';

import React, { useState, useEffect } from 'react';
import { useWalletInit, useClipboard } from '@/hooks/useSparkWalletHooks';

export const WalletInitializer: React.FC = () => {
  const { generateNewWallet, restoreWallet, isInitialized, isLoading, error, mnemonic, setMnemonic } = useWalletInit();
  const { copyToClipboard, copied } = useClipboard();
  const [mode, setMode] = useState<'new' | 'restore' | null>(null);
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string>('');
  const [showMnemonic, setShowMnemonic] = useState(false);

  // Check for stored mnemonic on mount
  useEffect(() => {
    const storedMnemonic = localStorage.getItem('spark_wallet_mnemonic');
    if (storedMnemonic && !isInitialized) {
      // Auto-restore from stored mnemonic
      restoreWallet(storedMnemonic);
    }
  }, []);

  const handleGenerateNew = async () => {
    const result = await generateNewWallet();
    if (result && result.mnemonic) {
      setGeneratedMnemonic(result.mnemonic);
      setShowMnemonic(true);
      // Store in localStorage
      localStorage.setItem('spark_wallet_mnemonic', result.mnemonic);
    }
  };

  const handleRestore = async () => {
    if (!mnemonic.trim()) {
      alert('Please enter a valid mnemonic phrase');
      return;
    }
    const success = await restoreWallet(mnemonic);
    if (success) {
      // Store in localStorage
      localStorage.setItem('spark_wallet_mnemonic', mnemonic);
      setMode(null);
    }
  };

  const handleClearWallet = () => {
    localStorage.removeItem('spark_wallet_mnemonic');
    window.location.reload();
  };

  if (isInitialized) {
    const storedMnemonic = localStorage.getItem('spark_wallet_mnemonic');
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 font-medium mb-2">✓ Wallet initialized successfully</p>
        {storedMnemonic && (
          <div className="mt-3 space-y-2">
            <details className="cursor-pointer">
              <summary className="text-sm text-green-700 hover:text-green-800">View Seed Phrase</summary>
              <div className="mt-2 p-3 bg-white rounded border border-green-200">
                <p className="font-mono text-xs text-gray-700 break-all">{storedMnemonic}</p>
                <button
                  onClick={() => copyToClipboard(storedMnemonic)}
                  className="mt-2 text-xs text-green-600 hover:text-green-700"
                >
                  {copied ? '✓ Copied!' : 'Copy Seed Phrase'}
                </button>
              </div>
            </details>
            <button
              onClick={handleClearWallet}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Clear Wallet & Start Over
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Initialize Spark Wallet</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {!mode && (
        <div className="space-y-4">
          <button
            onClick={() => setMode('new')}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create New Wallet
          </button>
          <button
            onClick={() => setMode('restore')}
            disabled={isLoading}
            className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Restore Existing Wallet
          </button>
        </div>
      )}

      {mode === 'new' && !showMnemonic && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 mb-2">
              This will generate a new wallet with an auto-generated seed phrase.
            </p>
            <p className="text-blue-700 text-sm">
              The seed phrase will be displayed and stored securely in your browser.
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleGenerateNew}
              disabled={isLoading}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Generating...' : 'Generate Wallet'}
            </button>
            <button
              onClick={() => setMode(null)}
              disabled={isLoading}
              className="flex-1 bg-gray-400 text-white py-3 px-6 rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showMnemonic && generatedMnemonic && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-bold mb-2">⚠️ Important: Save Your Seed Phrase</p>
            <p className="text-yellow-700 text-sm">
              This seed phrase is stored in your browser's local storage. Write it down and keep it safe!
            </p>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="font-mono text-sm text-gray-800 break-all leading-relaxed">
              {generatedMnemonic}
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => copyToClipboard(generatedMnemonic)}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copied ? '✓ Copied!' : 'Copy Seed Phrase'}
            </button>
            <button
              onClick={() => {
                setShowMnemonic(false);
                setMode(null);
              }}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
            >
              I've Saved It
            </button>
          </div>
        </div>
      )}

      {mode === 'restore' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="mnemonic" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your seed phrase
            </label>
            <textarea
              id="mnemonic"
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder="Enter your 12 or 24 word seed phrase..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleRestore}
              disabled={isLoading || !mnemonic.trim()}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Restoring...' : 'Restore Wallet'}
            </button>
            <button
              onClick={() => {
                setMode(null);
                setMnemonic('');
              }}
              disabled={isLoading}
              className="flex-1 bg-gray-400 text-white py-3 px-6 rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};