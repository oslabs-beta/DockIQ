import express, { Application, Request, Response, NextFunction } from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import metricsRouter from './routes/metrics';
import containerStatsRouter from './routes/containerStats';

const app: Application = express();
expressWs(app); // Initialize express-ws on the app

// Enable CORS
app.use(
  cors({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Middleware to parse JSON requests
app.use(express.json());

// Health check route
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend server is running!' });
});

// Ping route
app.get('/ping', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'pong' });
});

// Metrics routes
app.use('/metrics', metricsRouter);

// Container Stats routes
const containerStats = containerStatsRouter(app); // Pass `app` to containerStatsRouter
app.use('/api', containerStats);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ status: 'error', message: err.message });
});

// Start the server
const port: number = Number(process.env.PORT) || 3001;
app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server running on port ${port}`);
});
