import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import errorHandler from './src/middleware/errorHandler.js'
import routes from './src/routes/index.js'
import DatabaseService from './src/services/database.js'

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

// API routes
app.use('/api', routes)

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbHealth = await DatabaseService.getInstance().healthCheck()
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development',
    database: dbHealth ? 'connected' : 'disconnected'
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

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to database
    await DatabaseService.getInstance().connect()

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🎅 Secret Santa server running on port ${PORT}`)
      console.log(`📊 Health check available at http://localhost:${PORT}/api/health`)
      console.log(`🌍 Environment: ${process.env['NODE_ENV'] || 'development'}`)
    })

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Received shutdown signal, closing server...')
      server.close(async () => {
        await DatabaseService.getInstance().disconnect()
        console.log('Server closed gracefully.')
        process.exit(0)
      })
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    return server
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app