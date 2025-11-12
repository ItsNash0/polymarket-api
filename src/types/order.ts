export interface LimitOrderRequest {
	tokenID: string
	price: number
	side: "BUY" | "SELL"
	size: number
	tickSize?: string
	negRisk?: boolean
	orderType?: "GTC" | "GTD"
	expiration?: number // Optional expiration timestamp for GTD orders
	// Optional: If provided, will use these credentials instead of environment variables
	privateKey?: string
	funderAddress?: string
}

export interface MarketOrderRequest {
	tokenID: string
	amount: number // Amount in USD
	side: "BUY" | "SELL"
	orderType: "FOK" | "FAK"
	tickSize?: string
	// Optional: If provided, will use these credentials instead of environment variables
	privateKey?: string
	funderAddress?: string
}

// Legacy interface for backward compatibility
export interface OrderRequest extends LimitOrderRequest {}

export interface OrderResponse {
	success: boolean
	data?: any
	error?: string
	timestamp: string
}
