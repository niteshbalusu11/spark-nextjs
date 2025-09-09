"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type {
  UMAAccount,
  UMATransaction,
  UMABalance,
  ActivityLog,
  MockRecipient,
  UMAConfig,
  SendPaymentFlow,
  PayRequest,
  PayReqResponse,
  LNURLPResponse,
} from "@/types/uma";
import {
  saveUMAAccount,
  loadUMAAccount,
  clearUMAAccount,
  saveUMABalance,
  loadUMABalance,
  saveUMAConfig,
  loadUMAConfig,
  saveTransaction,
  loadTransactions,
  saveActivityLog,
  loadActivityLogs,
  saveRecipient,
  loadRecipients,
  findRecipientByAddress,
  clearAllUMAData,
  initializeMockRecipients,
  isStorageAvailable,
} from "@/utils/umaPersistence";

interface UMAState {
  account: UMAAccount | null;
  balance: UMABalance | null;
  transactions: UMATransaction[];
  activityLogs: ActivityLog[];
  recipients: MockRecipient[];
  config: Partial<UMAConfig> | null;
  isLoading: boolean;
  error: string | null;
  sendPaymentFlow: SendPaymentFlow | null;
}

interface UMAContextType extends UMAState {
  // Account Management
  createUMAAccount: (username: string) => Promise<UMAAccount | null>;
  loadAccount: () => Promise<void>;
  clearAccount: () => void;
  
  // Balance Management
  updateBalance: (balance: UMABalance) => void;
  refreshBalance: () => Promise<void>;
  
  // Transaction Management
  addTransaction: (transaction: UMATransaction) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  
  // Activity Logging
  logActivity: (log: ActivityLog) => Promise<void>;
  refreshActivityLogs: () => Promise<void>;
  
  // Recipients Management
  addRecipient: (recipient: MockRecipient) => Promise<void>;
  refreshRecipients: () => Promise<void>;
  getRecipientByAddress: (address: string) => Promise<MockRecipient | null>;
  
  // Payment Flow
  startSendPayment: () => void;
  selectRecipient: (recipient: MockRecipient) => void;
  setPaymentAmount: (amount: number, currency: string) => void;
  confirmPayment: () => Promise<void>;
  cancelPayment: () => void;
  
  // UMA Protocol Operations
  resolveLNURLPAddress: (umaAddress: string) => Promise<LNURLPResponse | null>;
  createPayRequest: (
    params: PayRequest,
    callback: string,
  ) => Promise<PayReqResponse | null>;
  sendPayment: (invoice: string, amount: number) => Promise<UMATransaction | null>;
  
  // Utility
  clearError: () => void;
  clearAllData: () => Promise<void>;
  initializeMockData: () => Promise<void>;
}

const getInitialState = (): UMAState => {
  return {
    account: null,
    balance: null,
    transactions: [],
    activityLogs: [],
    recipients: [],
    config: null,
    isLoading: false,
    error: null,
    sendPaymentFlow: null,
  };
};

const UMAContext = createContext<UMAContextType | undefined>(undefined);

export const useUMA = () => {
  const context = useContext(UMAContext);
  if (!context) {
    throw new Error("useUMA must be used within a UMAProvider");
  }
  return context;
};

interface UMAProviderProps {
  children: ReactNode;
}

export const UMAProvider: React.FC<UMAProviderProps> = ({ children }) => {
  const [state, setState] = useState<UMAState>(getInitialState);

  // Load persisted data on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      if (!isStorageAvailable()) return;

      try {
        // Load account
        const account = loadUMAAccount();
        if (account) {
          setState(prev => ({ ...prev, account }));
        }

        // Load balance
        const balance = loadUMABalance();
        if (balance) {
          setState(prev => ({ ...prev, balance }));
        }

        // Load config
        const config = loadUMAConfig();
        if (config) {
          setState(prev => ({ ...prev, config }));
        }

        // Load transactions
        const transactions = await loadTransactions();
        setState(prev => ({ ...prev, transactions }));

        // Load activity logs
        const activityLogs = await loadActivityLogs();
        setState(prev => ({ ...prev, activityLogs }));

        // Load recipients
        const recipients = await loadRecipients();
        if (recipients.length === 0) {
          // Initialize with mock recipients if none exist
          await initializeMockRecipients();
          const newRecipients = await loadRecipients();
          setState(prev => ({ ...prev, recipients: newRecipients }));
        } else {
          setState(prev => ({ ...prev, recipients }));
        }
      } catch (error) {
        console.error('Failed to load persisted data:', error);
      }
    };

    loadPersistedData();
  }, []);

  const setLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Account Management
  const createUMAAccount = useCallback(async (username: string): Promise<UMAAccount | null> => {
    try {
      setLoading(true);
      setError(null);

      // Get domain from config or use default
      const domain = state.config?.vaspDomain || 'spark-wallet.com';
      
      const account: UMAAccount = {
        id: crypto.randomUUID(),
        address: `$${username}@${domain}`,
        username,
        domain,
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      saveUMAAccount(account);
      setState(prev => ({ ...prev, account }));

      // Log activity
      await logActivity({
        id: crypto.randomUUID(),
        type: 'lnurlp_request',
        timestamp: new Date().toISOString(),
        details: { action: 'account_created', address: account.address },
        status: 'success',
      });

      setLoading(false);
      return account;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create UMA account');
      setLoading(false);
      return null;
    }
  }, [state.config]);

  const loadAccount = useCallback(async () => {
    try {
      const account = loadUMAAccount();
      setState(prev => ({ ...prev, account }));
    } catch (error) {
      console.error('Failed to load account:', error);
    }
  }, []);

  const clearAccount = useCallback(() => {
    clearUMAAccount();
    setState(prev => ({ ...prev, account: null }));
  }, []);

  // Balance Management
  const updateBalance = useCallback((balance: UMABalance) => {
    saveUMABalance(balance);
    setState(prev => ({ ...prev, balance }));
  }, []);

  const refreshBalance = useCallback(async () => {
    try {
      // In a real implementation, this would fetch from the server
      // For now, we'll simulate with mock data
      const mockBalance: UMABalance = {
        fiatBalance: 1000.00,
        fiatCurrency: 'USD',
        btcBalance: 0.025,
        lightningBalance: 500000, // in sats
        lastUpdated: new Date().toISOString(),
      };
      
      updateBalance(mockBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [updateBalance]);

  // Transaction Management
  const addTransaction = useCallback(async (transaction: UMATransaction) => {
    try {
      await saveTransaction(transaction);
      setState(prev => ({
        ...prev,
        transactions: [transaction, ...prev.transactions],
      }));
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  }, []);

  const refreshTransactions = useCallback(async () => {
    try {
      const transactions = await loadTransactions();
      setState(prev => ({ ...prev, transactions }));
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
    }
  }, []);

  // Activity Logging
  const logActivity = useCallback(async (log: ActivityLog) => {
    try {
      await saveActivityLog(log);
      setState(prev => ({
        ...prev,
        activityLogs: [log, ...prev.activityLogs],
      }));
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }, []);

  const refreshActivityLogs = useCallback(async () => {
    try {
      const activityLogs = await loadActivityLogs();
      setState(prev => ({ ...prev, activityLogs }));
    } catch (error) {
      console.error('Failed to refresh activity logs:', error);
    }
  }, []);

  // Recipients Management
  const addRecipient = useCallback(async (recipient: MockRecipient) => {
    try {
      await saveRecipient(recipient);
      setState(prev => ({
        ...prev,
        recipients: [...prev.recipients, recipient],
      }));
    } catch (error) {
      console.error('Failed to add recipient:', error);
    }
  }, []);

  const refreshRecipients = useCallback(async () => {
    try {
      const recipients = await loadRecipients();
      setState(prev => ({ ...prev, recipients }));
    } catch (error) {
      console.error('Failed to refresh recipients:', error);
    }
  }, []);

  const getRecipientByAddress = useCallback(async (address: string): Promise<MockRecipient | null> => {
    return await findRecipientByAddress(address);
  }, []);

  // Payment Flow
  const startSendPayment = useCallback(() => {
    setState(prev => ({
      ...prev,
      sendPaymentFlow: {
        step: 'select_recipient',
      },
    }));
  }, []);

  const selectRecipient = useCallback((recipient: MockRecipient) => {
    setState(prev => ({
      ...prev,
      sendPaymentFlow: {
        ...prev.sendPaymentFlow,
        step: 'enter_amount',
        recipient,
      } as SendPaymentFlow,
    }));
  }, []);

  const setPaymentAmount = useCallback((amount: number, currency: string) => {
    setState(prev => {
      if (!prev.sendPaymentFlow) return prev;
      
      // Mock exchange rate calculation
      const exchangeRate = 0.000025; // 1 USD = 0.000025 BTC
      const receivingAmount = currency === 'USD' ? amount * exchangeRate : amount;
      const receivingCurrency = currency === 'USD' ? 'BTC' : 'USD';
      
      return {
        ...prev,
        sendPaymentFlow: {
          ...prev.sendPaymentFlow,
          step: 'confirm',
          amount,
          currency,
          receivingAmount,
          receivingCurrency,
          exchangeRate,
          fees: {
            network: 0.001,
            service: 0.002,
            total: 0.003,
          },
        } as SendPaymentFlow,
      };
    });
  }, []);

  const confirmPayment = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!state.sendPaymentFlow?.recipient || !state.sendPaymentFlow?.amount) {
        throw new Error('Payment details missing');
      }

      setState(prev => ({
        ...prev,
        sendPaymentFlow: prev.sendPaymentFlow ? {
          ...prev.sendPaymentFlow,
          step: 'processing',
        } : null,
      }));

      const lnurlpResponse = await resolveLNURLPAddress(state.sendPaymentFlow.recipient.umaAddress);
      if (!lnurlpResponse) {
        throw new Error('Failed to resolve LNURLP address');
      }

      const payRequest = await createPayRequest(
        {
          amount: state.sendPaymentFlow.amount,
          currency: state.sendPaymentFlow.currency || 'USD',
          payerIdentifier: state.account?.address || '',
          payerKycStatus: 'VERIFIED', // Assuming verified for this example
        },
        lnurlpResponse.callback,
      );

      if (!payRequest) {
        throw new Error('Failed to create pay request');
      }

      const paymentResult = await sendPayment(payRequest.pr, state.sendPaymentFlow.amount);

      if (!paymentResult) {
        throw new Error('Payment failed');
      }

      setState(prev => ({
        ...prev,
        sendPaymentFlow: prev.sendPaymentFlow ? {
          ...prev.sendPaymentFlow,
          step: 'complete',
          transactionId: paymentResult.id,
        } : null,
      }));

      // Update balance
      await refreshBalance();

      setLoading(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment failed');
      setLoading(false);
    }
  }, [state.sendPaymentFlow, state.account, addTransaction, refreshBalance]);

  const cancelPayment = useCallback(() => {
    setState(prev => ({ ...prev, sendPaymentFlow: null }));
  }, []);

  // UMA Protocol Operations (Mock implementations)
  const resolveLNURLPAddress = useCallback(async (umaAddress: string): Promise<LNURLPResponse | null> => {
    try {
      await logActivity({
        id: crypto.randomUUID(),
        type: 'lnurlp_request',
        timestamp: new Date().toISOString(),
        details: { umaAddress },
        status: 'pending',
      });

      const response = await fetch(`/api/uma/lnurlp?receiver=${umaAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch LNURLP data');
      }
      const data = await response.json();

      await logActivity({
        id: crypto.randomUUID(),
        type: 'lnurlp_response',
        timestamp: new Date().toISOString(),
        details: data,
        status: 'success',
      });

      return data;
    } catch (error) {
      console.error('Failed to resolve LNURLP address:', error);
      setError(error instanceof Error ? error.message : 'Failed to resolve LNURLP address');
      return null;
    }
  }, [logActivity]);

  const createPayRequest = useCallback(
    async (params: PayRequest, callback: string): Promise<PayReqResponse | null> => {
      try {
        await logActivity({
          id: crypto.randomUUID(),
          type: 'pay_request',
          timestamp: new Date().toISOString(),
          details: params,
          status: 'pending',
        });

        const response = await fetch(callback, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

      if (!response.ok) {
        throw new Error('Failed to create pay request');
      }
      const data = await response.json();

      await logActivity({
        id: crypto.randomUUID(),
        type: 'pay_response',
        timestamp: new Date().toISOString(),
        details: data,
        status: 'success',
      });

      return data;
    } catch (error) {
      console.error('Failed to create pay request:', error);
      setError(error instanceof Error ? error.message : 'Failed to create pay request');
      return null;
    }
  }, [logActivity]);

  const sendPayment = useCallback(async (invoice: string, amount: number): Promise<UMATransaction | null> => {
    try {
      // This would call the Lightspark client to pay the invoice.
      // Since we're in the browser, we'll simulate this.
      // In a real app, you might have a backend endpoint that does this.
      await logActivity({
        id: crypto.randomUUID(),
        type: 'payment_sent',
        timestamp: new Date().toISOString(),
        details: { invoice, amount },
        status: 'pending',
      });

      // Simulate a delay for payment.
      await new Promise(resolve => setTimeout(resolve, 1000));

      const transaction: UMATransaction = {
        id: crypto.randomUUID(),
        type: 'send',
        umaAddress: state.sendPaymentFlow?.recipient?.umaAddress || '',
        amount,
        currency: 'USD',
        status: 'completed',
        timestamp: new Date().toISOString(),
        invoice,
      };

      await addTransaction(transaction);
      
      await logActivity({
        id: crypto.randomUUID(),
        type: 'payment_sent',
        timestamp: new Date().toISOString(),
        details: { transactionId: transaction.id },
        status: 'success',
      });

      return transaction;
    } catch (error) {
      console.error('Failed to send payment:', error);
      setError(error instanceof Error ? error.message : 'Failed to send payment');
      return null;
    }
  }, [state.sendPaymentFlow, addTransaction, logActivity]);

  // Utility
  const clearAllData = useCallback(async () => {
    try {
      await clearAllUMAData();
      setState(getInitialState());
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }, []);

  const initializeMockData = useCallback(async () => {
    try {
      await initializeMockRecipients();
      await refreshRecipients();
      await refreshBalance();
    } catch (error) {
      console.error('Failed to initialize mock data:', error);
    }
  }, [refreshRecipients, refreshBalance]);

  const value: UMAContextType = {
    ...state,
    createUMAAccount,
    loadAccount,
    clearAccount,
    updateBalance,
    refreshBalance,
    addTransaction,
    refreshTransactions,
    logActivity,
    refreshActivityLogs,
    addRecipient,
    refreshRecipients,
    getRecipientByAddress,
    startSendPayment,
    selectRecipient,
    setPaymentAmount,
    confirmPayment,
    cancelPayment,
    resolveLNURLPAddress,
    createPayRequest,
    sendPayment,
    clearError,
    clearAllData,
    initializeMockData,
  };

  return <UMAContext.Provider value={value}>{children}</UMAContext.Provider>;
};