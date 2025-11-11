export interface OrderRequest {
	tokenID: string
	price: number
	side: "BUY" | "SELL"
	size: number
	tickSize?: string
	negRisk?: boolean
	orderType?: "GTC" | "GTD" // FOK and FAK require market orders (not yet implemented)
	// Optional: If provided, will use these credentials instead of environment variables
	privateKey?: string
	funderAddress?: string
}

export interface OrderResponse {
	success: boolean
	data?: any
	error?: string
	timestamp: string
}
