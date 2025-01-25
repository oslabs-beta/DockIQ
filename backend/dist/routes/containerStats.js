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
        const containerData = containers.map((container) => {
            if (container.State === 'running')
                stats.running++;
            else if (container.State === 'exited')
                stats.stopped++;
            else if (container.State === 'unhealthy')
                stats.unhealthy++;
            else if (container.State === 'restarting')
                stats.restarting++;
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
        res.json({ stats, containers: containerData });
    }
    catch (error) {
        console.error('Error fetching container stats:', error);
        res.status(500).json({ message: 'Error fetching container stats' });
    }
});
exports.default = router;
//# sourceMappingURL=containerStats.js.map