// UMA (Universal Money Address) Types and Interfaces

export interface UMAAccount {
  id: string;
  address: string; // Format: $username@domain.com
  username: string;
  domain: string;
  publicKey?: string;
  createdAt: string;
  isActive: boolean;
}

export interface UMAPaymentRequest {
  id: string;
  senderAddress: string;
  receiverAddress: string;
  amount: number;
  currency: string;
  memo?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  invoice?: string;
  exchangeRate?: number;
  fees?: {
    network: number;
    service: number;
    total: number;
  };
}

export interface UMATransaction {
  id: string;
  type: 'send' | 'receive';
  umaAddress: string;
  amount: number;
  currency: string;
  convertedAmount?: number;
  convertedCurrency?: string;
  exchangeRate?: number;
  status: 'pending' | 'completed' | 'failed';
  memo?: string;
  timestamp: string;
  txId?: string;
  invoice?: string;
  fees?: number;
}

export interface LNURLPResponse {
  callback: string;
  maxSendable: number;
  minSendable: number;
  metadata: string;
  tag: string;
  payerData?: {
    name?: { mandatory: boolean };
    email?: { mandatory: boolean };
    identifier?: { mandatory: boolean };
  };
  currencies?: Currency[];
  umaVersion?: string;
  nostrPubkey?: string;
  allowsNostr?: boolean;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  multiplier: number;
  decimals: number;
  minSendable?: number;
  maxSendable?: number;
}

export interface PayRequest {
  amount: number;
  currency: string;
  payerData?: {
    name?: string;
    email?: string;
    identifier?: string;
  };
  payerIdentifier: string;
  payerKycStatus?: 'VERIFIED' | 'NOT_VERIFIED' | 'PENDING';
  payerUtxos?: string[];
  payerNodePubKey?: string;
  requestedPayeeData?: {
    name?: { mandatory: boolean };
    email?: { mandatory: boolean };
  };
  comment?: string;
}

export interface PayReqResponse {
  pr: string; // Lightning invoice
  routes: any[];
  compliance?: {
    nodePubKey?: string;
    utxos?: string[];
    utxoCallback?: string;
  };
  paymentInfo?: {
    currencyCode: string;
    decimals: number;
    multiplier: number;
    exchangeFeesMillisatoshi?: number;
  };
  payeeData?: {
    name?: string;
    email?: string;
    identifier?: string;
  };
  disposable?: boolean;
  successAction?: any;
}

export interface UMAConfig {
  clientId: string;
  clientSecret: string;
  nodeId: string;
  apiEndpoint: string;
  network: 'mainnet' | 'testnet' | 'regtest';
  vaspDomain: string;
  signingPrivateKey?: string;
  encryptionPrivateKey?: string;
}

export interface ComplianceData {
  payerIdentifier: string;
  payeeIdentifier: string;
  amount: number;
  nodePubKey?: string;
  utxos?: string[];
  travelRuleInfo?: any;
}

export interface UMABalance {
  fiatBalance: number;
  fiatCurrency: string;
  btcBalance: number;
  lightningBalance: number;
  lastUpdated: string;
}

export interface MockRecipient {
  id: string;
  name: string;
  umaAddress: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface SendPaymentFlow {
  step: 'select_recipient' | 'enter_amount' | 'confirm' | 'processing' | 'complete';
  recipient?: MockRecipient;
  amount?: number;
  currency?: string;
  receivingAmount?: number;
  receivingCurrency?: string;
  exchangeRate?: number;
  fees?: {
    network: number;
    service: number;
    total: number;
  };
  transactionId?: string;
}

export interface ActivityLog {
  id: string;
  type: 'lnurlp_request' | 'lnurlp_response' | 'pay_request' | 'pay_response' | 'payment_sent' | 'payment_received' | 'compliance_check';
  timestamp: string;
  details: any;
  status: 'success' | 'failed' | 'pending';
}

// Storage keys for localStorage/IndexedDB
export const UMA_STORAGE_KEYS = {
  ACCOUNT: 'uma_account',
  TRANSACTIONS: 'uma_transactions',
  BALANCE: 'uma_balance',
  ACTIVITY_LOG: 'uma_activity_log',
  RECIPIENTS: 'uma_recipients',
  CONFIG: 'uma_config',
} as const;