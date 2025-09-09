# UMA (Universal Money Address) Implementation

This project includes a complete implementation of UMA (Universal Money Address) protocol for Lightning Network payments, integrated with the existing Spark Wallet.

## 🚀 Features

### Core UMA Functionality
- **UMA Account Creation**: Create a unique Universal Money Address (e.g., `$username@spark-wallet.com`)
- **Send Payments**: Send payments to any UMA address globally
- **Receive Payments**: Generate QR codes and share your UMA for receiving payments
- **Multi-Currency Support**: Support for USD and BTC with automatic conversion
- **Transaction History**: Track all sent and received payments
- **Activity Logging**: Detailed logs of all UMA protocol operations

### Data Persistence
- **IndexedDB**: Stores transactions, activity logs, and recipients
- **LocalStorage**: Stores account information, balance, and configuration
- **Automatic Persistence**: All data is automatically saved and restored

### Mock Implementation
- **Test Recipients**: Pre-configured test recipients for easy testing
- **Mock Balances**: Simulated fiat and Bitcoin balances
- **Mock Exchange Rates**: Simulated currency conversion rates

## 📁 Project Structure

```
src/
├── app/
│   ├── uma/
│   │   └── page.tsx          # Main UMA wallet interface
│   └── api/
│       └── uma/
│           ├── lnurlp/       # LNURLP request/response handling
│           │   └── route.ts
│           └── payreq/       # Payment request processing
│               └── route.ts
├── contexts/
│   └── UMAContext.tsx        # UMA state management
├── types/
│   └── uma.ts                # TypeScript types for UMA
└── utils/
    └── umaPersistence.ts     # Data persistence utilities
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Lightspark API Credentials (Required for production)
LIGHTSPARK_CLIENT_ID=your_client_id_here
LIGHTSPARK_CLIENT_SECRET=your_client_secret_here
LIGHTSPARK_NODE_ID=your_node_id_here

# UMA Configuration
UMA_VASP_DOMAIN=spark-wallet.com
UMA_API_ENDPOINT=https://api.lightspark.com
UMA_NETWORK=regtest

# UMA Signing Keys (Generate using secp256k1)
UMA_SIGNING_PRIVATE_KEY=your_signing_private_key_here
UMA_ENCRYPTION_PRIVATE_KEY=your_encryption_private_key_here
```

### 3. Run the Development Server

```bash
bun dev
```

### 4. Access the UMA Wallet

Navigate to [http://localhost:3000/uma](http://localhost:3000/uma)

## 💡 How to Use

### Creating a UMA Account

1. Click "Create UMA Account" on the UMA page
2. Enter your desired username (alphanumeric, lowercase)
3. Your UMA will be created in the format: `$username@spark-wallet.com`

### Sending Payments

1. Click "Send Payment" or navigate to the Send tab
2. Select a recipient from the list
3. Enter the amount in USD or BTC
4. Review the exchange rate and fees
5. Confirm the payment

### Receiving Payments

1. Navigate to the Home tab
2. Your UMA address and QR code are displayed
3. Share your UMA address or QR code with the sender
4. Payments will appear in your transaction history

## 🔐 Security Considerations

### Current Implementation (Test Mode)
- Uses mock data and simulated transactions
- No real Lightning Network connections
- Data stored locally in browser storage

### Production Requirements
- Configure real Lightspark credentials
- Implement proper key management
- Set up secure server-side API routes
- Implement compliance checks
- Add proper authentication and authorization

## 🛠️ Technical Details

### UMA Protocol Flow

1. **LNURLP Request**: Resolve receiver's UMA address
2. **Pay Request**: Create payment request with amount and currency
3. **Lightning Invoice**: Generate Lightning invoice for payment
4. **Payment Execution**: Send payment via Lightning Network
5. **Compliance**: Post-transaction compliance checks

### Data Storage

#### IndexedDB Stores
- `transactions`: Payment history
- `activityLog`: Protocol operation logs
- `recipients`: Saved payment recipients

#### LocalStorage Keys
- `uma_account`: User's UMA account details
- `uma_balance`: Current balance information
- `uma_config`: Non-sensitive configuration

### API Endpoints

- `GET /api/uma/lnurlp`: Handle LNURLP requests
- `POST /api/uma/lnurlp`: Process LNURLP responses
- `POST /api/uma/payreq`: Create payment requests
- `GET /api/uma/payreq`: Check payment status

## 🧪 Testing

The implementation includes mock data for testing:

### Test Recipients
- Alice Johnson: `$alice@vasp1.com`
- Bob Smith: `$bob@vasp2.com`
- Charlie Brown: `$charlie@lightning.network`
- Diana Prince: `$diana@payments.io`
- Test VASP: `$test@uma-test.lightspark.com`

### Mock Balances
- Fiat: $1,000.00 USD
- Bitcoin: 0.025 BTC
- Lightning: 500,000 sats

## 📚 Dependencies

- `@uma-sdk/core`: UMA protocol SDK
- `@uma-sdk/uma-auth-client`: UMA authentication client
- `@lightsparkdev/lightspark-sdk`: Lightspark Lightning SDK
- `react-qr-code`: QR code generation
- `axios`: HTTP client
- `qrcode`: QR code utilities

## 🚦 Development Status

### ✅ Completed
- UMA account creation and management
- Send/receive payment flows
- Multi-currency support
- Transaction history
- Activity logging
- Data persistence
- Mock implementation for testing

### 🔄 In Progress
- Real Lightning Network integration
- Production-ready API endpoints
- Compliance integration

### 📋 TODO
- Real-time payment notifications
- Advanced compliance checks
- Multi-language support
- Mobile responsive improvements
- WebSocket support for real-time updates
- Enhanced error handling
- Rate limiting
- Analytics dashboard

## 📖 References

- [UMA Protocol Documentation](https://www.uma.me/docs)
- [Lightspark Documentation](https://docs.lightspark.com)
- [Lightning Network](https://lightning.network)
- [LNURL Specifications](https://github.com/lnurl/luds)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This implementation is for educational and testing purposes. Please ensure compliance with all relevant regulations when deploying to production.