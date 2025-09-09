'use client';

import React, { useState } from 'react';
import { useLightning, useClipboard } from '@/hooks/useSparkWalletHooks';

export const LightningInvoice: React.FC = () => {
  const {
    createInvoice,
    payInvoice,
    estimateFee,
    lightningInvoices,
    lightningSendRequests,
    invoiceAmount,
    setInvoiceAmount,
    invoiceMemo,
    setInvoiceMemo,
    paymentInvoice,
    setPaymentInvoice,
    isLoading,
    error,
  } = useLightning();

  const { copyToClipboard, copied } = useClipboard();
  const [activeTab, setActiveTab] = useState<'receive' | 'send'>('receive');
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);

  const handleCreateInvoice = async () => {
    try {
      const invoice = await createInvoice();
      if (invoice) {
        setCreatedInvoice(invoice);
        setInvoiceAmount('');
        setInvoiceMemo('');
      }
    } catch (err) {
      console.error('Failed to create invoice:', err);
    }
  };

  const handleEstimateFee = async () => {
    if (paymentInvoice) {
      const fee = await estimateFee(paymentInvoice);
      setEstimatedFee(fee);
    }
  };

  const handlePayInvoice = async () => {
    try {
      const result = await payInvoice(estimatedFee || 10);
      if (result) {
        setPaymentInvoice('');
        setEstimatedFee(null);
      }
    } catch (err) {
      console.error('Failed to pay invoice:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Lightning Network</h3>

      {/* Tab Navigation */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('receive')}
          className={`flex-1 py-2 px-4 text-center font-medium transition-colors ${
            activeTab === 'receive'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Receive
        </button>
        <button
          onClick={() => setActiveTab('send')}
          className={`flex-1 py-2 px-4 text-center font-medium transition-colors ${
            activeTab === 'send'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Send
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Receive Tab */}
      {activeTab === 'receive' && (
        <div className="space-y-4">
          {createdInvoice && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium mb-2">✓ Invoice Created!</p>
              <div className="bg-white rounded p-3 break-all text-xs font-mono text-gray-800">
                {typeof createdInvoice.invoice === 'string'
                  ? createdInvoice.invoice
                  : JSON.stringify(createdInvoice.invoice)}
              </div>
              <button
                onClick={() => copyToClipboard(createdInvoice.invoice)}
                className="mt-3 text-green-600 hover:text-green-700 text-sm font-medium"
              >
                {copied ? '✓ Copied!' : 'Copy Invoice'}
              </button>
            </div>
          )}

          <div>
            <label htmlFor="invoice-amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (sats)
            </label>
            <input
              id="invoice-amount"
              type="number"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
              placeholder="100000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="invoice-memo" className="block text-sm font-medium text-gray-700 mb-2">
              Memo (optional)
            </label>
            <input
              id="invoice-memo"
              type="text"
              value={invoiceMemo}
              onChange={(e) => setInvoiceMemo(e.target.value)}
              placeholder="Payment for..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleCreateInvoice}
            disabled={isLoading || !invoiceAmount}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Invoice'}
          </button>

          {/* Recent Invoices */}
          {lightningInvoices.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-3">Recent Invoices</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {lightningInvoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                    <span className="text-gray-700">{invoice.amountSats} sats</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'expired' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Send Tab */}
      {activeTab === 'send' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="payment-invoice" className="block text-sm font-medium text-gray-700 mb-2">
              Lightning Invoice
            </label>
            <textarea
              id="payment-invoice"
              value={paymentInvoice}
              onChange={(e) => setPaymentInvoice(e.target.value)}
              placeholder="lnbc..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {paymentInvoice && (
            <button
              onClick={handleEstimateFee}
              disabled={isLoading}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Estimate Fee
            </button>
          )}

          {estimatedFee !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm">
                Estimated fee: <span className="font-bold">{estimatedFee} sats</span>
              </p>
            </div>
          )}

          <button
            onClick={handlePayInvoice}
            disabled={isLoading || !paymentInvoice}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Paying...' : 'Pay Invoice'}
          </button>

          {/* Recent Payments */}
          {lightningSendRequests.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-3">Recent Payments</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {lightningSendRequests.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                    <span className="text-gray-700">{payment.amountSats} sats</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};