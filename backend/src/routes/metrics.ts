import express, { Request, Response, Router } from 'express';
import prometheusClient from '../services/prometheusClient'; // PrometheusDriver instance

const router: Router = express.Router();

// GET /metrics/advanced
router.get('/advanced', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Received request to /advanced endpoint');
    const query = 'rate(container_cpu_usage_seconds_total[1m])'; // PromQL query
    console.log(`Executing Prometheus Query: ${query}`);

    // Execute the Prometheus query
    const result = await prometheusClient.instantQuery(query);

    // Transform the Prometheus response into a usable format
    const transformedData = result.result.map((item: any) => ({
      container: item.metric.container || 'unknown', // Extract container name
      cpuPercent: parseFloat(item.value[1]) * 100, // Convert to percentage
    }));

    console.log('Transformed Data:', transformedData);

    // Return transformed data as JSON
    res.json({ containers: transformedData });
  } catch (error: any) {
    console.error('Error in /metrics/advanced:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
