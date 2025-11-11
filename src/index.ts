import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { orderRouter } from "./routes/orders"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use("/api/orders", orderRouter)

// Health check
app.get("/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`)
	console.log(`📡 Health check: http://localhost:${PORT}/health`)
	console.log(`📝 Orders endpoint: http://localhost:${PORT}/api/orders`)
})
