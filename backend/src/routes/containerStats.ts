import { Router, Request, Response } from 'express';
import Docker from 'dockerode';

const router = Router();
const docker = new Docker();

interface Container {
  Names: string[];
  State: string;
  Status: string;
}

router.get('/container-stats', async (req: Request, res: Response) => {
  try {
    const containers: Container[] = await docker.listContainers({ all: true });

    const stats = {
      running: 0,
      stopped: 0,
      unhealthy: 0,
      restarting: 0,
    };

    // Map container details and calculate stats
    const containerData = containers.map((container: Container) => {
      // Update stats based on container state
      if (container.State === 'running') stats.running++;
      else if (container.State === 'exited') stats.stopped++;
      else if (container.State === 'unhealthy') stats.unhealthy++;
      else if (container.State === 'restarting') stats.restarting++;

      // Return detailed information for each container
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

    // Return both stats and container details
    res.json({ stats, containers: containerData });
  } catch (error) {
    console.error('Error fetching container stats:', error);
    res.status(500).json({ message: 'Error fetching container stats' });
  }
});

export default router;
