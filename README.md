# Polymarket API Server

A TypeScript Express server for sending orders to the Polymarket CLOB (Central Limit Order Book) using the official `@polymarket/clob-client` library. Supports both environment variable configuration and per-request credentials.

## Features

- 🔐 **Flexible Authentication** - Use environment variables or send credentials per request
- 📝 **Order Management** - Create and post both limit and market orders to Polymarket
- 🚀 **RESTful API** - Clean HTTP endpoints for order operations
- ✅ **Type-Safe** - Built with TypeScript for better developer experience
- 🔄 **Smart Caching** - Client instances are cached per credential pair
- 📊 **Auto Market Validation** - Automatically fetches market info and validates tokenIDs
- 🛡️ **Error Handling** - Comprehensive error messages and validation

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Polymarket account with:
  - Private key (export from [reveal.magic.link/polymarket](https://reveal.magic.link/polymarket) for email login, or from your Web3 wallet)
  - Funder address (your Polymarket Profile Address where you send USDC)

## Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. (Optional) Create a `.env` file in the root directory for default credentials:

```bash
cp .env.example .env
```

3. Fill in your `.env` file (optional if you'll send credentials in requests):

```env
PRIVATE_KEY=your_private_key_here
FUNDER_ADDRESS=your_polymarket_profile_address_here
HOST=https://clob.polymarket.com
CHAIN_ID=137
SIGNATURE_TYPE=1
PORT=3000
```

### Environment Variables

- `PRIVATE_KEY`: Your wallet's private key (optional if sending in requests)
  - For email login: Export from https://reveal.magic.link/polymarket
  - For Web3 wallets: Export from your wallet application
- `FUNDER_ADDRESS`: Your Polymarket Profile Address (optional if sending in requests)
- `HOST`: Polymarket CLOB API host (default: `https://clob.polymarket.com`)
- `CHAIN_ID`: Chain ID (default: `137` for Polygon)
- `SIGNATURE_TYPE`: 
  - `0`: Browser Wallet (Metamask, Coinbase Wallet, etc)
  - `1`: Magic/Email Login (default)
- `PORT`: Server port (default: `3000`)

## Usage

### Development

Run the server in development mode with hot reload:

```bash
npm run dev
```

### Production

Build and run:

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

```http
GET /health
```

Returns server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Create Limit Order

```http
POST /api/orders/limit
Content-Type: application/json
```

Create a limit order with a specific price. Limit orders support GTC (Good Till Cancel) and GTD (Good Till Date) order types.

**Request Body:**

```json
{
  "tokenID": "0x...",           // Required: Market token ID
  "price": 0.5,                 // Required: Order price
  "side": "BUY",                // Required: "BUY" or "SELL"
  "size": 10,                   // Required: Order size (number of shares)
  "tickSize": "0.001",          // Optional: Market tick size (auto-fetched if not provided)
  "negRisk": false,             // Optional: Negative risk flag (default: false)
  "orderType": "GTC",           // Optional: "GTC" or "GTD" (default: "GTC")
  "expiration": 1234567890,     // Optional: Expiration timestamp (required for GTD orders)
  "privateKey": "...",          // Optional: Private key (if not using env vars)
  "funderAddress": "0x..."      // Optional: Funder address (if not using env vars)
}
```

**Note:** If you provide `privateKey` or `funderAddress`, you must provide both. If neither is provided, the server will use environment variables.

**Success Response:**

```json
{
  "success": true,
  "data": { /* order response from Polymarket */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Create Market Order

```http
POST /api/orders/market
Content-Type: application/json
```

Create a market order that executes immediately at the current market price. Market orders support FOK (Fill or Kill) and FAK (Fill and Kill) order types.

**Request Body:**

```json
{
  "tokenID": "0x...",           // Required: Market token ID
  "amount": 100,                // Required: Order amount in USD
  "side": "BUY",                // Required: "BUY" or "SELL"
  "orderType": "FOK",           // Required: "FOK" or "FAK"
  "tickSize": "0.001",          // Optional: Market tick size (auto-fetched if not provided)
  "privateKey": "...",          // Optional: Private key (if not using env vars)
  "funderAddress": "0x..."      // Optional: Funder address (if not using env vars)
}
```

**Note:** 
- For market sell orders, only `tokenID`, `amount`, `side`, and `orderType` are required
- If you provide `privateKey` or `funderAddress`, you must provide both. If neither is provided, the server will use environment variables.

**Success Response:**

```json
{
  "success": true,
  "data": { /* order response from Polymarket */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Create Order (Legacy Endpoint)

```http
POST /api/orders
Content-Type: application/json
```

**Note:** This endpoint is maintained for backward compatibility. For new implementations, use `/api/orders/limit` or `/api/orders/market` instead.

This endpoint creates a limit order with the same request body format as `/api/orders/limit`.

## Usage Examples

### Example 1: Limit Order with Environment Variables

If you have credentials in your `.env` file:

```bash
curl -X POST http://localhost:3000/api/orders/limit \
  -H "Content-Type: application/json" \
  -d '{
    "tokenID": "0x1234...",
    "price": 0.5,
    "side": "BUY",
    "size": 100,
    "orderType": "GTD",
    "expiration": 1735689600
  }'
```

### Example 2: Market Order Buy

Create a market buy order with FOK (Fill or Kill):

```bash
curl -X POST http://localhost:3000/api/orders/market \
  -H "Content-Type: application/json" \
  -d '{
    "tokenID": "0x1234...",
    "amount": 100,
    "side": "BUY",
    "orderType": "FOK",
    "tickSize": "0.01"
  }'
```

### Example 3: Market Order Sell

Create a market sell order with FAK (Fill and Kill):

```bash
curl -X POST http://localhost:3000/api/orders/market \
  -H "Content-Type: application/json" \
  -d '{
    "tokenID": "0x1234...",
    "amount": 100,
    "side": "SELL",
    "orderType": "FAK"
  }'
```

### Example 4: Sending Credentials in Request

Send credentials directly in the request body:

```bash
curl -X POST http://localhost:3000/api/orders/limit \
  -H "Content-Type: application/json" \
  -d '{
    "tokenID": "0x1234...",
    "price": 0.5,
    "side": "BUY",
    "size": 10,
    "privateKey": "your_private_key_here",
    "funderAddress": "0x your_funder_address_here"
  }'
```

### Example 5: JavaScript/TypeScript - Limit Order

```typescript
const response = await fetch('http://localhost:3000/api/orders/limit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tokenID: '0x1234...',
    price: 0.5,
    side: 'BUY',
    size: 100,
    orderType: 'GTD',
    expiration: Math.floor(Date.now() / 1000) + 60, // 1 minute from now
    privateKey: 'your_private_key',      // Optional
    funderAddress: '0x...',              // Optional
    tickSize: '0.001',                   // Optional - auto-fetched if not provided
    negRisk: false
  })
})

const result = await response.json()
console.log(result)
```

### Example 6: JavaScript/TypeScript - Market Order

```typescript
const response = await fetch('http://localhost:3000/api/orders/market', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tokenID: '0x1234...',
    amount: 100, // $100 USD
    side: 'BUY',
    orderType: 'FOK', // or 'FAK'
    tickSize: '0.01', // Optional - auto-fetched if not provided
    privateKey: 'your_private_key',      // Optional
    funderAddress: '0x...'               // Optional
  })
})

const result = await response.json()
console.log(result)
```

## Getting Market Information

To get market information including `tokenID`, `tickSize`, and `negRisk`, use the Polymarket Gamma Markets API:

```bash
curl https://gamma-api.polymarket.com/markets
```

See the [Polymarket API Documentation](https://docs.polymarket.com/developers/gamma-markets-api/get-markets) for more details.

## Order Types

The API supports different order types depending on whether you're placing a limit or market order:

### Limit Order Types

- **GTC (Good Till Cancel)**: Order remains active until filled or cancelled (default)
- **GTD (Good Till Date)**: Order remains active until a specific expiration date. Requires `expiration` timestamp in the request.

### Market Order Types

- **FOK (Fill or Kill)**: Order must be filled completely immediately, or it is cancelled
- **FAK (Fill and Kill)**: Order is filled as much as possible immediately, with any remaining unfilled portion cancelled

**Note:** 
- Limit orders use `/api/orders/limit` endpoint with `price` and `size` parameters
- Market orders use `/api/orders/market` endpoint with `amount` (USD) parameter
- Market orders execute immediately at current market prices

## Project Structure

```
polymarket-api/
├── src/
│   ├── index.ts              # Express server entry point
│   ├── routes/
│   │   └── orders.ts         # Order routes
│   ├── services/
│   │   └── clobClient.ts     # CLOB client wrapper with caching
│   └── types/
│       └── order.ts          # TypeScript type definitions
├── dist/                     # Compiled JavaScript (generated)
├── .env                      # Environment variables (create from .env.example)
├── .env.example              # Example environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Private Keys in Requests**: While the API supports sending private keys in request bodies, this is **not recommended for production**. Consider:
   - Using environment variables for server-side applications
   - Implementing authentication/authorization middleware
   - Using HTTPS only in production
   - Never logging or storing private keys

2. **Environment Variables**: 
   - Never commit your `.env` file to version control
   - Use secure secret management in production (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Rotate credentials regularly

3. **Network Security**:
   - Always use HTTPS in production
   - Implement rate limiting
   - Use API authentication tokens if exposing publicly

4. **Wallet Security**:
   - Use a dedicated trading wallet with limited funds
   - Never share your private key
   - Consider using hardware wallets for large amounts

## Error Handling

The API provides detailed error messages for common issues:

- **Market Not Found**: When a `tokenID` doesn't exist
- **Invalid Credentials**: When API key creation fails
- **Missing Parameters**: When required fields are missing
- **Invalid Order Type**: When unsupported order types are used

## Caching

The server implements intelligent caching:

- Client instances are cached per credential pair (`privateKey` + `funderAddress`)
- API credentials are cached to avoid unnecessary API key creation
- This improves performance for repeated requests with the same credentials

## Development

### Type Checking

```bash
npm run type-check
```

### Building

```bash
npm run build
```

## License

MIT

## References

- [Polymarket CLOB Client](https://github.com/Polymarket/clob-client)
- [Polymarket API Documentation](https://docs.polymarket.com/)
- [Polymarket Gamma Markets API](https://docs.polymarket.com/developers/gamma-markets-api/get-markets)

## Support

For issues related to:
- **This API Server**: Open an issue in this repository
- **Polymarket CLOB Client**: See [clob-client repository](https://github.com/Polymarket/clob-client)
- **Polymarket Platform**: Visit [Polymarket Documentation](https://docs.polymarket.com/)

