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
  help: 'CPU usage of a container (percentage)',
  labelNames: ['container'] as const,
});
const memGauge = new client.Gauge({
  name: 'container_memory_usage',
  help: 'Memory usage of a container in bytes',
  labelNames: ['container'] as const,
});
const memPercentGauge = new client.Gauge({
  name: 'container_memory_percentage',
  help: 'Memory usage percentage of a container',
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
const pidsGauge = new client.Gauge({
  name: 'container_pids',
  help: 'Number of PIDs in a container',
  labelNames: ['container'] as const,
});

// Register all metrics
register.registerMetric(cpuGauge);
register.registerMetric(memGauge);
register.registerMetric(memPercentGauge);
register.registerMetric(networkRxGauge);
register.registerMetric(networkTxGauge);
register.registerMetric(pidsGauge);

// Store the last collected metrics
let lastMetrics = '';

const updatePrometheusMetrics = async () => {
  try {
    const containers = await docker.listContainers({ all: true });

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
          const containerStats: any = await containerInstance.stats({
            stream: false,
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
          const memLimit =
            containerStats.memory_stats.limit > 0
              ? containerStats.memory_stats.limit
              : memUsage;
          const memPercent = Math.min(
            (memUsage / Math.max(1, memLimit)) * 100,
            100
          );

          // Debug Log for Memory Values
          console.log(
            `Container: ${containerName} | Mem Usage: ${(
              memUsage /
              1024 /
              1024
            ).toFixed(2)} MB | Mem Limit: ${(memLimit / 1024 / 1024).toFixed(
              2
            )} MB | Mem %: ${memPercent.toFixed(2)}%`
          );

          // Network I/O
          const netRx = containerStats.networks?.eth0?.rx_bytes || 0;
          const netTx = containerStats.networks?.eth0?.tx_bytes || 0;

          // PIDs
          const pids = containerStats.pids_stats?.current || 0;

          // Update Prometheus metrics
          cpuGauge.set({ container: containerName }, cpuPercent);
          memGauge.set({ container: containerName }, memUsage);
          memPercentGauge.set({ container: containerName }, memPercent);
          networkRxGauge.set({ container: containerName }, netRx);
          networkTxGauge.set({ container: containerName }, netTx);
          pidsGauge.set({ container: containerName }, pids);

          console.log(
            `Updated metrics for ${containerName} - CPU: ${cpuPercent.toFixed(
              2
            )}%, Mem: ${memPercent.toFixed(2)}%, Mem Usage: ${memUsage} bytes`
          );
        } catch (error) {
          console.error(
            `Error updating metrics for container ${containerName}`,
            error
          );
        }
      })
    );

    // Cache latest metrics
    lastMetrics = await register.metrics();
  } catch (error) {
    console.error('Error updating Prometheus metrics:', error);
  }
};

// Start updating metrics every 5 seconds in the background
setInterval(updatePrometheusMetrics, 5000);

export default (app: Application) => {
  expressWs(app); // Initialize express-ws on the app
  const router = Router();

  // Serve cached metrics instantly
  router.get('/metrics', (_req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.send(lastMetrics);
  });

  // WebSocket endpoint to stream Prometheus metrics
  router.ws('/metrics-stream', (ws) => {
    console.log('WebSocket client connected for metrics.');

    const sendMetrics = () => {
      ws.send(JSON.stringify({ metrics: lastMetrics }));
    };

    // Send metrics every 2 seconds instead of 500ms
    const interval = setInterval(sendMetrics, 2000);

    ws.on('close', () => {
      console.log('WebSocket client disconnected.');
      clearInterval(interval);
    });
  });

  return router;
};
