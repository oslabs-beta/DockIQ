import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors'; // Import CORS package
import { WebSocketServer, WebSocket } from 'ws'; // Import WebSocket support
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
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Allow requests from the frontend
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
const frontendBuildPath = path.join(__dirname, process.env.FRONTEND_BUILD_PATH || '../ui/build');
app.use(express.static(frontendBuildPath));

// Catch-All Route to Serve React Frontend
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// WebSocket Server
const port: number = parseInt(process.env.PORT || '3007', 10); // Ensure port is parsed as a number
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server running on port ${port}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket connection established');

  const interval = setInterval(async () => {
    try {
      const containers = await docker.listContainers({ all: true });

      const containerData = await Promise.all(
        containers.map(async (container) => {
          const containerInstance = docker.getContainer(container.Id);
          try {
            const stats: any = await new Promise((resolve, reject) => {
              containerInstance.stats({ stream: false }, (err, data) => {
                if (err) reject(err);
                else resolve(data);
              });
            });

            return {
              name: container.Names[0]?.replace(/^\//, ''),
              status: container.State,
              warning: container.Status.includes('unhealthy'),
              memUsage: `${Math.round(stats.memory_stats.usage / 1024 / 1024)} MB`,
              memLimit: `${Math.round(stats.memory_stats.limit / 1024 / 1024)} MB`,
              netIO: `${Math.round(
                stats.networks.eth0.rx_bytes / 1024
              )} KB / ${Math.round(stats.networks.eth0.tx_bytes / 1024)} KB`,
              blockIO: `${Math.round(
                stats.blkio_stats.io_service_bytes_recursive?.[0]?.value / 1024 || 0
              )} KB`,
              pids: stats.pids_stats?.current || '--',
            };
          } catch (error) {
            console.error(`Error fetching stats for container ${container.Id}:`, error);

            // Fallback values if stats fetching fails
            return {
              name: container.Names[0]?.replace(/^\//, ''),
              status: container.State,
              warning: container.Status.includes('unhealthy'),
              memUsage: '--',
              memLimit: '--',
              netIO: '--',
              blockIO: '--',
              pids: '--',
            };
          }
        })
      );

      ws.send(JSON.stringify({ containers: containerData }));
      console.log('WebSocket data sent:', containerData); // Log data sent to frontend
    } catch (error) {
      console.error('Error fetching container stats:', error);
    }
  }, 5000);

  // Handle WebSocket closure
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
