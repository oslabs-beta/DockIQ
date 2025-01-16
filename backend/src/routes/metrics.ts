import {Router, Request, Response} from 'express'

const router = Router(); 

router.get('/advanced', async (req: Request, res: Response): Promise<void> => {
  try {
    const response = await fetch('http://localhost:9090/api/v1/query?query=rate(container_cpu_usage_seconds_total[1m])');
    if (!response.ok) {
      throw new Error(`Prometheus API error: ${response.statusText}`);
    }
    const data = await response.json();
    res.json({data});
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router; 