"use client";

import { useState, useEffect } from "react";
import { UMAProvider, useUMA } from "@/contexts/UMAContext";
import { SparkWalletProvider } from "@/contexts/SparkWalletContext";
import QRCode from "react-qr-code";

function UMAContent() {
  const {
    account,
    balance,
    transactions,
    activityLogs,
    recipients,
    sendPaymentFlow,
    isLoading,
    error,
    createUMAAccount,
    clearAccount,
    refreshBalance,
    startSendPayment,
    selectRecipient,
    setPaymentAmount,
    confirmPayment,
    cancelPayment,
    clearError,
    initializeMockData,
  } = useUMA();

  const [username, setUsername] = useState("");
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"home" | "send" | "activity">("home");
  const [paymentAmount, setPaymentAmountLocal] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("USD");

  useEffect(() => {
    // Initialize mock data on first load
    if (!account) {
      initializeMockData();
    }
  }, []);

  const handleCreateAccount = async () => {
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }
    
    const newAccount = await createUMAAccount(username);
    if (newAccount) {
      setShowCreateAccount(false);
      setUsername("");
      refreshBalance();
    }
  };

  const handleStartPayment = () => {
    startSendPayment();
    setSelectedTab("send");
  };

  const handleSelectRecipient = (recipient: any) => {
    selectRecipient(recipient);
  };

  const handleSetAmount = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    setPaymentAmount(amount, paymentCurrency);
  };

  const handleConfirmPayment = async () => {
    await confirmPayment();
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") {
      return `$${amount.toFixed(2)}`;
    } else if (currency === "BTC") {
      return `₿${amount.toFixed(8)}`;
    }
    return `${amount} ${currency}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!account && !showCreateAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <h1 className="text-3xl font-bold mb-6 text-center">Universal Money Address (UMA)</h1>
            
            <div className="text-center space-y-6">
              <p className="text-gray-300">
                Create your UMA to send and receive payments globally using the Lightning Network.
              </p>
              
              <button
                onClick={() => setShowCreateAccount(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
              >
                Create UMA Account
              </button>
              
              <div className="mt-8 p-4 bg-gray-900/50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Test Mode</h3>
                <p className="text-xs text-gray-500">
                  This is a test implementation using mock data. In production, this would connect to real Lightning nodes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showCreateAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6">Create Your UMA</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Choose your username
                </label>
                <div className="flex items-center bg-gray-900/50 rounded-lg p-3">
                  <span className="text-gray-400 mr-2">$</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    placeholder="yourname"
                    className="flex-1 bg-transparent outline-none text-white placeholder-gray-500"
                  />
                  <span className="text-gray-400 ml-2">@spark-wallet.com</span>
                </div>
              </div>
              
              {username && (
                <div className="p-3 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400">Your UMA will be:</p>
                  <p className="text-lg font-mono text-purple-400">${username}@spark-wallet.com</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateAccount(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAccount}
                  disabled={!username || isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isLoading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">UMA Wallet</h1>
            <p className="text-sm text-purple-400 font-mono">{account?.address}</p>
          </div>
          <button
            onClick={clearAccount}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800/30 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex">
          <button
            onClick={() => setSelectedTab("home")}
            className={`px-6 py-3 font-medium transition-colors ${
              selectedTab === "home"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setSelectedTab("send")}
            className={`px-6 py-3 font-medium transition-colors ${
              selectedTab === "send"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Send
          </button>
          <button
            onClick={() => setSelectedTab("activity")}
            className={`px-6 py-3 font-medium transition-colors ${
              selectedTab === "activity"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Activity
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center justify-between">
            <p className="text-red-400">{error}</p>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Home Tab */}
        {selectedTab === "home" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Balance Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-300">Balance</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(balance?.fiatBalance || 0, "USD")}
                  </p>
                  <p className="text-sm text-gray-400">Fiat Balance</p>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <p className="text-xl font-semibold text-orange-400">
                    {formatCurrency(balance?.btcBalance || 0, "BTC")}
                  </p>
                  <p className="text-sm text-gray-400">Bitcoin Balance</p>
                </div>
                <div>
                  <p className="text-lg text-yellow-400">
                    {balance?.lightningBalance || 0} sats
                  </p>
                  <p className="text-sm text-gray-400">Lightning Balance</p>
                </div>
              </div>
              <button
                onClick={refreshBalance}
                className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Refresh Balance
              </button>
            </div>

            {/* QR Code Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-300">Receive Payments</h2>
              <div className="bg-white p-4 rounded-lg">
                <QRCode
                  value={account?.address || ""}
                  size={200}
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
              <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Your UMA:</p>
                <p className="font-mono text-sm text-purple-400 break-all">{account?.address}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(account?.address || "")}
                className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
              >
                Copy Address
              </button>
            </div>

            {/* Quick Actions */}
            <div className="md:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-300">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={handleStartPayment}
                  className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg transition-all transform hover:scale-105"
                >
                  <div className="text-2xl mb-2">💸</div>
                  <p className="text-sm font-medium">Send Payment</p>
                </button>
                <button className="p-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition-all transform hover:scale-105">
                  <div className="text-2xl mb-2">📥</div>
                  <p className="text-sm font-medium">Request Payment</p>
                </button>
                <button className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all transform hover:scale-105">
                  <div className="text-2xl mb-2">🔄</div>
                  <p className="text-sm font-medium">Exchange</p>
                </button>
                <button className="p-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 rounded-lg transition-all transform hover:scale-105">
                  <div className="text-2xl mb-2">📊</div>
                  <p className="text-sm font-medium">Analytics</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send Tab */}
        {selectedTab === "send" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              {!sendPaymentFlow && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">💸</div>
                  <h2 className="text-2xl font-bold mb-2">Send Payment</h2>
                  <p className="text-gray-400 mb-6">Send money to any UMA address instantly</p>
                  <button
                    onClick={handleStartPayment}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                  >
                    Start New Payment
                  </button>
                </div>
              )}

              {sendPaymentFlow?.step === "select_recipient" && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Select Recipient</h2>
                  <div className="space-y-3">
                    {recipients.map((recipient) => (
                      <button
                        key={recipient.id}
                        onClick={() => handleSelectRecipient(recipient)}
                        className="w-full p-4 bg-gray-900/50 hover:bg-gray-900/70 rounded-lg transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{recipient.avatar}</div>
                          <div className="text-left">
                            <p className="font-medium">{recipient.name}</p>
                            <p className="text-sm text-purple-400 font-mono">{recipient.umaAddress}</p>
                          </div>
                        </div>
                        {recipient.isOnline && (
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={cancelPayment}
                    className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {sendPaymentFlow?.step === "enter_amount" && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Enter Amount</h2>
                  <div className="mb-4 p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-sm text-gray-400">Sending to:</p>
                    <p className="font-medium">{sendPaymentFlow.recipient?.name}</p>
                    <p className="text-sm text-purple-400 font-mono">{sendPaymentFlow.recipient?.umaAddress}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmountLocal(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 bg-gray-900/50 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <select
                          value={paymentCurrency}
                          onChange={(e) => setPaymentCurrency(e.target.value)}
                          className="bg-gray-900/50 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="USD">USD</option>
                          <option value="BTC">BTC</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={cancelPayment}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSetAmount}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {sendPaymentFlow?.step === "confirm" && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Confirm Payment</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Recipient</p>
                      <p className="font-medium">{sendPaymentFlow.recipient?.name}</p>
                      <p className="text-sm text-purple-400 font-mono">{sendPaymentFlow.recipient?.umaAddress}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Amount to Send</p>
                      <p className="text-2xl font-bold">{formatCurrency(sendPaymentFlow.amount || 0, sendPaymentFlow.currency || "USD")}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Recipient Receives</p>
                      <p className="text-xl font-semibold">{formatCurrency(sendPaymentFlow.receivingAmount || 0, sendPaymentFlow.receivingCurrency || "BTC")}</p>
                      <p className="text-xs text-gray-500 mt-1">Exchange Rate: 1 USD = {sendPaymentFlow.exchangeRate} BTC</p>
                    </div>
                    
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <p className="text-sm text-gray-400">Network Fee</p>
                        <p className="text-sm">{formatCurrency(sendPaymentFlow.fees?.network || 0, "USD")}</p>
                      </div>
                      <div className="flex justify-between mb-2">
                        <p className="text-sm text-gray-400">Service Fee</p>
                        <p className="text-sm">{formatCurrency(sendPaymentFlow.fees?.service || 0, "USD")}</p>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-700">
                        <p className="text-sm font-medium">Total Fees</p>
                        <p className="text-sm font-medium">{formatCurrency(sendPaymentFlow.fees?.total || 0, "USD")}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={cancelPayment}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmPayment}
                        disabled={isLoading}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors"
                      >
                        {isLoading ? "Processing..." : "Confirm Payment"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {sendPaymentFlow?.step === "processing" && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                  <h2 className="text-xl font-bold mb-2">Processing Payment</h2>
                  <p className="text-gray-400">Please wait while we process your payment...</p>
                </div>
              )}

              {sendPaymentFlow?.step === "complete" && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold mb-2">Payment Sent!</h2>
                  <p className="text-gray-400 mb-4">Your payment has been successfully sent.</p>
                  <p className="text-sm text-gray-500 font-mono mb-6">
                    Transaction ID: {sendPaymentFlow.transactionId}
                  </p>
                  <button
                    onClick={() => {
                      cancelPayment();
                      setSelectedTab("home");
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {selectedTab === "activity" && (
          <div className="space-y-6">
            {/* Transactions */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-300">Recent Transactions</h2>
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 bg-gray-900/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`text-2xl ${tx.type === "send" ? "rotate-180" : ""}`}>
                            {tx.type === "send" ? "📤" : "📥"}
                          </div>
                          <div>
                            <p className="font-medium">
                              {tx.type === "send" ? "Sent to" : "Received from"} {tx.umaAddress}
                            </p>
                            <p className="text-sm text-gray-400">{formatTimestamp(tx.timestamp)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${tx.type === "send" ? "text-red-400" : "text-green-400"}`}>
                            {tx.type === "send" ? "-" : "+"}{formatCurrency(tx.amount, tx.currency)}
                          </p>
                          <p className={`text-xs px-2 py-1 rounded-full inline-block ${
                            tx.status === "completed" ? "bg-green-900/50 text-green-400" :
                            tx.status === "pending" ? "bg-yellow-900/50 text-yellow-400" :
                            "bg-red-900/50 text-red-400"
                          }`}>
                            {tx.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Logs */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-300">Activity Log</h2>
              {activityLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No activity yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-gray-900/50 rounded-lg text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            log.status === "success" ? "bg-green-400" :
                            log.status === "pending" ? "bg-yellow-400" :
                            "bg-red-400"
                          }`}></div>
                          <p className="font-mono text-gray-300">{log.type}</p>
                        </div>
                        <p className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</p>
                      </div>
                      {log.details && (
                        <pre className="mt-2 text-xs text-gray-500 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UMAPage() {
  return (
    <SparkWalletProvider>
      <UMAProvider>
        <UMAContent />
      </UMAProvider>
    </SparkWalletProvider>
  );
}