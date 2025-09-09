'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSparkWallet } from '@/contexts/SparkWalletContext';
import {
  CreateLightningInvoiceParams,
  PayLightningInvoiceParams,
  WithdrawParams,
} from '@/types/spark-wallet';

// Hook for wallet initialization
export const useWalletInit = () => {
  const { initializeWallet, isInitialized, isLoading, error } = useSparkWallet();
  const [mnemonic, setMnemonic] = useState<string>('');

  const generateNewWallet = useCallback(async () => {
    try {
      const result = await initializeWallet({});
      return result;
    } catch (err) {
      console.error('Failed to generate new wallet:', err);
      return null;
    }
  }, [initializeWallet]);

  const restoreWallet = useCallback(async (mnemonicPhrase: string) => {
    try {
      await initializeWallet({ mnemonicOrSeed: mnemonicPhrase });
      return true;
    } catch (err) {
      console.error('Failed to restore wallet:', err);
      return false;
    }
  }, [initializeWallet]);

  return {
    generateNewWallet,
    restoreWallet,
    isInitialized,
    isLoading,
    error,
    mnemonic,
    setMnemonic,
  };
};

// Hook for wallet balance
export const useWalletBalance = () => {
  const { balance, getBalance, isLoading } = useSparkWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshBalance = useCallback(async () => {
    setIsRefreshing(true);
    await getBalance();
    setIsRefreshing(false);
  }, [getBalance]);

  useEffect(() => {
    // Auto-refresh balance every 30 seconds
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [refreshBalance]);

  const formatBalance = useCallback((sats: bigint | undefined) => {
    if (!sats) return '0';
    const btc = Number(sats) / 100000000;
    return btc.toFixed(8);
  }, []);

  return {
    balance,
    balanceInBTC: formatBalance(balance?.balance),
    balanceInSats: balance?.balance?.toString() || '0',
    tokenBalances: balance?.tokenBalances,
    refreshBalance,
    isRefreshing: isRefreshing || isLoading,
  };
};

// Hook for transfers
export const useTransfers = () => {
  const { transfer, getTransfers, transfers, isLoading, error } = useSparkWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const sendTransfer = useCallback(async () => {
    if (!recipient || !amount) {
      throw new Error('Recipient and amount are required');
    }
    
    const amountSats = parseInt(amount);
    if (isNaN(amountSats) || amountSats <= 0) {
      throw new Error('Invalid amount');
    }

    return await transfer(recipient, amountSats);
  }, [recipient, amount, transfer]);

  const loadTransfers = useCallback(async (limit?: number, offset?: number) => {
    await getTransfers(limit, offset);
  }, [getTransfers]);

  useEffect(() => {
    // Load initial transfers
    loadTransfers(20, 0);
  }, [loadTransfers]);

  return {
    transfers,
    sendTransfer,
    loadTransfers,
    recipient,
    setRecipient,
    amount,
    setAmount,
    isLoading,
    error,
  };
};

// Hook for Lightning payments
export const useLightning = () => {
  const {
    createLightningInvoice,
    payLightningInvoice,
    getLightningSendFeeEstimate,
    lightningInvoices,
    lightningSendRequests,
    isLoading,
    error,
  } = useSparkWallet();

  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceMemo, setInvoiceMemo] = useState('');
  const [paymentInvoice, setPaymentInvoice] = useState('');

  const createInvoice = useCallback(async () => {
    if (!invoiceAmount) {
      throw new Error('Amount is required');
    }

    const params: CreateLightningInvoiceParams = {
      amountSats: parseInt(invoiceAmount),
      memo: invoiceMemo || undefined,
      expirySeconds: 3600, // 1 hour
    };

    return await createLightningInvoice(params);
  }, [invoiceAmount, invoiceMemo, createLightningInvoice]);

  const payInvoice = useCallback(async (maxFee?: number) => {
    if (!paymentInvoice) {
      throw new Error('Invoice is required');
    }

    const params: PayLightningInvoiceParams = {
      invoice: paymentInvoice,
      maxFeeSats: maxFee || 10,
    };

    return await payLightningInvoice(params);
  }, [paymentInvoice, payLightningInvoice]);

  const estimateFee = useCallback(async (invoice: string) => {
    return await getLightningSendFeeEstimate(invoice);
  }, [getLightningSendFeeEstimate]);

  return {
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
  };
};

// Hook for deposits
export const useDeposits = () => {
  const {
    getSingleUseDepositAddress,
    getStaticDepositAddress,
    getUnusedDepositAddresses,
    claimDeposit,
    depositAddresses,
    isLoading,
    error,
  } = useSparkWallet();

  const [selectedDepositType, setSelectedDepositType] = useState<'single' | 'static'>('single');
  const [depositTxId, setDepositTxId] = useState('');

  const generateDepositAddress = useCallback(async () => {
    if (selectedDepositType === 'single') {
      return await getSingleUseDepositAddress();
    } else {
      return await getStaticDepositAddress();
    }
  }, [selectedDepositType, getSingleUseDepositAddress, getStaticDepositAddress]);

  const loadUnusedAddresses = useCallback(async () => {
    return await getUnusedDepositAddresses();
  }, [getUnusedDepositAddresses]);

  const claimDepositFunds = useCallback(async () => {
    if (!depositTxId) {
      throw new Error('Transaction ID is required');
    }
    return await claimDeposit(depositTxId);
  }, [depositTxId, claimDeposit]);

  return {
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
  };
};

// Hook for withdrawals
export const useWithdrawals = () => {
  const {
    withdraw,
    getWithdrawalFeeQuote,
    getCoopExitRequest,
    isLoading,
    error,
  } = useSparkWallet();

  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [exitSpeed, setExitSpeed] = useState<'FAST' | 'MEDIUM' | 'SLOW'>('MEDIUM');
  const [feeQuote, setFeeQuote] = useState<any>(null);

  const getFeeQuote = useCallback(async () => {
    if (!withdrawAddress || !withdrawAmount) {
      throw new Error('Address and amount are required');
    }

    const amountSats = parseInt(withdrawAmount);
    if (isNaN(amountSats) || amountSats <= 0) {
      throw new Error('Invalid amount');
    }

    const quote = await getWithdrawalFeeQuote(amountSats, withdrawAddress);
    setFeeQuote(quote);
    return quote;
  }, [withdrawAddress, withdrawAmount, getWithdrawalFeeQuote]);

  const executeWithdrawal = useCallback(async () => {
    if (!withdrawAddress || !withdrawAmount) {
      throw new Error('Address and amount are required');
    }

    const amountSats = parseInt(withdrawAmount);
    if (isNaN(amountSats) || amountSats <= 0) {
      throw new Error('Invalid amount');
    }

    const params: WithdrawParams = {
      onchainAddress: withdrawAddress,
      exitSpeed,
      amountSats,
      feeQuote,
    };

    return await withdraw(params);
  }, [withdrawAddress, withdrawAmount, exitSpeed, feeQuote, withdraw]);

  const checkWithdrawalStatus = useCallback(async (id: string) => {
    return await getCoopExitRequest(id);
  }, [getCoopExitRequest]);

  return {
    getFeeQuote,
    executeWithdrawal,
    checkWithdrawalStatus,
    withdrawAddress,
    setWithdrawAddress,
    withdrawAmount,
    setWithdrawAmount,
    exitSpeed,
    setExitSpeed,
    feeQuote,
    isLoading,
    error,
  };
};

// Hook for QR code generation
export const useQRCode = () => {
  const generateQRData = useCallback((data: string, type: 'address' | 'invoice' = 'address') => {
    if (type === 'address') {
      return `bitcoin:${data}`;
    }
    return data; // Lightning invoices are already in the correct format
  }, []);

  return { generateQRData };
};

// Hook for clipboard operations
export const useClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  }, []);

  return { copyToClipboard, copied };
};

// Hook for formatting utilities
export const useFormatters = () => {
  const formatSats = useCallback((sats: number | bigint | string): string => {
    const num = typeof sats === 'bigint' ? Number(sats) : Number(sats);
    return num.toLocaleString();
  }, []);

  const formatBTC = useCallback((sats: number | bigint | string): string => {
    const num = typeof sats === 'bigint' ? Number(sats) : Number(sats);
    const btc = num / 100000000;
    return btc.toFixed(8);
  }, []);

  const satsToBTC = useCallback((sats: number | bigint | string): number => {
    const num = typeof sats === 'bigint' ? Number(sats) : Number(sats);
    return num / 100000000;
  }, []);

  const btcToSats = useCallback((btc: number | string): number => {
    const num = typeof btc === 'string' ? parseFloat(btc) : btc;
    return Math.floor(num * 100000000);
  }, []);

  const truncateAddress = useCallback((address: string, chars: number = 6): string => {
    if (!address) return '';
    if (address.length <= chars * 2) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }, []);

  const formatTimestamp = useCallback((timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  }, []);

  return {
    formatSats,
    formatBTC,
    satsToBTC,
    btcToSats,
    truncateAddress,
    formatTimestamp,
  };
};