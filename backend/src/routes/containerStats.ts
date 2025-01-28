import { Router, Request, Response } from 'express';
import Docker from 'dockerode';
import { Application } from 'express';
import expressWs from 'express-ws';
import client from 'prom-client'; // Prometheus client library

// Initialize Docker and Prometheus Registry
const docker = new Docker();
const register = new client.Registry();

// Define Prometheus gauges to track container metrics
const cpuGauge = new client.Gauge({
  name: 'container_cpu_usage',
  help: 'CPU usage of a container',
  labelNames: ['container'] as const,
});
const memGauge = new client.Gauge({
  name: 'container_memory_usage',
  help: 'Memory usage of a container',
  labelNames: ['container'] as const,
});
const networkRxGauge = new client.Gauge({
  name: 'container_network_rx_bytes',
  help: 'Network receive bytes of a container',
  labelNames: ['container'] as const,
});
const networkTxGauge = new client.Gauge({
  name: 'container_network_tx_bytes',
  help: 'Network transmit bytes of a container',
  labelNames: ['container'] as const,
});
const blockReadGauge = new client.Gauge({
  name: 'container_block_read_bytes',
  help: 'Block I/O read bytes of a container',
  labelNames: ['container'] as const,
});
const blockWriteGauge = new client.Gauge({
  name: 'container_block_write_bytes',
  help: 'Block I/O write bytes of a container',
  labelNames: ['container'] as const,
});
const pidsGauge = new client.Gauge({
  name: 'container_pids',
  help: 'Number of PIDs in a container',
  labelNames: ['container'] as const,
});

// Register all metrics
register.registerMetric(cpuGauge);
register.registerMetric(memGauge);
register.registerMetric(networkRxGauge);
register.registerMetric(networkTxGauge);
register.registerMetric(blockReadGauge);
register.registerMetric(blockWriteGauge);
register.registerMetric(pidsGauge);

// Function to update Prometheus metrics
const updatePrometheusMetrics = async () => {
  const containers = await docker.listContainers({ all: true });

  // Get the list of active container names
  const activeContainerNames = containers.map((containerInfo) =>
    containerInfo.Names[0]?.replace(/^\//, '')
  );

  // Remove metrics for containers that no longer exist
  const registeredContainers = (await cpuGauge.get()).values.map(
    (value) => value.labels.container
  );

  registeredContainers.forEach((containerName) => {
    if (
      typeof containerName === 'string' &&
      !activeContainerNames.includes(containerName)
    ) {
      // Remove metrics
      cpuGauge.remove({ container: containerName });
      memGauge.remove({ container: containerName });
      networkRxGauge.remove({ container: containerName });
      networkTxGauge.remove({ container: containerName });
      blockReadGauge.remove({ container: containerName });
      blockWriteGauge.remove({ container: containerName });
      pidsGauge.remove({ container: containerName });
      console.log(`Removed metrics for container: ${containerName}`);
    } else if (typeof containerName !== 'string') {
      console.warn(`Invalid container name: ${containerName}`);
    }
  });

  // If no active containers, log and exit
  if (containers.length === 0) {
    console.log('No containers found.');
    return;
  }

  await Promise.all(
    containers.map(async (containerInfo) => {
      const containerInstance = docker.getContainer(containerInfo.Id);
      const containerName =
        containerInfo.Names[0]?.replace(/^\//, '') || 'unknown';

      try {
        const containerStats: any = await new Promise((resolve, reject) => {
          containerInstance.stats({ stream: false }, (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });

        // CPU Usage Calculation
        const cpuDelta =
          containerStats.cpu_stats.cpu_usage.total_usage -
          containerStats.precpu_stats.cpu_usage.total_usage;
        const systemDelta =
          containerStats.cpu_stats.system_cpu_usage -
          containerStats.precpu_stats.system_cpu_usage;
        const onlineCPUs = containerStats.cpu_stats.online_cpus || 1;

        let cpuPercent = 0;
        if (systemDelta > 0 && cpuDelta > 0) {
          cpuPercent = (cpuDelta / systemDelta) * onlineCPUs * 100;
        }

        // Memory Usage
        const memUsage = containerStats.memory_stats.usage || 0;

        // Network I/O
        const netRx = containerStats.networks?.eth0?.rx_bytes || 0;
        const netTx = containerStats.networks?.eth0?.tx_bytes || 0;

        // Block I/O
        const blkioStats: { op: string; value: number }[] =
          containerStats.blkio_stats?.io_service_bytes_recursive || [];
        const blockRead = blkioStats.find((io) => io.op === 'Read')?.value || 0;
        const blockWrite =
          blkioStats.find((io) => io.op === 'Write')?.value || 0;

        // PIDs
        const pids = containerStats.pids_stats?.current || 0;

        // Update Prometheus metrics
        cpuGauge.set({ container: containerName }, cpuPercent);
        memGauge.set({ container: containerName }, memUsage);
        networkRxGauge.set({ container: containerName }, netRx);
        networkTxGauge.set({ container: containerName }, netTx);
        blockReadGauge.set({ container: containerName }, blockRead);
        blockWriteGauge.set({ container: containerName }, blockWrite);
        pidsGauge.set({ container: containerName }, pids);

        console.log(
          `Updated metrics for ${containerName} - CPU: ${cpuPercent}%, Memory: ${memUsage} bytes`
        );
      } catch (error) {
        console.error(
          `Error updating metrics for container ${containerName}`,
          error
        );
      }
    })
  );
};

// Create the Express router
export default (app: Application) => {
  expressWs(app); // Initialize express-ws on the app
  const router = Router();

  // REST API endpoint to fetch Prometheus metrics
  router.get('/metrics', async (_req: Request, res: Response) => {
    console.log('Received request for /metrics');

    try {
      await updatePrometheusMetrics(); // Update metrics before serving

      const metrics = await register.metrics(); // Fetch metrics
      res.set('Content-Type', register.contentType);
      res.send(metrics); // Serve metrics
    } catch (error) {
      console.error('Error fetching Prometheus metrics:', error);
      res.status(500).send('Error fetching Prometheus metrics');
    }
  });

  // WebSocket endpoint to stream Prometheus metrics
  router.ws('/metrics-stream', (ws) => {
    console.log('WebSocket client connected for metrics.');

    const sendMetrics = async () => {
      try {
        // Fetch and update Prometheus metrics
        await updatePrometheusMetrics();

        // Retrieve all metrics from the registry
        const metrics = await register.metrics();

        // Send the metrics to the WebSocket client
        ws.send(JSON.stringify({ metrics }));
      } catch (error) {
        console.error('Error streaming Prometheus metrics:', error);
        ws.send(JSON.stringify({ error: 'Error streaming metrics' }));
      }
    };

    // Send metrics periodically (every 500ms)
    const interval = setInterval(sendMetrics, 500);

    ws.on('close', () => {
      console.log('WebSocket client disconnected.');
      clearInterval(interval); // Stop sending metrics when the client disconnects
    });
  });

  return router;
};
