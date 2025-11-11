import {
	ApiKeyCreds,
	ClobClient as PolymarketClobClient,
	OrderType,
	TickSize,
} from "@polymarket/clob-client"
import { Wallet } from "@ethersproject/wallet"
import dotenv from "dotenv"

dotenv.config()

export class ClobClient {
	private static instance: PolymarketClobClient | null = null
	private static creds: ApiKeyCreds | null = null
	// Cache for per-request clients (keyed by privateKey+funderAddress)
	private static clientCache: Map<string, PolymarketClobClient> = new Map()
	private static credsCache: Map<string, ApiKeyCreds> = new Map()

	/**
	 * Get or create a singleton instance of the CLOB client (uses env vars)
	 */
	static async getInstance(): Promise<PolymarketClobClient> {
		if (ClobClient.instance) {
			return ClobClient.instance
		}

		// Validate environment variables
		const privateKey = process.env.PRIVATE_KEY
		const funder = process.env.FUNDER_ADDRESS
		const host = process.env.HOST || "https://clob.polymarket.com"
		const chainId = parseInt(process.env.CHAIN_ID || "137", 10)
		const signatureType = parseInt(process.env.SIGNATURE_TYPE || "1", 10)

		if (!privateKey) {
			throw new Error("PRIVATE_KEY environment variable is required")
		}
		if (!funder) {
			throw new Error("FUNDER_ADDRESS environment variable is required")
		}

		return await ClobClient.getInstanceWithCredentials(
			privateKey,
			funder,
			host,
			chainId,
			signatureType
		)
	}

	/**
	 * Get or create a CLOB client instance with specific credentials
	 */
	static async getInstanceWithCredentials(
		privateKey: string,
		funderAddress: string,
		host: string = process.env.HOST || "https://clob.polymarket.com",
		chainId: number = parseInt(process.env.CHAIN_ID || "137", 10),
		signatureType: number = parseInt(process.env.SIGNATURE_TYPE || "1", 10)
	): Promise<PolymarketClobClient> {
		// Create cache key from credentials
		const cacheKey = `${privateKey}-${funderAddress}`

		// Check if we already have a client for these credentials
		if (ClobClient.clientCache.has(cacheKey)) {
			return ClobClient.clientCache.get(cacheKey)!
		}

		// Validate credentials
		if (!privateKey) {
			throw new Error("privateKey is required")
		}
		if (!funderAddress) {
			throw new Error("funderAddress is required")
		}

		// Create wallet from private key
		const signer = new Wallet(privateKey)

		// Create temporary client to get API credentials
		const tempClient = new PolymarketClobClient(host, chainId, signer)

		// Check if we have cached credentials for this key
		let creds: ApiKeyCreds
		if (ClobClient.credsCache.has(cacheKey)) {
			creds = ClobClient.credsCache.get(cacheKey)!
		} else {
			// Create or derive API key with error handling
			try {
				creds = await tempClient.createOrDeriveApiKey()
				ClobClient.credsCache.set(cacheKey, creds)
			} catch (error: any) {
				console.error("❌ Failed to create/derive API key:", error)
				throw new Error(
					`Failed to create API key: ${
						error.message || "Unknown error"
					}. Please check your privateKey and ensure your wallet is properly configured.`
				)
			}

			if (!creds) {
				throw new Error("API key creation returned null/undefined")
			}
		}

		// Create the actual client with credentials
		const client = new PolymarketClobClient(
			host,
			chainId,
			signer,
			creds,
			signatureType,
			funderAddress
		)

		// Cache the client
		ClobClient.clientCache.set(cacheKey, client)

		console.log("✅ CLOB client initialized successfully")
		return client
	}

	/**
	 * Get market information for a tokenID
	 */
	static async getMarketInfo(tokenID: string, client?: PolymarketClobClient) {
		const clobClient = client || (await ClobClient.getInstance())
		try {
			// Try to get tick size - this will fail if market doesn't exist
			const tickSize = await clobClient.getTickSize(tokenID)
			return { tickSize, exists: true }
		} catch (error: any) {
			if (
				error?.response?.status === 404 ||
				error?.data?.error?.includes("not found")
			) {
				throw new Error(
					`Market not found for tokenID: ${tokenID}. Please verify the tokenID is correct and the market exists.`
				)
			}
			throw error
		}
	}

	/**
	 * Create and post an order (static method)
	 */
	static async createAndPostOrder(
		orderParams: {
			tokenID: string
			price: number
			side: "BUY" | "SELL"
			size: number
		},
		marketParams: {
			tickSize?: string
			negRisk?: boolean
		},
		orderType: string = "GTC",
		credentials?: {
			privateKey: string
			funderAddress: string
		}
	) {
		// Get client instance - use provided credentials or fall back to env vars
		const client = credentials
			? await ClobClient.getInstanceWithCredentials(
					credentials.privateKey,
					credentials.funderAddress
			  )
			: await ClobClient.getInstance()

		// Validate market exists and get tickSize if not provided
		let tickSize = marketParams.tickSize
		if (!tickSize) {
			try {
				const marketInfo = await ClobClient.getMarketInfo(
					orderParams.tokenID,
					client
				)
				tickSize = marketInfo.tickSize
				console.log(`📊 Market found. Using tickSize: ${tickSize}`)
			} catch (error: any) {
				throw new Error(
					`Failed to get market info: ${error.message}. Please provide tickSize manually or use a valid tokenID.`
				)
			}
		}

		// Validate tickSize is not empty
		if (!tickSize || tickSize === "") {
			throw new Error(
				"tickSize is required but could not be determined from market"
			)
		}

		// Map side string to enum
		const { Side } = await import("@polymarket/clob-client")
		const sideEnum = orderParams.side === "BUY" ? Side.BUY : Side.SELL

		try {
			// createAndPostOrder only supports GTC and GTD
			// createAndPostMarketOrder supports FOK and FAK (but requires different params)
			if (orderType === "FOK" || orderType === "FAK") {
				throw new Error(
					`Order type ${orderType} requires createAndPostMarketOrder which needs a different order structure. Please use GTC or GTD for limit orders.`
				)
			}

			// Map order type - only GTC and GTD are supported for limit orders
			const orderTypeEnum =
				orderType === "GTD" ? OrderType.GTD : OrderType.GTC

			return await client.createAndPostOrder(
				{
					tokenID: orderParams.tokenID,
					price: orderParams.price,
					side: sideEnum,
					size: orderParams.size,
				},
				{
					tickSize: tickSize as TickSize,
					negRisk: marketParams.negRisk ?? false,
				},
				orderTypeEnum
			)
		} catch (error: any) {
			// Provide more helpful error messages
			if (error?.response?.status === 404) {
				throw new Error(
					`Market not found for tokenID: ${orderParams.tokenID}. Please verify the tokenID is correct.`
				)
			}
			if (error?.message?.includes("toString")) {
				throw new Error(
					`Invalid market parameters. Market may not exist or tickSize may be incorrect. Original error: ${error.message}`
				)
			}
			throw error
		}
	}
}
