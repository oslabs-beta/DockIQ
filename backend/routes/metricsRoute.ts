import express from 'express';
import { register } from '../metrics/metricsCollection';

const router = express.Router();

// Expose a route for Prometheus to scrape the metrics
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).send(err);
  }
});

export default router;
