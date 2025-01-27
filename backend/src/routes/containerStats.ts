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
  labelNames: ['container'],
});

const memGauge = new client.Gauge({
  name: 'container_memory_usage',
  help: 'Memory usage of a container',
  labelNames: ['container'],
});

const networkRxGauge = new client.Gauge({
  name: 'container_network_rx_bytes',
  help: 'Network receive bytes of a container',
  labelNames: ['container'],
});

const networkTxGauge = new client.Gauge({
  name: 'container_network_tx_bytes',
  help: 'Network transmit bytes of a container',
  labelNames: ['container'],
});

// Helper function to calculate Block I/O stats
const getBlockIO = (containerStats: any): { read: number; write: number } => {
  const readIO =
    containerStats.blkio_stats?.io_service_bytes_recursive?.find(
      (io: any) => io.op === 'Read'
    )?.value || 0;
  const writeIO =
    containerStats.blkio_stats?.io_service_bytes_recursive?.find(
      (io: any) => io.op === 'Write'
    )?.value || 0;

  return {
    read: readIO,
    write: writeIO,
  };
};

// Helper function to fetch container stats and update Prometheus gauges
const updatePrometheusMetrics = async () => {
  const containers = await docker.listContainers({ all: true });

  if (containers.length === 0) {
    console.log('No containers found.');
    return;
  }

  console.log(`Found ${containers.length} containers.`);

  await Promise.all(
    containers.map(async (containerInfo) => {
      const containerInstance = docker.getContainer(containerInfo.Id);

      const containerStats: any = await new Promise((resolve, reject) => {
        containerInstance.stats({ stream: false }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      console.log(`Updating metrics for container: ${containerInfo.Names[0]}`);
      console.log(containerStats);

      const cpuPercent =
        parseFloat(containerStats.cpu_stats.cpu_usage.total_usage) || 0;
      const memUsage = containerStats.memory_stats.usage || 0;
      const netRx = containerStats.networks.eth0.rx_bytes || 0;
      const netTx = containerStats.networks.eth0.tx_bytes || 0;

      // Set the metrics in the Prometheus registry
      cpuGauge.set(
        { container: containerInfo.Names[0]?.replace(/^\//, '') },
        cpuPercent
      );
      memGauge.set(
        { container: containerInfo.Names[0]?.replace(/^\//, '') },
        memUsage
      );
      networkRxGauge.set(
        { container: containerInfo.Names[0]?.replace(/^\//, '') },
        netRx
      );
      networkTxGauge.set(
        { container: containerInfo.Names[0]?.replace(/^\//, '') },
        netTx
      );
    })
  );
};

// Helper function to fetch detailed stats for a container
const getDetailedContainerStats = async (
  container: Docker.Container,
  containerInfo: any
) => {
  try {
    const containerStats: any = await new Promise((resolve, reject) => {
      container.stats({ stream: false }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const memUsage = containerStats.memory_stats.usage || 0;
    const memLimit = containerStats.memory_stats.limit || 1; // Avoid division by zero
    const memPercent = ((memUsage / memLimit) * 100).toFixed(2);

    const cpuPercent = (
      ((parseFloat(containerStats.cpu_stats.cpu_usage.total_usage) || 0) /
        (parseFloat(containerStats.cpu_stats.system_cpu_usage) || 1)) *
      100
    ).toFixed(2);

    const netRx = containerStats.networks.eth0.rx_bytes || 0;
    const netTx = containerStats.networks.eth0.tx_bytes || 0;

    const blockIO = getBlockIO(containerStats);

    return {
      name: containerInfo.Names[0]?.replace(/^\//, ''),
      status: containerInfo.State,
      warning: containerInfo.Status.includes('unhealthy'),
      memUsage: `${(memUsage / 1024 / 1024).toFixed(2)} MB / ${(
        memLimit /
        1024 /
        1024
      ).toFixed(2)} MB`,
      memPercent: `${memPercent} %`,
      cpuPercent: `${cpuPercent} %`,
      netIO: `${Math.round(netRx / 1024)} KB / ${Math.round(netTx / 1024)} KB`,
      blockIO: `${Math.round(blockIO.read / 1024)} KB / ${Math.round(
        blockIO.write / 1024
      )} KB`,
      pids: containerStats.pids_stats?.current || '--',
    };
  } catch (error) {
    console.error(
      `Error fetching stats for container ${containerInfo.Names[0]}:`,
      error
    );
    return {
      name: containerInfo.Names[0]?.replace(/^\//, ''),
      status: containerInfo.State,
      warning: containerInfo.Status.includes('unhealthy'),
      memUsage: '--',
      memPercent: '--',
      cpuPercent: '--',
      netIO: '--',
      blockIO: '--',
      pids: '--',
    };
  }
};

// Fetch container stats from Docker API
const fetchContainerStats = async () => {
  const containers = await docker.listContainers({ all: true });

  const stats = {
    running: 0,
    stopped: 0,
    unhealthy: 0,
    restarting: 0,
  };

  const containerData = await Promise.all(
    containers.map(async (containerInfo) => {
      if (containerInfo.State === 'running') stats.running++;
      else if (containerInfo.State === 'exited') stats.stopped++;
      else if (containerInfo.State === 'unhealthy') stats.unhealthy++;
      else if (containerInfo.State === 'restarting') stats.restarting++;

      const containerInstance = docker.getContainer(containerInfo.Id);

      return await getDetailedContainerStats(containerInstance, containerInfo);
    })
  );

  return { stats, containers: containerData };
};

// Create the Express router
export default (app: Application) => {
  expressWs(app); // Initialize express-ws on the app
  const router = Router();

  // REST API endpoint to fetch container stats
  router.get('/container-stats', async (req: Request, res: Response) => {
    try {
      const data = await fetchContainerStats(); // Fetch stats
      res.json(data); // Return stats in JSON format
    } catch (error) {
      console.error('Error fetching container stats:', error);
      res.status(500).json({ message: 'Error fetching container stats' });
    }
  });

  // Prometheus metrics endpoint
  // Prometheus metrics endpoint
  router.get('/metrics', async (req: Request, res: Response) => {
    console.log('Received request for /metrics');
    try {
      // Update Prometheus metrics before returning
      await updatePrometheusMetrics();

      console.log('Fetching metrics from Prometheus registry...');
      const metrics = await register.metrics();

      console.log('Metrics fetched successfully:');
      console.log(metrics);

      // Return Prometheus metrics
      res.set('Content-Type', register.contentType); // Set content type for Prometheus
      res.send(metrics); // Send metrics as response
    } catch (error) {
      console.error('Error fetching Prometheus metrics:', error);
      res.status(500).send('Error fetching Prometheus metrics');
    }
  });

  // WebSocket endpoint to stream container stats
  router.ws('/container-stats-stream', (ws) => {
    console.log('WebSocket client connected.');

    const sendStats = async () => {
      try {
        const data = await fetchContainerStats(); // Fetch container stats
        ws.send(JSON.stringify(data)); // Send stats to the WebSocket client
      } catch (error) {
        console.error('Error fetching container stats:', error);
        ws.send(JSON.stringify({ error: 'Error fetching container stats' }));
      }
    };

    sendStats(); // Initial data send
    const interval = setInterval(sendStats, 1000); // Update every second

    ws.on('close', () => {
      console.log('WebSocket client disconnected.');
      clearInterval(interval); // Clean up interval when WebSocket disconnects
    });
  });

  return router;
};
