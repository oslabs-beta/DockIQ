import { Router, Request, Response } from 'express';
import Docker from 'dockerode';
import { Application } from 'express';
import expressWs from 'express-ws';
import { PrometheusDriver, QueryResult } from 'prometheus-query';

// Initialize PrometheusDriver
const prometheusClient = new PrometheusDriver({
  endpoint: process.env.PROMETHEUS_URL || 'http://localhost:9094', // Prometheus URL
});

export default (app: Application) => {
  expressWs(app); // Attach express-ws to the app
  const router = Router();
  const docker = new Docker();

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

      return {
        name: containerInfo.Names[0]?.replace(/^\//, ''),
        status: containerInfo.State,
        warning: containerInfo.Status.includes('unhealthy'),
        memUsage: `${Math.round(
          containerStats.memory_stats.usage / 1024 / 1024
        )} MB`,
        memLimit: `${Math.round(
          containerStats.memory_stats.limit / 1024 / 1024
        )} MB`,
        netIO: `${Math.round(
          containerStats.networks.eth0.rx_bytes / 1024
        )} KB / ${Math.round(containerStats.networks.eth0.tx_bytes / 1024)} KB`,
        blockIO: `${Math.round(
          containerStats.blkio_stats.io_service_bytes_recursive?.[0]?.value /
            1024 || 0
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
        memLimit: '--',
        netIO: '--',
        blockIO: '--',
        pids: '--',
      };
    }
  };
  // Helper function to fetch CPU percentage
  const getCpuPercentage = async (containerName: string): Promise<number> => {
    try {
      const query = `rate(container_cpu_usage_seconds_total{container="${containerName}"}[1m]) * 100`;
      const result: QueryResult = await prometheusClient.instantQuery(query);

      // Inspect the result structure
      console.log('Prometheus Query Result:', result);

      // Extract data from the QueryResult
      if (result.result && result.result.length > 0) {
        const cpuPercent = parseFloat(result.result[0].value[1]);
        return cpuPercent || 0;
      }

      return 0;
    } catch (error) {
      console.error(
        `Error fetching CPU % for container ${containerName}:`,
        error
      );
      return 0;
    }
  };

  // Helper function to fetch all containers and their stats
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

        // Fetch detailed Docker stats
        const detailedStats = await getDetailedContainerStats(
          containerInstance,
          containerInfo
        );

        // Fetch CPU % from Prometheus
        const cpuPercent = await getCpuPercentage(
          containerInfo.Names[0].replace(/^\//, '')
        );

        return {
          ...detailedStats,
          cpuPercent: `${cpuPercent.toFixed(2)} %`, // Add CPU % to the stats
        };
      })
    );

    return { stats, containers: containerData };
  };

  // REST API endpoint to fetch container stats
  router.get('/container-stats', async (req: Request, res: Response) => {
    try {
      const data = await fetchContainerStats();
      res.json(data);
    } catch (error) {
      console.error('Error fetching container stats:', error);
      res.status(500).json({ message: 'Error fetching container stats' });
    }
  });

  // WebSocket endpoint to stream container stats
  router.ws('/container-stats-stream', (ws) => {
    console.log('WebSocket client connected for real-time updates.');

    const sendStats = async () => {
      try {
        const data = await fetchContainerStats();
        ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('Error fetching container stats for WebSocket:', error);
        ws.send(JSON.stringify({ error: 'Error fetching container stats' }));
      }
    };

    // Send stats immediately upon connection
    sendStats();

    // Continue sending stats every 5 seconds
    const interval = setInterval(sendStats, 500);

    // Cleanup when WebSocket connection is closed
    ws.on('close', () => {
      console.log('WebSocket client disconnected.');
      clearInterval(interval);
    });
  });

  return router;
};
