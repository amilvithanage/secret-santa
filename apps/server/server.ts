import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import routes from "./src/routes/index";
import DatabaseService from "./src/services/database";
import { NotFoundError } from "./src/utils/errors";
import errorHandler from "./src/middleware/errorHandler";

// Load environment variables
// Try to load from root directory first (for local development)
// If that fails, load from current directory (for Docker)

const app = express();
const PORT = process.env["PORT"] || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan("combined")); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Mount routes
app.use("/api", routes);

// Error handling middleware
app.use(errorHandler);


// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to database
    await DatabaseService.getInstance().connect();

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🎅 Secret Santa server running on port ${PORT}`);
      console.log(
        `📊 Health check available at http://localhost:${PORT}/api/health`,
      );
      console.log(
        `🌍 Environment: ${process.env["NODE_ENV"] || "development"}`,
      );
    });

    server.on("error", (error) => {
      console.error("❌ Server error:", error);
    });

    // Graceful shutdown
    const shutdown = async () => {
      server.close(async () => {
        await DatabaseService.getInstance().disconnect();
        console.log("Server closed gracefully.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    return server;
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});

export default app;
