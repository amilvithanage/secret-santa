import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import errorHandler from './src/middleware/errorHandler.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env['PORT'] || 3000

// Middleware
app.use(helmet()) // Security headers
app.use(cors()) // Enable CORS
app.use(morgan('combined')) // Logging
app.use(express.json()) // Parse JSON bodies
app.use(express.urlencoded({ extended: true })) // Parse URL-encoded bodies


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development'
  })
})

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  })
})

// Start server
const server = app.listen(PORT, () => {
  console.log(`🎅 Secret Santa server running on port ${PORT}`)
  console.log(`📊 Health check available at http://localhost:${PORT}/api/health`)
  console.log(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`)
})

// Graceful shutdown
const shutdown = () => {
  console.log('Received shutdown signal, closing server...')
  server.close(() => {
    console.log('Server closed gracefully.')
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

export default app 