import express, { Application, Request, Response, NextFunction } from 'express';
import metricsRouter from './routes/metrics';

const app: Application = express();
console.log('New test log to verify changes');
// Add CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

// Add request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  next();
});

app.use(express.json());

// Basic health check route
app.get('/', (req: Request, res: Response) => {
  console.log('Root route hit');
  res.json({ status: 'ok', message: 'Backend server is running!' });
});

// Ping route
app.get('/ping', (req: Request, res: Response) => {
  console.log('Ping route hit');
  res.json({ status: 'ok', message: 'pong' });
});

// Metrics routes
app.use('/metrics', metricsRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ status: 'error', message: err.message });
});

const port: number = Number(process.env.PORT) || 3001;

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server running on port ${port}`);
  console.log(`Try accessing: http://localhost:${port}/ping`);
});

export default app;
