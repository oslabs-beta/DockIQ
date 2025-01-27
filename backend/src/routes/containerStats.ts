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

      const cpuDelta =
        containerStats.cpu_stats.cpu_usage.total_usage -
        containerStats.precpu_stats.cpu_usage.total_usage;
      const systemCpuDelta =
        containerStats.cpu_stats.system_cpu_usage -
        containerStats.precpu_stats.system_cpu_usage;
      const numCpus = containerStats.cpu_stats.online_cpus || 1;
      const cpuPercent =
        systemCpuDelta > 0 && cpuDelta > 0
          ? ((cpuDelta / systemCpuDelta) * numCpus * 100).toFixed(2)
          : '0.00';

      return {
        name: containerInfo.Names[0]?.replace(/^\//, ''),
        status: containerInfo.State,
        warning: containerInfo.Status.includes('unhealthy'),
        memUsage: `${(memUsage / 1024 / 1024).toFixed(2)} MB / ${(memLimit / 1024 / 1024).toFixed(2)} MB`,
        memPercent: `${memPercent} %`, // Separate memory percentage
        cpuPercent: `${cpuPercent} %`, // CPU percentage
        netIO: `${Math.round(
          containerStats.networks.eth0.rx_bytes / 1024
        )} KB / ${Math.round(containerStats.networks.eth0.tx_bytes / 1024)} KB`, // Net I/O in KB
        blockIO: `${Math.round(
          containerStats.blkio_stats.io_service_bytes_recursive?.[0]?.value /
            1024 || 0
        )} KB`, // Block I/O in KB
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

  router.get('/container-stats', async (req: Request, res: Response) => {
    try {
      const data = await fetchContainerStats();
      res.json(data);
    } catch (error) {
      console.error('Error fetching container stats:', error);
      res.status(500).json({ message: 'Error fetching container stats' });
    }
  });

  router.ws('/container-stats-stream', (ws) => {
    console.log('WebSocket client connected.');

    const sendStats = async () => {
      try {
        const data = await fetchContainerStats();
        ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('Error fetching container stats:', error);
        ws.send(JSON.stringify({ error: 'Error fetching container stats' }));
      }
    };

    sendStats();

    const interval = setInterval(sendStats, 5000);

    ws.on('close', () => {
      console.log('WebSocket client disconnected.');
      clearInterval(interval);
    });
  });

  return router;
};
