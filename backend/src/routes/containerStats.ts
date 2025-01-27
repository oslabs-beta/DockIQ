import { Router, Request, Response } from 'express';
import Docker from 'dockerode';
import { Application } from 'express';
import expressWs from 'express-ws';

export default (app: Application) => {
  expressWs(app); // Attach express-ws to the app
  const router = Router();
  const docker = new Docker();

  // Endpoint to fetch container stats (REST API)
  router.get('/container-stats', async (req: Request, res: Response) => {
    try {
      const containers = await docker.listContainers({ all: true });

      const stats = {
        running: 0,
        stopped: 0,
        unhealthy: 0,
        restarting: 0,
      };

      // Map container details and calculate stats
      const containerData = containers.map((container) => {
        if (container.State === 'running') stats.running++;
        else if (container.State === 'exited') stats.stopped++;
        else if (container.State === 'unhealthy') stats.unhealthy++;
        else if (container.State === 'restarting') stats.restarting++;

        return {
          name: container.Names[0].replace(/^\//, ''), // Remove leading slash from name
          status: container.State,
          warning: container.Status.includes('unhealthy'),
          memUsage: '--', // Placeholder for memory usage
          memLimit: '--', // Placeholder for memory limit
          netIO: '--', // Placeholder for network IO
          blockIO: '--', // Placeholder for block IO
          pids: '--', // Placeholder for PID count
        };
      });

      res.json({ stats, containers: containerData });
    } catch (error) {
      console.error('Error fetching container stats:', error);
      res.status(500).json({ message: 'Error fetching container stats' });
    }
  });

  router.ws('/container-stats-stream', (ws) => {
    console.log('WebSocket client connected for real-time updates.');

    const sendStats = async () => {
      try {
        const containers = await docker.listContainers({ all: true });

        const stats = {
          running: 0,
          stopped: 0,
          unhealthy: 0,
          restarting: 0,
        };

        const containerData = containers.map((container) => {
          if (container.State === 'running') stats.running++;
          else if (container.State === 'exited') stats.stopped++;
          else if (container.State === 'unhealthy') stats.unhealthy++;
          else if (container.State === 'restarting') stats.restarting++;

          return {
            name: container.Names[0].replace(/^\//, ''),
            status: container.State,
            warning: container.Status.includes('unhealthy'),
            memUsage: '--',
            memLimit: '--',
            netIO: '--',
            blockIO: '--',
            pids: '--',
          };
        });

        // Send data to the WebSocket client
        ws.send(JSON.stringify({ stats, containers: containerData }));
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
