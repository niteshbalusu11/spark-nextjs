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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Spark Wallet</h1>
              {sparkAddress && (
                <p className="text-sm text-gray-600 mt-1">
                  Address: <span className="font-mono">{sparkAddress.address.slice(0, 20)}...</span>
                </p>
              )}
            </div>
            <button
              onClick={() => cleanupConnections()}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveSection('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSection('send')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'send'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Send
            </button>
            <button
              onClick={() => setActiveSection('lightning')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'lightning'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Lightning
            </button>
            <button
              onClick={() => setActiveSection('deposit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'deposit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('send')}
          className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Send</span>
        </button>
        <button
          onClick={() => onNavigate('deposit')}
          className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
        >
          <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Receive</span>
        </button>
        <button
          onClick={() => onNavigate('lightning')}
          className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
        >
          <svg className="w-8 h-8 text-yellow-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Lightning</span>
        </button>
        <button
          className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">History</span>
        </button>
      </div>
    </div>
  );
};

// Recent Activity Component
const RecentActivity: React.FC = () => {
  const { transfers } = useSparkWallet();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
      {transfers.length > 0 ? (
        <div className="space-y-3">
          {transfers.slice(0, 5).map((transfer) => (
            <div key={transfer.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  transfer.status === 'completed' ? 'bg-green-500' :
                  transfer.status === 'pending' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Transfer to {transfer.receiverSparkAddress}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(transfer.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {Number(transfer.amount) / 100000000} BTC
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No recent activity</p>
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