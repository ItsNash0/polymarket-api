# Polymarket API Server

A TypeScript Express server for sending orders to the Polymarket CLOB (Central Limit Order Book) using the official `@polymarket/clob-client` library. Supports both environment variable configuration and per-request credentials.

## Features

- 🔐 **Flexible Authentication** - Use environment variables or send credentials per request
- 📝 **Order Management** - Create and post limit orders to Polymarket
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

### Create Order

```http
POST /api/orders
Content-Type: application/json
```

**Request Body:**

```json
{
  "tokenID": "0x...",           // Required: Market token ID
  "price": 0.5,                 // Required: Order price
  "side": "BUY",                // Required: "BUY" or "SELL"
  "size": 10,                   // Required: Order size
  "tickSize": "0.001",          // Optional: Market tick size (auto-fetched if not provided)
  "negRisk": false,             // Optional: Negative risk flag (default: false)
  "orderType": "GTC",           // Optional: "GTC" or "GTD" (default: "GTC")
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

## Usage Examples

### Example 1: Using Environment Variables

If you have credentials in your `.env` file:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tokenID": "0x1234...",
    "price": 0.5,
    "side": "BUY",
    "size": 10
  }'
```

### Example 2: Sending Credentials in Request

Send credentials directly in the request body:

```bash
curl -X POST http://localhost:3000/api/orders \
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

### Example 3: JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tokenID: '0x1234...',
    price: 0.5,
    side: 'BUY',
    size: 10,
    privateKey: 'your_private_key',      // Optional
    funderAddress: '0x...',              // Optional
    orderType: 'GTC',
    tickSize: '0.001',                   // Optional - auto-fetched if not provided
    negRisk: false
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

The API supports the following order types:

- **GTC (Good Till Cancel)**: Order remains active until filled or cancelled (default)
- **GTD (Good Till Date)**: Order remains active until a specific date

**Note:** FOK (Fill or Kill) and FAK (Fill and Kill) order types require market orders with a different structure and are not yet implemented in this API.

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

