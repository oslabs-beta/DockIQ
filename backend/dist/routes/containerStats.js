"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dockerode_1 = __importDefault(require("dockerode"));
const router = (0, express_1.Router)();
const docker = new dockerode_1.default();
router.get('/container-stats', async (req, res) => {
    try {
        const containers = await docker.listContainers({ all: true });
        const stats = {
            running: 0,
            stopped: 0,
            unhealthy: 0,
            restarting: 0,
        };
        const containerData = await Promise.all(containers.map(async (container) => {
            if (container.State === 'running')
                stats.running++;
            else if (container.State === 'exited')
                stats.stopped++;
            else if (container.State === 'unhealthy')
                stats.unhealthy++;
            else if (container.State === 'restarting')
                stats.restarting++;
            const containerInstance = docker.getContainer(container.Id);
            try {
                const containerStats = await new Promise((resolve, reject) => {
                    containerInstance.stats({ stream: false }, (err, data) => {
                        if (err)
                            reject(err);
                        else
                            resolve(data);
                    });
                });
                return {
                    name: container.Names[0]?.replace(/^\//, ''),
                    status: container.State,
                    warning: container.Status.includes('unhealthy'),
                    memUsage: `${Math.round(containerStats.memory_stats.usage / 1024 / 1024)} MB`,
                    memLimit: `${Math.round(containerStats.memory_stats.limit / 1024 / 1024)} MB`,
                    netIO: `${Math.round(containerStats.networks.eth0.rx_bytes / 1024)} KB / ${Math.round(containerStats.networks.eth0.tx_bytes / 1024)} KB`,
                    blockIO: `${Math.round(containerStats.blkio_stats.io_service_bytes_recursive?.[0]?.value / 1024 || 0)} KB`,
                    pids: containerStats.pids_stats?.current || '--',
                };
            }
            catch (error) {
                console.error(`Error fetching stats for container ${container.Names[0]}:`, error);
                return {
                    name: container.Names[0]?.replace(/^\//, ''),
                    status: container.State,
                    warning: container.Status.includes('unhealthy'),
                    memUsage: '--',
                    memLimit: '--',
                    netIO: '--',
                    blockIO: '--',
                    pids: '--',
                };
            }
        }));
        res.json({ stats, containers: containerData });
    }
    catch (error) {
        console.error('Error fetching container stats:', error);
        res.status(500).json({ message: 'Error fetching container stats' });
    }
});
exports.default = router;
//# sourceMappingURL=containerStats.js.map