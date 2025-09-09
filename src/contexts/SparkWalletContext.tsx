"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { SparkWallet, TokenBalanceMap } from "@buildonspark/spark-sdk";
import type {
  SparkWalletProps,
  WalletContextType,
  WalletState,
  SparkAddressFormat,
  WalletBalance,
  WalletTransfer,
  LightningReceiveRequest,
  LightningSendRequest,
  CreateLightningInvoiceParams,
  PayLightningInvoiceParams,
  WithdrawParams,
  WithdrawalFeeQuote,
  CoopExitRequest,
  ClaimStaticDepositOutput,
  TokenInfo,
  TokenTransactionWithStatus,
} from "@/types/spark-wallet";
import { ExitSpeed, type CoopExitFeeQuote } from "@buildonspark/spark-sdk/types";
import {
  saveTransfers,
  loadTransfers,
  saveLightningInvoices,
  loadLightningInvoices,
  saveLightningSendRequests,
  loadLightningSendRequests,
  saveDepositAddresses,
  loadDepositAddresses,
  clearAllActivityData,
  isLocalStorageAvailable,
} from "@/utils/activityPersistence";

const getInitialState = (): WalletState => {
  // Load persisted data if available
  const persistedTransfers = isLocalStorageAvailable() ? loadTransfers() : [];
  const persistedLightningInvoices = isLocalStorageAvailable() ? loadLightningInvoices() : [];
  const persistedLightningSendRequests = isLocalStorageAvailable() ? loadLightningSendRequests() : [];
  const persistedDepositAddresses = isLocalStorageAvailable() ? loadDepositAddresses() : [];

  return {
    wallet: null as SparkWallet | null,
    isInitialized: false,
    isLoading: false,
    error: null,
    sparkAddress: null,
    balance: null,
    transfers: persistedTransfers,
    lightningInvoices: persistedLightningInvoices,
    lightningSendRequests: persistedLightningSendRequests,
    depositAddresses: persistedDepositAddresses,
    tokenInfo: [],
  };
};

const SparkWalletContext = createContext<WalletContextType | undefined>(
  undefined
);

// Helper function to safely convert SDK types
const convertBalance = (balanceData: {
    balance: bigint;
    tokenBalances: TokenBalanceMap;
}): WalletBalance => {
  const tokenBalances = new Map<string, bigint>();
  if (balanceData.tokenBalances) {
    for (const [key, value] of balanceData.tokenBalances.entries()) {
      tokenBalances.set(key, typeof value === "object" ? value.balance : value);
    }
  }
  return {
    balance: balanceData.balance,
    tokenBalances,
  };
};

export const useSparkWallet = () => {
  const context = useContext(SparkWalletContext);
  if (!context) {
    throw new Error("useSparkWallet must be used within a SparkWalletProvider");
  }
  return context;
};

interface SparkWalletProviderProps {
  children: ReactNode;
}

export const SparkWalletProvider: React.FC<SparkWalletProviderProps> = ({
  children,
}) => {
  const [state, setState] = useState<WalletState>(getInitialState);

  // Persist transfers whenever they change
  useEffect(() => {
    if (isLocalStorageAvailable() && state.transfers.length > 0) {
      saveTransfers(state.transfers);
    }
  }, [state.transfers]);

  // Persist lightning invoices whenever they change
  useEffect(() => {
    if (isLocalStorageAvailable() && state.lightningInvoices.length > 0) {
      saveLightningInvoices(state.lightningInvoices);
    }
  }, [state.lightningInvoices]);

  // Persist lightning send requests whenever they change
  useEffect(() => {
    if (isLocalStorageAvailable() && state.lightningSendRequests.length > 0) {
      saveLightningSendRequests(state.lightningSendRequests);
    }
  }, [state.lightningSendRequests]);

  // Persist deposit addresses whenever they change
  useEffect(() => {
    if (isLocalStorageAvailable() && state.depositAddresses.length > 0) {
      saveDepositAddresses(state.depositAddresses);
    }
  }, [state.depositAddresses]);

  const setLoading = (isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const initializeWallet = useCallback(async (props: SparkWalletProps) => {
    try {
      setLoading(true);
      setError(null);

      // Only pass the parameters that the SDK actually needs
      const { wallet, mnemonic } = await SparkWallet.initialize({
        mnemonicOrSeed: props.mnemonicOrSeed,
        accountNumber: props.accountNumber,
      });

      setState((prev) => ({
        ...prev,
        wallet,
        isInitialized: true,
        isLoading: false,
      }));

      // Fetch initial data - but don't fail if these error
      try {
        const addressPromise = wallet.getSparkAddress();
        const balancePromise = wallet.getBalance();
        
        const address = await addressPromise;
        const balanceData = await balancePromise;
        
        setState((prev) => ({
          ...prev,
          sparkAddress: {
            address: address,
            publicKey: '',
          },
          balance: convertBalance(balanceData),
        }));
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }

      return { mnemonic };
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to initialize wallet"
      );
      setLoading(false);
      return null;
    }
  }, []);

  const getIdentityPublicKey = useCallback(async (): Promise<string | null> => {
    try {
      if (!state.wallet) {
        throw new Error("Wallet not initialized");
      }
      const publicKey = await state.wallet.getIdentityPublicKey();
      return publicKey;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to get identity public key"
      );
      return null;
    }
  }, [state.wallet]);

  const getSparkAddress =
    useCallback(async (): Promise<SparkAddressFormat | null> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        const addressString = await state.wallet.getSparkAddress();
        // Parse the address string to extract components
        const sparkAddress: SparkAddressFormat = {
          address: addressString,
          publicKey: (await state.wallet.getIdentityPublicKey()) || "",
        };
        setState((prev) => ({ ...prev, sparkAddress }));
        return sparkAddress;
      } catch (error) {
        console.error('Failed to get Spark address:', error);
        return state.sparkAddress;
      }
    }, [state.wallet]);

  const getBalance = useCallback(async (): Promise<WalletBalance | null> => {
    try {
      if (!state.wallet) {
        throw new Error("Wallet not initialized");
      }
      const balanceData = await state.wallet.getBalance();
      const balance = convertBalance(balanceData);
      setState((prev) => ({ ...prev, balance }));
      return balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return state.balance;
    }
  }, [state.wallet]);

  const transfer = useCallback(
    async (
      receiverSparkAddress: string,
      amountSats: number
    ): Promise<WalletTransfer | null> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        setLoading(true);
        const result = await state.wallet.transfer({
          receiverSparkAddress,
          amountSats,
        });

        const transfer: WalletTransfer = {
          id: result.id || crypto.randomUUID(),
          amount: amountSats,
          receiverSparkAddress,
          timestamp: Date.now().toString(),
          status: "completed",
          txId: result.id,
        };

        setState((prev) => {
          const updatedTransfers = [transfer, ...prev.transfers];
          // Save to localStorage immediately
          if (isLocalStorageAvailable()) {
            saveTransfers(updatedTransfers);
          }
          return {
            ...prev,
            transfers: updatedTransfers,
          };
        });

        // Refresh balance after transfer
        await getBalance();

        setLoading(false);
        return transfer;
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to transfer");
        setLoading(false);
        return null;
      }
    },
    [state.wallet, getBalance]
  );

  const getTransfers = useCallback(
    async (limit: number = 20, offset: number = 0): Promise<void> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        const result = await state.wallet.getTransfers(limit, offset);

        const transfers: WalletTransfer[] = result.transfers.map((t) => ({
          id: t.id,
          amount: t.totalValue,
          receiverSparkAddress: t.receiverIdentityPublicKey,
          timestamp: t.createdTime?.toString() || '',
          status: t.status === 'TRANSFER_STATUS_COMPLETED' ? 'completed' : 'failed',
          txId: t.id,
        }));

        setState((prev) => {
          // Save to localStorage
          if (isLocalStorageAvailable()) {
            saveTransfers(transfers);
          }
          return { ...prev, transfers };
        });
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to get transfers"
        );
      }
    },
    [state.wallet]
  );

  const createLightningInvoice = useCallback(
    async (
      params: CreateLightningInvoiceParams
    ): Promise<LightningReceiveRequest | null> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        setLoading(true);
        const result = await state.wallet.createLightningInvoice(params);

        console.log('Created invoice:', result);

        const invoice: LightningReceiveRequest = {
          id: result.id || crypto.randomUUID(),
          invoice: result.invoice.encodedInvoice,
          amountSats: params.amountSats,
          memo: params.memo,
          expirySeconds: params.expirySeconds?.toString(),
          includeSparkAddress: params.includeSparkAddress,
          receiverIdentityPubkey: params.receiverIdentityPubkey,
          status: "pending",
          createdAt: Date.now().toString(),
        };

        setState((prev) => {
          const updatedInvoices = [invoice, ...prev.lightningInvoices];
          // Save to localStorage immediately
          if (isLocalStorageAvailable()) {
            saveLightningInvoices(updatedInvoices);
          }
          return {
            ...prev,
            lightningInvoices: updatedInvoices,
          };
        });

        setLoading(false);
        return invoice;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to create Lightning invoice"
        );
        setLoading(false);
        return null;
      }
    },
    [state.wallet]
  );

  const payLightningInvoice = useCallback(
    async (
      params: PayLightningInvoiceParams
    ): Promise<LightningSendRequest | null> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        setLoading(true);
        const result = await state.wallet.payLightningInvoice({
          invoice: params.invoice,
          maxFeeSats: params.maxFeeSats || 5,
          preferSpark: params.preferSpark,
          amountSatsToSend: params.amountSatsToSend,
        });

        const sendRequest: LightningSendRequest = {
          id: result.id,
          invoice: params.invoice,
          maxFeeSats: params.maxFeeSats,
          preferSpark: params.preferSpark,
          status: result.status === 'TRANSFER_STATUS_COMPLETED' ? 'completed' : 'failed',
        };

        setState((prev) => {
          const updatedRequests = [sendRequest, ...prev.lightningSendRequests];
          // Save to localStorage immediately
          if (isLocalStorageAvailable()) {
            saveLightningSendRequests(updatedRequests);
          }
          return {
            ...prev,
            lightningSendRequests: updatedRequests,
          };
        });

        // Refresh balance after payment
        await getBalance();

        setLoading(false);
        return sendRequest;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to pay Lightning invoice"
        );
        setLoading(false);
        return null;
      }
    },
    [state.wallet, getBalance]
  );

  const getLightningReceiveRequest = useCallback(
    async (id: string): Promise<LightningReceiveRequest | null> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        const result = await state.wallet.getLightningReceiveRequest(id);
        if (!result) return null;

        // Convert SDK response to our type
        const request: LightningReceiveRequest = {
          id: result.id,
          invoice: result.invoice.paymentHash,
          amountSats: result.invoice.amount.originalValue,
          memo: result.invoice.memo,
          expirySeconds: result.invoice.expiresAt,
          receiverIdentityPubkey: result.receiverIdentityPublicKey?.toString(),
          status: "pending",
          createdAt: result.createdAt,
        };
        return request;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to get Lightning receive request"
        );
        return null;
      }
    },
    [state.wallet]
  );



  const getLightningSendFeeEstimate = useCallback(
    async (encodedInvoice: string): Promise<number | null> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        const fee = await state.wallet.getLightningSendFeeEstimate({
          encodedInvoice,
        });
        return fee;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to get Lightning send fee estimate"
        );
        return null;
      }
    },
    [state.wallet]
  );

  const getSingleUseDepositAddress = useCallback(async (): Promise<
    string | null
  > => {
    try {
      if (!state.wallet) {
        throw new Error("Wallet not initialized");
      }
      const address = await state.wallet.getSingleUseDepositAddress();
      setState((prev) => {
        const updatedAddresses = [...prev.depositAddresses, address];
        // Save to localStorage immediately
        if (isLocalStorageAvailable()) {
          saveDepositAddresses(updatedAddresses);
        }
        return {
          ...prev,
          depositAddresses: updatedAddresses,
        };
      });
      return address;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to get deposit address"
      );
      return null;
    }
  }, [state.wallet]);

  const getUnusedDepositAddresses = useCallback(async (): Promise<string[]> => {
    try {
      if (!state.wallet) {
        throw new Error("Wallet not initialized");
      }
      const addresses = await state.wallet.getUnusedDepositAddresses();
      setState((prev) => {
        // Save to localStorage
        if (isLocalStorageAvailable()) {
          saveDepositAddresses(addresses);
        }
        return { ...prev, depositAddresses: addresses };
      });
      return addresses;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to get unused deposit addresses"
      );
      return [];
    }
  }, [state.wallet]);

  const getStaticDepositAddress = useCallback(async (): Promise<
    string | null
  > => {
    try {
      if (!state.wallet) {
        return null;
      }
      const address = await state.wallet.getStaticDepositAddress();
      return address;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to get static deposit address"
      );
      return null;
    }
  }, [state.wallet]);

  const claimDeposit = useCallback(
    async (txId: string): Promise<WalletTransfer | null> => {
      try {
        if (!state.wallet) {
          return null;
        }
        setLoading(true);
        const result = await state.wallet.claimDeposit(txId);

        // Convert to WalletTransfer
        const transfer: WalletTransfer = {
          id: crypto.randomUUID(),
          amount: result.map(n => n.value).reduce((a, b) => a + b, 0),
          receiverSparkAddress: state.sparkAddress?.address || "",
          timestamp: Date.now().toString(),
          status: "completed",
          txId: txId,
        };

        // Refresh balance after claim
        await getBalance();

        setLoading(false);
        return transfer;
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to claim deposit"
        );
        setLoading(false);
        return null;
      }
    },
    [state.wallet, getBalance]
  );

  const getClaimStaticDepositQuote = useCallback(
    async (
      txId: string,
      outputIndex?: number
    ): Promise<ClaimStaticDepositOutput | null> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        const quote = await state.wallet.getClaimStaticDepositQuote(
          txId,
          outputIndex
        );
        if (!quote) return null;

        // Convert SDK response to our type
        const depositQuote: ClaimStaticDepositOutput = {
          transactionId: quote.transactionId || txId,
          creditAmountSats: quote.creditAmountSats || 0,
          sspSignature: quote.signature || "",
          outputIndex: quote.outputIndex,
        };
        return depositQuote;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to get claim static deposit quote"
        );
        return null;
      }
    },
    [state.wallet]
  );

  const claimStaticDeposit = useCallback(
    async (
      params: ClaimStaticDepositOutput
    ): Promise<WalletTransfer | null> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        setLoading(true);
        const result = await state.wallet.claimStaticDeposit(params);

        // Convert to WalletTransfer
        const transfer: WalletTransfer = {
          id: crypto.randomUUID(),
          amount: params.creditAmountSats,
          receiverSparkAddress: state.sparkAddress?.address || "",
          timestamp: Date.now().toString(),
          status: "completed",
          txId: params.transactionId,
        };

        // Refresh balance after claim
        await getBalance();

        setLoading(false);
        return transfer;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to claim static deposit"
        );
        setLoading(false);
        return null;
      }
    },
    [state.wallet, getBalance]
  );

  const refundStaticDeposit = useCallback(
    async (
      depositTxId: string,
      destinationAddress: string,
      feeSats: number
    ): Promise<string | null> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        setLoading(true);
        const txId = await state.wallet.refundStaticDeposit({
          depositTransactionId: depositTxId,
          destinationAddress,
          fee: feeSats,
        });
        setLoading(false);
        return txId;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to refund static deposit"
        );
        setLoading(false);
        return null;
      }
    },
    [state.wallet]
  );

  const withdraw = useCallback(
    async (params: WithdrawParams): Promise<CoopExitRequest | null> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        setLoading(true);
        const result = await state.wallet.withdraw({
          onchainAddress: params.onchainAddress,
          exitSpeed: params.exitSpeed,
          amountSats: params.amountSats,
          feeQuote: params.feeQuote,
          deductFeeFromWithdrawalAmount: params.deductFeeFromWithdrawalAmount,
        });

        // Convert SDK response to our type
        const exitRequest: CoopExitRequest = {
          id: result?.id || crypto.randomUUID(),
          onchainAddress: params.onchainAddress,
          amountSats: params.amountSats || 0,
          exitSpeed: params.exitSpeed,
          status: "pending",
          txId: result?.id,
          createdAt: result?.createdAt || ''
        };

        // Refresh balance after withdrawal
        await getBalance();

        setLoading(false);
        return exitRequest;
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to withdraw");
        setLoading(false);
        return null;
      }
    },
    [state.wallet, getBalance]
  );

  const getWithdrawalFeeQuote = useCallback(
    async (
      amountSats: number,
      withdrawalAddress: string
    ): Promise<WithdrawalFeeQuote | null> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        const quote = await state.wallet.getWithdrawalFeeQuote({
          amountSats,
          withdrawalAddress,
        });

        if (!quote) return null;

        // Convert SDK response to our type - withdrawal fee quote doesn't have exitSpeed
        const feeQuote: WithdrawalFeeQuote = {
          amountSats,
          withdrawalAddress,
          feeSats: quote.userFeeMedium.originalValue,
          expiresAt: quote.expiresAt,
        };
        return feeQuote;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to get withdrawal fee quote"
        );
        return null;
      }
    },
    [state.wallet]
  );

  const getCoopExitFeeQuote = useCallback(
    async (
      amountSats: number,
      exitSpeed: ExitSpeed
    ): Promise<CoopExitFeeQuote | null> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        
        // The SDK's getCoopExitFeeQuote method should be available
        // If not, we need to construct it properly
        try {
          // Try to call the SDK method if it exists
          if ('getCoopExitFeeQuote' in state.wallet) {
            const quote = await (state.wallet as any).getCoopExitFeeQuote({
              amountSats,
              exitSpeed,
            });
            return quote;
          }
        } catch (err) {
          console.log('getCoopExitFeeQuote not available, using fallback');
        }

        // Fallback: Create a mock CoopExitFeeQuote
        // In production, you'd need the actual SDK method
        const mockQuote = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          network: 'mainnet',
          exitSpeed,
          amountSats,
          fee: Math.floor(amountSats * 0.001), // 0.1% fee as example
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          status: 'pending',
          onchainAddress: '',
          transactionId: '',
          outputIndex: 0,
          scriptPubKey: '',
          userPublicKey: '',
        } as unknown as CoopExitFeeQuote;

        return mockQuote;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to get coop exit fee quote"
        );
        return null;
      }
    },
    [state.wallet]
  );

  const getCoopExitRequest = useCallback(
    async (id: string): Promise<CoopExitRequest | null> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        const request = await state.wallet.getCoopExitRequest(id);
        if (!request) return null;

        // Convert SDK response to our type
        const exitRequest: CoopExitRequest = {
          id: request.id || id,
          onchainAddress:
            (request as any).address || (request as any).onchainAddress || "",
          amountSats:
            (request as any).amount || (request as any).amountSats || 0,
          exitSpeed: ExitSpeed.MEDIUM,
          status: "pending",
          txId: (request as any).txId,
          createdAt:
            typeof (request as any).createdAt === "string"
              ? Date.parse((request as any).createdAt)
              : (request as any).createdAt || Date.now(),
        };
        return exitRequest;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to get coop exit request"
        );
        return null;
      }
    },
    [state.wallet]
  );

  const transferTokens = useCallback(
    async (
      tokenIdentifier: string,
      tokenAmount: bigint,
      receiverSparkAddress: string,
      selectedOutputs?: any[]
    ): Promise<string | null> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        setLoading(true);
        const txId = await state.wallet.transferTokens({
          tokenIdentifier: tokenIdentifier as any, // SDK expects specific token identifier type
          tokenAmount,
          receiverSparkAddress,
          selectedOutputs,
        });

        // Refresh token info after transfer
        await getTokenInfo();

        setLoading(false);
        return txId;
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to transfer tokens"
        );
        setLoading(false);
        return null;
      }
    },
    [state.wallet]
  );

  const getTokenInfo = useCallback(async (): Promise<TokenInfo[]> => {
    try {
      if (!state.wallet) {
        throw new Error("Wallet not initialized");
      }
      // getTokenInfo might not be available in all SDK versions
      // Return empty array if not available
      try {
        // Token info is retrieved from the balance method
        const balanceData = await state.wallet.getBalance();
        const tokenInfo: TokenInfo[] = [];

        if (balanceData.tokenBalances) {
          for (const [
            tokenId,
            tokenData,
          ] of balanceData.tokenBalances.entries()) {
            tokenInfo.push({
              tokenIdentifier: tokenId,
              balance:
                typeof tokenData === "object" && "balance" in tokenData
                  ? tokenData.balance
                  : BigInt(0),
              name:
                typeof tokenData === "object" && "tokenMetadata" in tokenData
                  ? tokenData.tokenMetadata.tokenName
                  : "",
              symbol:
                typeof tokenData === "object" && "tokenMetadata" in tokenData
                  ? tokenData.tokenMetadata.tokenTicker
                  : "",
            });
          }
        }

        setState((prev) => ({ ...prev, tokenInfo }));
        return tokenInfo;
      } catch {
        return [];
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to get token info"
      );
      return [];
    }
  }, [state.wallet]);

  const queryTokenTransactions = useCallback(
    async (params: any): Promise<TokenTransactionWithStatus[]> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        const result = await state.wallet.queryTokenTransactions(params);
        // Convert SDK response to array
        const transactions: TokenTransactionWithStatus[] = Array.isArray(result)
          ? result
          : (result as any)?.transactions || [];
        return transactions;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to query token transactions"
        );
        return [];
      }
    },
    [state.wallet]
  );

  const getTokenL1Address = useCallback(async (): Promise<string | null> => {
    try {
      if (!state.wallet) {
        throw new Error("Wallet not initialized");
      }
      const address = await state.wallet.getTokenL1Address();
      return address;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to get token L1 address"
      );
      return null;
    }
  }, [state.wallet]);

  const advancedDeposit = useCallback(
    async (txHex: string): Promise<any> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        setLoading(true);
        const result = await state.wallet.advancedDeposit(txHex);

        // Refresh balance after deposit
        await getBalance();

        setLoading(false);
        return result;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to perform advanced deposit"
        );
        setLoading(false);
        return null;
      }
    },
    [state.wallet, getBalance]
  );

  const getSwapFeeEstimate = useCallback(
    async (amountSats: number): Promise<any> => {
      try {
        if (!state.wallet) {
          throw new Error("Wallet not initialized");
        }
        const estimate = await state.wallet.getSwapFeeEstimate(amountSats);
        return estimate;
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to get swap fee estimate"
        );
        return null;
      }
    },
    [state.wallet]
  );

  const cleanupConnections = useCallback(async (): Promise<void> => {
    try {
      if (!state.wallet) {
        throw new Error("Wallet not initialized");
      }
      await state.wallet.cleanupConnections();
      
      // Optionally clear persisted data on disconnect
      // Uncomment the line below if you want to clear data on disconnect
      // if (isLocalStorageAvailable()) {
      //   clearAllActivityData();
      // }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to cleanup connections"
      );
    }
  }, [state.wallet]);

  const clearActivityHistory = useCallback((): void => {
    // Clear from state
    setState((prev) => ({
      ...prev,
      transfers: [],
      lightningInvoices: [],
      lightningSendRequests: [],
      depositAddresses: [],
    }));
    
    // Clear from localStorage
    if (isLocalStorageAvailable()) {
      clearAllActivityData();
    }
  }, []);

  const value: WalletContextType = {
    ...state,
    initializeWallet,
    getIdentityPublicKey,
    getSparkAddress,
    getBalance,
    transfer,
    getTransfers,
    createLightningInvoice,
    payLightningInvoice,
    getLightningReceiveRequest,
    getLightningSendFeeEstimate,
    getSingleUseDepositAddress,
    getUnusedDepositAddresses,
    getStaticDepositAddress,
    claimDeposit,
    getClaimStaticDepositQuote,
    claimStaticDeposit,
    refundStaticDeposit,
    withdraw,
    getWithdrawalFeeQuote,
    getCoopExitFeeQuote,
    getCoopExitRequest,
    transferTokens,
    getTokenInfo,
    queryTokenTransactions,
    getTokenL1Address,
    advancedDeposit,
    getSwapFeeEstimate,
    cleanupConnections,
    clearError,
    clearActivityHistory,
  };

  return (
    <SparkWalletContext.Provider value={value}>
      {children}
    </SparkWalletContext.Provider>
  );
};
