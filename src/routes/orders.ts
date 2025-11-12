import { Router, Request, Response } from "express"
import { ClobClient } from "../services/clobClient"
import {
	LimitOrderRequest,
	MarketOrderRequest,
	OrderRequest,
	OrderResponse,
} from "../types/order"

const router = Router()

/**
 * POST /api/orders/limit
 * Create and post a limit order to Polymarket
 */
router.post("/limit", async (req: Request, res: Response) => {
	try {
		const orderRequest: LimitOrderRequest = req.body

		// Validate required fields
		if (!orderRequest.tokenID) {
			return res.status(400).json({ error: "tokenID is required" })
		}
		if (orderRequest.price === undefined || orderRequest.price === null) {
			return res.status(400).json({ error: "price is required" })
		}
		if (!orderRequest.side) {
			return res
				.status(400)
				.json({ error: "side is required (BUY or SELL)" })
		}
		if (orderRequest.size === undefined || orderRequest.size === null) {
			return res.status(400).json({ error: "size is required" })
		}

		// Determine credentials - use request body if provided, otherwise use env vars
		// If either is provided, both must be provided
		if (
			(orderRequest.privateKey && !orderRequest.funderAddress) ||
			(!orderRequest.privateKey && orderRequest.funderAddress)
		) {
			return res.status(400).json({
				error: "Both privateKey and funderAddress must be provided together, or neither (to use environment variables)",
			})
		}

		const credentials =
			orderRequest.privateKey && orderRequest.funderAddress
				? {
						privateKey: orderRequest.privateKey,
						funderAddress: orderRequest.funderAddress,
				  }
				: undefined

		// Create and post limit order
		// Note: tickSize will be auto-fetched if not provided
		const response = await ClobClient.createAndPostOrder(
			{
				tokenID: orderRequest.tokenID,
				price: orderRequest.price,
				side: orderRequest.side,
				size: orderRequest.size,
				expiration: orderRequest.expiration,
			},
			{
				tickSize: orderRequest.tickSize, // Optional - will be fetched if not provided
				negRisk: orderRequest.negRisk ?? false,
			},
			orderRequest.orderType || "GTC",
			credentials
		)

		const orderResponse: OrderResponse = {
			success: true,
			data: response,
			timestamp: new Date().toISOString(),
		}

		res.json(orderResponse)
	} catch (error: any) {
		console.error("Error creating limit order:", error)
		res.status(500).json({
			success: false,
			error: error.message || "Failed to create limit order",
			timestamp: new Date().toISOString(),
		})
	}
})

/**
 * POST /api/orders/market
 * Create and post a market order to Polymarket
 */
router.post("/market", async (req: Request, res: Response) => {
	try {
		const orderRequest: MarketOrderRequest = req.body

		// Validate required fields
		if (!orderRequest.tokenID) {
			return res.status(400).json({ error: "tokenID is required" })
		}
		if (
			orderRequest.amount === undefined ||
			orderRequest.amount === null ||
			orderRequest.amount <= 0
		) {
			return res.status(400).json({
				error: "amount is required and must be greater than 0",
			})
		}
		if (!orderRequest.side) {
			return res
				.status(400)
				.json({ error: "side is required (BUY or SELL)" })
		}
		if (
			!orderRequest.orderType ||
			!["FOK", "FAK"].includes(orderRequest.orderType)
		) {
			return res.status(400).json({
				error: "orderType is required and must be either FOK or FAK",
			})
		}

		// Determine credentials - use request body if provided, otherwise use env vars
		// If either is provided, both must be provided
		if (
			(orderRequest.privateKey && !orderRequest.funderAddress) ||
			(!orderRequest.privateKey && orderRequest.funderAddress)
		) {
			return res.status(400).json({
				error: "Both privateKey and funderAddress must be provided together, or neither (to use environment variables)",
			})
		}

		const credentials =
			orderRequest.privateKey && orderRequest.funderAddress
				? {
						privateKey: orderRequest.privateKey,
						funderAddress: orderRequest.funderAddress,
				  }
				: undefined

		// Create and post market order
		// Note: tickSize will be auto-fetched if not provided
		const response = await ClobClient.createAndPostMarketOrder(
			{
				tokenID: orderRequest.tokenID,
				amount: orderRequest.amount,
				side: orderRequest.side,
				orderType: orderRequest.orderType,
			},
			{
				tickSize: orderRequest.tickSize, // Optional - will be fetched if not provided
			},
			orderRequest.orderType,
			credentials
		)

		const orderResponse: OrderResponse = {
			success: true,
			data: response,
			timestamp: new Date().toISOString(),
		}

		res.json(orderResponse)
	} catch (error: any) {
		console.error("Error creating market order:", error)
		res.status(500).json({
			success: false,
			error: error.message || "Failed to create market order",
			timestamp: new Date().toISOString(),
		})
	}
})

/**
 * POST /api/orders
 * Legacy endpoint - Create and post a limit order to Polymarket (for backward compatibility)
 */
router.post("/", async (req: Request, res: Response) => {
	try {
		const orderRequest: OrderRequest = req.body

		// Validate required fields
		if (!orderRequest.tokenID) {
			return res.status(400).json({ error: "tokenID is required" })
		}
		if (orderRequest.price === undefined || orderRequest.price === null) {
			return res.status(400).json({ error: "price is required" })
		}
		if (!orderRequest.side) {
			return res
				.status(400)
				.json({ error: "side is required (BUY or SELL)" })
		}
		if (orderRequest.size === undefined || orderRequest.size === null) {
			return res.status(400).json({ error: "size is required" })
		}

		// Determine credentials - use request body if provided, otherwise use env vars
		// If either is provided, both must be provided
		if (
			(orderRequest.privateKey && !orderRequest.funderAddress) ||
			(!orderRequest.privateKey && orderRequest.funderAddress)
		) {
			return res.status(400).json({
				error: "Both privateKey and funderAddress must be provided together, or neither (to use environment variables)",
			})
		}

		const credentials =
			orderRequest.privateKey && orderRequest.funderAddress
				? {
						privateKey: orderRequest.privateKey,
						funderAddress: orderRequest.funderAddress,
				  }
				: undefined

		// Create and post order
		// Note: tickSize will be auto-fetched if not provided
		const response = await ClobClient.createAndPostOrder(
			{
				tokenID: orderRequest.tokenID,
				price: orderRequest.price,
				side: orderRequest.side,
				size: orderRequest.size,
				expiration: orderRequest.expiration,
			},
			{
				tickSize: orderRequest.tickSize, // Optional - will be fetched if not provided
				negRisk: orderRequest.negRisk ?? false,
			},
			orderRequest.orderType || "GTC",
			credentials
		)

		const orderResponse: OrderResponse = {
			success: true,
			data: response,
			timestamp: new Date().toISOString(),
		}

		res.json(orderResponse)
	} catch (error: any) {
		console.error("Error creating order:", error)
		res.status(500).json({
			success: false,
			error: error.message || "Failed to create order",
			timestamp: new Date().toISOString(),
		})
	}
})

/**
 * GET /api/orders/status
 * Get order status (placeholder for future implementation)
 */
router.get("/status", (req: Request, res: Response) => {
	res.json({ message: "Order status endpoint - coming soon" })
})

export { router as orderRouter }
