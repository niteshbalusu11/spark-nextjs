// Spark Wallet Types and Interfaces

import { SparkWallet } from '@buildonspark/spark-sdk';
import { CoopExitFeeQuote, ExitSpeed, LightningSendRequestStatus } from '@buildonspark/spark-sdk/types';

export interface SparkWalletProps {
  mnemonicOrSeed?: string;
  accountNumber?: number;
  signer?: SparkSigner;
  options?: ConfigOptions;
}

export interface SparkSigner {
  sign(message: string): Promise<string>;
}

export interface ConfigOptions {
  network?: 'mainnet' | 'testnet';
  apiUrl?: string;
}

export interface WalletTransfer {
  id: string;
  amount: number;
  receiverSparkAddress: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  txId?: string;
}

export interface TokenInfo {
  tokenIdentifier: string;
  balance: bigint;
  name?: string;
  symbol?: string;
}

export interface LightningReceiveRequest {
  id: string;
  invoice: string;
  amountSats: number;
  memo?: string;
  expirySeconds?: string;
  includeSparkAddress?: boolean;
  receiverIdentityPubkey?: string;
  status: 'pending' | 'paid' | 'expired';
  createdAt: string;
}

export interface LightningSendRequest {
  id: string;
  invoice: string;
  maxFeeSats?: number;
  preferSpark?: boolean;
  status: 'pending' | 'completed' | 'failed';
}

export interface PayLightningInvoiceParams {
  invoice: string;
  maxFeeSats?: number;
  preferSpark?: boolean;
  amountSatsToSend?: number;
}

export interface CreateLightningInvoiceParams {
  amountSats: number;
  memo?: string;
  expirySeconds?: number;
  includeSparkAddress?: boolean;
  receiverIdentityPubkey?: string;
}

export interface WithdrawParams {
  onchainAddress: string;
  exitSpeed: ExitSpeed;
  amountSats?: number;
  feeQuote: CoopExitFeeQuote;
  deductFeeFromWithdrawalAmount?: boolean;
}

// This is for getting the withdrawal fee estimate (different from exit fee)
export interface WithdrawalFeeQuote {
  amountSats: number;
  withdrawalAddress: string;
  feeSats: number;
  expiresAt: string;
}

// Re-export types properly for TypeScript with isolatedModules
export type { CoopExitFeeQuote } from '@buildonspark/spark-sdk/types';
export { ExitSpeed } from '@buildonspark/spark-sdk/types';

export interface CoopExitRequest {
  id: string;
  onchainAddress: string;
  amountSats: number;
  exitSpeed: ExitSpeed;
  status: 'pending' | 'completed' | 'failed';
  txId?: string;
  createdAt: string;
}

export interface ClaimStaticDepositOutput {
  transactionId: string;
  creditAmountSats: number;
  sspSignature: string;
  outputIndex?: number;
}

export interface TokenTransactionWithStatus {
  ownerPublicKeys?: string[];
  issuerPublicKeys?: string[];
  tokenTransactionHashes?: string[];
  tokenIdentifiers?: string[];
  outputIds?: string[];
  status: 'pending' | 'completed' | 'failed';
}

export interface SparkAddressFormat {
  address: string;
  publicKey: string;
}

export interface WalletBalance {
  balance: bigint;
  tokenBalances: Map<string, bigint>;
}

export interface WalletState {
  wallet: SparkWallet | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  sparkAddress: SparkAddressFormat | null;
  balance: WalletBalance | null;
  transfers: WalletTransfer[];
  lightningInvoices: LightningReceiveRequest[];
  lightningSendRequests: LightningSendRequest[];
  depositAddresses: string[];
  tokenInfo: TokenInfo[];
}

export interface WalletContextType extends WalletState {
  // Initialization
  initializeWallet: (props: SparkWalletProps) => Promise<{ mnemonic?: string } | null>;
  
  // Account Management
  getIdentityPublicKey: () => Promise<string | null>;
  getSparkAddress: () => Promise<SparkAddressFormat | null>;
  getBalance: () => Promise<WalletBalance | null>;
  
  // Transfers
  transfer: (receiverSparkAddress: string, amountSats: number) => Promise<WalletTransfer | null>;
  getTransfers: (limit?: number, offset?: number) => Promise<void>;
  
  // Lightning
  createLightningInvoice: (params: CreateLightningInvoiceParams) => Promise<LightningReceiveRequest | null>;
  payLightningInvoice: (params: PayLightningInvoiceParams) => Promise<LightningSendRequest | null>;
  getLightningReceiveRequest: (id: string) => Promise<LightningReceiveRequest | null>;
  getLightningSendFeeEstimate: (encodedInvoice: string) => Promise<number | null>;
  
  // Deposits
  getSingleUseDepositAddress: () => Promise<string | null>;
  getUnusedDepositAddresses: () => Promise<string[]>;
  getStaticDepositAddress: () => Promise<string | null>;
  claimDeposit: (txId: string) => Promise<WalletTransfer | null>;
  getClaimStaticDepositQuote: (txId: string, outputIndex?: number) => Promise<ClaimStaticDepositOutput | null>;
  claimStaticDeposit: (params: ClaimStaticDepositOutput) => Promise<WalletTransfer | null>;
  refundStaticDeposit: (depositTxId: string, destinationAddress: string, feeSats: number) => Promise<string | null>;
  
  // Withdrawals
  withdraw: (params: WithdrawParams) => Promise<CoopExitRequest | null>;
  getWithdrawalFeeQuote: (amountSats: number, withdrawalAddress: string) => Promise<WithdrawalFeeQuote | null>;
  getCoopExitFeeQuote: (amountSats: number, exitSpeed: ExitSpeed) => Promise<CoopExitFeeQuote | null>;
  getCoopExitRequest: (id: string) => Promise<CoopExitRequest | null>;
  
  // Tokens
  transferTokens: (
    tokenIdentifier: string,
    tokenAmount: bigint,
    receiverSparkAddress: string,
    selectedOutputs?: any[]
  ) => Promise<string | null>;
  getTokenInfo: () => Promise<TokenInfo[]>;
  queryTokenTransactions: (params: any) => Promise<TokenTransactionWithStatus[]>;
  getTokenL1Address: () => Promise<string | null>;
  
  // Advanced
  advancedDeposit: (txHex: string) => Promise<any>;
  getSwapFeeEstimate: (amountSats: number) => Promise<any>;
  
  // Utility
  cleanupConnections: () => Promise<void>;
  clearError: () => void;
}