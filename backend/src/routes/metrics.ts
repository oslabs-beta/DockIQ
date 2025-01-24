import { Router, Request, Response } from 'express';
import { PrometheusDriver } from 'prometheus-query';

console.log('test');
const router = Router();

// Initialize Prometheus Client
const prometheusClient = new PrometheusDriver({
  endpoint: process.env.PROMETHEUS_URL || 'http://prometheus:9090',
});

router.get('/advanced', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Received request to /advanced endpoint');

    const query = 'rate(container_cpu_usage_seconds_total[1m])';
    console.log(`Executing Prometheus Query: ${query}`);

    const data = await prometheusClient.instantQuery(query);
    console.log('Query result:', JSON.stringify(data, null, 2));

    res.json({ data });
  } catch (error: any) {
    console.error('Error in /metrics/advanced:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
