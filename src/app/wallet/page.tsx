'use client';

import React, { useState } from 'react';
import { SparkWalletProvider } from '@/contexts/SparkWalletContext';
import { WalletInitializer } from '@/components/wallet/WalletInitializer';
import { WalletBalance } from '@/components/wallet/WalletBalance';
import { SendTransfer } from '@/components/wallet/SendTransfer';
import { LightningInvoice } from '@/components/wallet/LightningInvoice';
import { DepositAddress } from '@/components/wallet/DepositAddress';
import { useSparkWallet } from '@/contexts/SparkWalletContext';

// Wallet Dashboard Component
const WalletDashboard: React.FC = () => {
  const { isInitialized, sparkAddress, cleanupConnections } = useSparkWallet();
  const [activeSection, setActiveSection] = useState<'overview' | 'send' | 'lightning' | 'deposit'>('overview');

  if (!isInitialized) {
    return <WalletInitializer />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Spark Wallet</h1>
              {sparkAddress && (
                <p className="text-sm text-gray-400 mt-1">
                  Address: <span className="font-mono">{sparkAddress.address}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => cleanupConnections()}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-[#0a0a0a] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveSection('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'overview'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSection('send')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'send'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Send
            </button>
            <button
              onClick={() => setActiveSection('lightning')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'lightning'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Lightning
            </button>
            <button
              onClick={() => setActiveSection('deposit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'deposit'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Deposit
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WalletBalance />
            <div className="space-y-6">
              <QuickActions onNavigate={setActiveSection} />
              <RecentActivity />
            </div>
          </div>
        )}

        {activeSection === 'send' && (
          <div className="max-w-2xl mx-auto">
            <SendTransfer />
          </div>
        )}

        {activeSection === 'lightning' && (
          <div className="max-w-2xl mx-auto">
            <LightningInvoice />
          </div>
        )}

        {activeSection === 'deposit' && (
          <div className="max-w-2xl mx-auto">
            <DepositAddress />
          </div>
        )}
      </main>
    </div>
  );
};

// Quick Actions Component
const QuickActions: React.FC<{ onNavigate: (section: any) => void }> = ({ onNavigate }) => {
  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
      <h3 className="text-lg font-bold text-gray-100 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('send')}
          className="flex flex-col items-center justify-center p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg hover:bg-blue-900/30 transition-colors"
        >
          <svg className="w-8 h-8 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span className="text-sm font-medium text-gray-300">Send</span>
        </button>
        <button
          onClick={() => onNavigate('deposit')}
          className="flex flex-col items-center justify-center p-4 bg-green-900/20 border border-green-800/30 rounded-lg hover:bg-green-900/30 transition-colors"
        >
          <svg className="w-8 h-8 text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          <span className="text-sm font-medium text-gray-300">Receive</span>
        </button>
        <button
          onClick={() => onNavigate('lightning')}
          className="flex flex-col items-center justify-center p-4 bg-yellow-900/20 border border-yellow-800/30 rounded-lg hover:bg-yellow-900/30 transition-colors"
        >
          <svg className="w-8 h-8 text-yellow-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm font-medium text-gray-300">Lightning</span>
        </button>
        <button
          className="flex flex-col items-center justify-center p-4 bg-purple-900/20 border border-purple-800/30 rounded-lg hover:bg-purple-900/30 transition-colors"
        >
          <svg className="w-8 h-8 text-purple-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-300">History</span>
        </button>
      </div>
    </div>
  );
};

// Recent Activity Component
const RecentActivity: React.FC = () => {
  const { transfers } = useSparkWallet();

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
      <h3 className="text-lg font-bold text-gray-100 mb-4">Recent Activity</h3>
      {transfers.length > 0 ? (
        <div className="space-y-3">
          {transfers.slice(0, 5).map((transfer) => (
            <div key={transfer.id} className="flex justify-between items-center p-3 bg-gray-900/50 border border-gray-800 rounded-lg gap-3">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className={`w-2 h-2 rounded-full ${
                  transfer.status === 'completed' ? 'bg-green-400' :
                  transfer.status === 'pending' ? 'bg-yellow-400' :
                  'bg-red-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    Transfer to {transfer.receiverSparkAddress.slice(0, 20)}...
                  </p>
                  <p className="text-xs text-gray-500">
                    {transfer.timestamp}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-100 whitespace-nowrap">
                {(Number(transfer.amount) / 100000000).toFixed(8)} BTC
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No recent activity</p>
      )}
    </div>
  );
};

// Main Page Component with Provider
export default function WalletPage() {
  return (
    <SparkWalletProvider>
      <WalletDashboard />
    </SparkWalletProvider>
  );
}