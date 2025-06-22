import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import multer from "multer";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Multer error handling middleware - must come after routes that use multer
  app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'Audio file too large. Maximum size is 10MB.',
          error: 'FILE_TOO_LARGE'
        });
      }
      return res.status(400).json({
        message: 'File upload error',
        error: error.code
      });
    }
    next(error);
  });

  // General error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 8080
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 8080;
  const host = "127.0.0.1";
  
  server.listen(port, host, () => {
    log(`serving on port ${port}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      log(`Port ${port} is already in use`);
    } else if (err.code === 'ENOTSUP') {
      log(`Network operation not supported. Trying fallback...`);
      server.listen(port, () => {
        log(`serving on port ${port} (fallback mode)`);
      });
    } else {
      log(`Server error: ${err.message}`);
    }
  });
})();
