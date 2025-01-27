import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import containerStatsRouter from './routes/containerStats'; // Import the container stats router

const app: Application = express();

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

// Container Stats routes
const containerStats = containerStatsRouter(app); // Pass `app` to containerStatsRouter
app.use('/api', containerStats);

// Start the server
const port: number = Number(process.env.PORT) || 3003;
app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server running on port ${port}`);
});
