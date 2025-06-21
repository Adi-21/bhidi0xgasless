# Bhindi.io Integration Projects

This repository contains two distinct Bhindi.io integration projects, each serving different use cases for voice-powered financial operations.

## 📁 Project Structure

```
samvad/
├── bhindibackend/          # Splitwise Expense Management Agent
└── bhindi0xgasless/        # DeFi Operations Agent
```

---

## 🏠 bhindibackend - Splitwise Expense Management Agent

**Use Case**: Voice-powered expense management and group payment tracking using Splitwise API integration.

### 🎯 Features

- **Group Expense Management**: Create and track expenses in Splitwise groups
- **Balance Checking**: Get current balances for all group members
- **Payment Tracking**: Monitor who owes what to whom
- **Voice Commands**: Natural language processing for expense operations
- **Sarvam AI Integration**: Advanced voice recognition and processing
- **Multi-currency Support**: Handle expenses in different currencies

### 🛠️ Technical Stack

- **Runtime**: Node.js with Express
- **APIs**: Splitwise API v3.0, Sarvam AI API
- **Authentication**: Bearer token authentication
- **Voice Processing**: Sarvam AI for natural language understanding

### 🚀 Quick Start

```bash
cd bhindibackend
npm install
cp .env.example .env
# Configure your Splitwise and Sarvam API keys
npm start
```

### 📋 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/tools` | GET | List available tools |
| `/tools/getSplitwiseBalance` | POST | Get group member balances |
| `/tools/getSplitwiseExpenses` | POST | Retrieve group expenses |
| `/tools/getSplitwiseGroups` | POST | List user's groups |
| `/tools/payFriendSplitwise` | POST | Record payments between friends |
| `/tools/createSplitwiseExpense` | POST | Create new expense |

### 🔧 Configuration

Required environment variables:
```env
SPLITWISE_BASE_URL=https://secure.splitwise.com/api/v3.0
SARVAM_API_URL=https://api.sarvam.ai
PORT=3000
```

Required headers for API calls:
- `x-api-key`: Your Bhindi API key
- `x-splitwise-key`: Your Splitwise API token
- `x-sarvam-key`: Your Sarvam AI API key (optional)

### 💡 Example Usage

```bash
# Get group balances
curl -X POST http://localhost:3000/tools/getSplitwiseBalance \
  -H "x-api-key: your-api-key" \
  -H "x-splitwise-key: your-splitwise-token" \
  -H "Content-Type: application/json" \
  -d '{"groupId": "12345"}'

# Create an expense
curl -X POST http://localhost:3000/tools/createSplitwiseExpense \
  -H "x-api-key: your-api-key" \
  -H "x-splitwise-key: your-splitwise-token" \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "12345",
    "description": "Dinner at Restaurant",
    "cost": "1500.00",
    "currencyCode": "INR",
    "paidBy": "1001"
  }'
```

---

## ⚡ bhindi0xgasless - DeFi Operations Agent

**Use Case**: Voice-powered DeFi operations including gasless transactions, token swaps, bridging, and blockchain analytics.

### 🎯 Features

- **Gasless Transactions**: Execute DeFi operations without paying gas fees
- **Multi-chain Support**: Avalanche, BSC, Ethereum, Polygon, Base
- **Token Operations**: Transfers, swaps, and cross-chain bridging
- **Blockchain Analytics**: SQL queries on blockchain data via Space and Time
- **Smart Contract Integration**: 0xGasless AgentKit integration
- **Transaction Success Detection**: Enhanced result processing with explorer links

### 🛠️ Technical Stack

- **Runtime**: Node.js with Express
- **DeFi SDK**: @0xgasless/agentkit
- **Blockchain**: Multi-chain support (AVAX, BSC, ETH, etc.)
- **Analytics**: Space and Time (SXT) for blockchain data queries
- **Security**: Comprehensive authentication and parameter validation

### 🚀 Quick Start

```bash
cd bhindi0xgasless
npm install
cp .env.example .env
# Configure your 0xGasless API keys and blockchain credentials
npm start
```

### 📋 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/tools` | GET | List available tools |
| `/tools/getWalletAddress` | POST | Get smart wallet address |
| `/tools/getWalletBalance` | POST | Check token balances |
| `/tools/transferTokens` | POST | Gasless token transfer |
| `/tools/swapTokens` | POST | DEX token swap |
| `/tools/bridgeTokens` | POST | Cross-chain token bridge |
| `/tools/queryBlockchainData` | POST | SQL blockchain analytics |

### 🔧 Configuration

Required environment variables:
```env
PORT=3001
DEFAULT_CHAIN_ID=43114
DEFAULT_RPC_URL=https://api.avax.network/ext/bc/C/rpc
```

Required headers for API calls:
- `x-api-key`: Your 0xGasless API key
- `x-private-key`: Your wallet private key
- `x-gasless-api-key`: Your 0xGasless API key
- `x-rpc-url`: Custom RPC URL (optional)
- `x-chain-id`: Target blockchain (optional, default: 43114)
- `x-sxt-api-key`: Space and Time API key (for analytics)

### 💡 Example Usage

```bash
# Get wallet address
curl -X POST http://localhost:3001/tools/getWalletAddress \
  -H "x-api-key: your-0xgasless-key" \
  -H "x-private-key: your-private-key" \
  -H "Content-Type: application/json" \
  -d '{}'

# Transfer tokens
curl -X POST http://localhost:3001/tools/transferTokens \
  -H "x-api-key: your-0xgasless-key" \
  -H "x-private-key: your-private-key" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "1",
    "tokenAddress": "USDT",
    "to": "0x742d35Cc6639C0532fEb96c26c5CA44f39F5C9a6"
  }'

# Query blockchain data
curl -X POST http://localhost:3001/tools/queryBlockchainData \
  -H "x-api-key: your-0xgasless-key" \
  -H "x-sxt-api-key: your-sxt-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM ethereum.transactions WHERE block_number > 18000000 LIMIT 10"
  }'
```

### 🌟 Advanced Features

- **Transaction Success Detection**: Automatically detects successful transactions even if AgentKit reports errors
- **Explorer Links**: Provides direct links to blockchain explorers for transactions
- **Parameter Cleaning**: Removes Bhindi-specific parameters before processing
- **Multi-token Support**: USDT, USDC, AVAX, WAVAX, and custom tokens
- **Debug Endpoints**: Parameter validation and debugging tools

---

## 🔗 Integration with Bhindi.io

Both projects are designed to work seamlessly with the Bhindi.io voice AI platform:

### Voice Commands Examples

**Splitwise Agent:**
- "Show me the balance in Goa Trip group"
- "Create an expense of 500 rupees for dinner"
- "Who owes me money in the group?"

**DeFi Agent:**
- "Transfer 1 USDT to 0x742d35Cc6639C0532fEb96c26c5CA44f39F5C9a6"
- "Swap 10 AVAX for USDT"
- "What's my wallet balance?"
- "Query recent transactions on Ethereum"

### Authentication Flow

1. Bhindi.io sends requests with appropriate API keys
2. Agents validate authentication and extract configuration
3. Operations are executed with proper error handling
4. Results are formatted for voice response

---

## 🛡️ Security Considerations

### Splitwise Agent
- Validates Splitwise API tokens
- Sanitizes expense data
- Implements rate limiting
- Secure header handling

### DeFi Agent
- Private key security (never logged)
- Transaction parameter validation
- Gasless operation safety
- Multi-chain security validation

---

## 🧪 Testing

### Splitwise Agent
```bash
cd bhindibackend
npm test
```

### DeFi Agent
```bash
cd bhindi0xgasless
npm run test
npm run test:postman  # API testing
npm run test:unit     # Unit tests
```

---

## 📊 Monitoring & Logging

Both agents include comprehensive logging:
- Request/response logging
- Error tracking
- Performance monitoring
- Debug information

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🆘 Support

- **Splitwise Agent Issues**: Check Splitwise API documentation
- **DeFi Agent Issues**: Check 0xGasless documentation
- **Bhindi Integration**: Contact Bhindi.io support

---

## 🔄 Version History

- **v1.0.0**: Initial release with basic functionality
- **v1.1.0**: Enhanced error handling and voice integration
- **v1.2.0**: Added blockchain analytics and transaction success detection 