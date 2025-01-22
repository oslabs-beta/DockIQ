import express from 'express';
import metricsRoute from './routes/metricsRoute';

const app = express();
const PORT = 3000;

// Use the metrics route to expose metrics at /api/metrics
app.use('/api', metricsRoute);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
