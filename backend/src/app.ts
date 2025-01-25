import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors'; // Import CORS package
import { WebSocketServer } from 'ws'; // Import WebSocket support
import path from 'path'; // Import path for serving static files
import metricsRouter from './routes/metrics';
import containerStatsRouter from './routes/containerStats';
import Docker from 'dockerode';

// Initialize Docker client
const docker = new Docker();

const app: Application = express();

// Add CORS middleware using the `cors` package
app.use(
  cors({
    origin: 'http://localhost:3001', // Allow requests from the frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Define allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Define allowed headers
    credentials: true, // Allow cookies or credentials if needed
  })
);

// Add request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Middleware to parse JSON requests
app.use(express.json());

// Basic health check route
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend server is running!' });
});

// Ping route
app.get('/ping', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'pong' });
});

// Metrics routes
app.use('/metrics', metricsRouter);

// Container Stats route
app.use('/api', containerStatsRouter); // Register the container-stats route under "/api"

// Serve Frontend Static Files
const frontendBuildPath = path.join(__dirname, '../ui/build');
app.use(express.static(frontendBuildPath));

// Catch-All Route to Serve React Frontend
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// WebSocket Server
const server = app.listen(process.env.PORT || 3003, '0.0.0.0', () => {
  console.log(`Backend server running on port ${process.env.PORT || 3003}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket connection established');

  // Periodically send container stats
  const interval = setInterval(async () => {
    try {
      const containers = await docker.listContainers({ all: true });
      const containerData = containers.map((container) => ({
        name: container.Names[0]?.replace(/^\//, ''),
        status: container.State,
        warning: container.Status.includes('unhealthy'),
        memUsage: '--', // Placeholder
        netIO: '--', // Placeholder
      }));

      ws.send(JSON.stringify({ containers: containerData }));
    } catch (error) {
      console.error('Error fetching container stats:', error);
    }
  }, 5000);

  // Handle WebSocket close
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    clearInterval(interval);
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ status: 'error', message: err.message });
});

export default app;
