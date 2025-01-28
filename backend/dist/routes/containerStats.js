"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dockerode_1 = __importDefault(require("dockerode"));
const express_ws_1 = __importDefault(require("express-ws"));
const prometheus_query_1 = require("prometheus-query");
const prometheusClient = new prometheus_query_1.PrometheusDriver({
    endpoint: process.env.PROMETHEUS_URL || 'http://localhost:9094',
});
exports.default = (app) => {
    (0, express_ws_1.default)(app);
    const router = (0, express_1.Router)();
    const docker = new dockerode_1.default();
    const getDetailedContainerStats = async (container, containerInfo) => {
        try {
            const containerStats = await new Promise((resolve, reject) => {
                container.stats({ stream: false }, (err, data) => {
                    if (err)
                        reject(err);
                    else
                        resolve(data);
                });
            });
            return {
                name: containerInfo.Names[0]?.replace(/^\//, ''),
                status: containerInfo.State,
                warning: containerInfo.Status.includes('unhealthy'),
                memUsage: `${Math.round(containerStats.memory_stats.usage / 1024 / 1024)} MB`,
                memLimit: `${Math.round(containerStats.memory_stats.limit / 1024 / 1024)} MB`,
                netIO: `${Math.round(containerStats.networks.eth0.rx_bytes / 1024)} KB / ${Math.round(containerStats.networks.eth0.tx_bytes / 1024)} KB`,
                blockIO: `${Math.round(containerStats.blkio_stats.io_service_bytes_recursive?.[0]?.value /
                    1024 || 0)} KB`,
                pids: containerStats.pids_stats?.current || '--',
            };
        }
        catch (error) {
            console.error(`Error fetching stats for container ${containerInfo.Names[0]}:`, error);
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
    const getCpuPercentage = async (containerName) => {
        try {
            const query = `rate(container_cpu_usage_seconds_total{container="${containerName}"}[1m]) * 100`;
            const result = await prometheusClient.instantQuery(query);
            console.log('Prometheus Query Result:', result);
            if (result.result && result.result.length > 0) {
                const cpuPercent = parseFloat(result.result[0].value[1]);
                return cpuPercent || 0;
            }
            return 0;
        }
        catch (error) {
            console.error(`Error fetching CPU % for container ${containerName}:`, error);
            return 0;
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
        const containerData = await Promise.all(containers.map(async (containerInfo) => {
            if (containerInfo.State === 'running')
                stats.running++;
            else if (containerInfo.State === 'exited')
                stats.stopped++;
            else if (containerInfo.State === 'unhealthy')
                stats.unhealthy++;
            else if (containerInfo.State === 'restarting')
                stats.restarting++;
            const containerInstance = docker.getContainer(containerInfo.Id);
            const detailedStats = await getDetailedContainerStats(containerInstance, containerInfo);
            const cpuPercent = await getCpuPercentage(containerInfo.Names[0].replace(/^\//, ''));
            return {
                ...detailedStats,
                cpuPercent: `${cpuPercent.toFixed(2)} %`,
            };
        }));
        return { stats, containers: containerData };
    };
    router.get('/container-stats', async (req, res) => {
        try {
            const data = await fetchContainerStats();
            res.json(data);
        }
        catch (error) {
            console.error('Error fetching container stats:', error);
            res.status(500).json({ message: 'Error fetching container stats' });
        }
    });
    router.ws('/container-stats-stream', (ws) => {
        console.log('WebSocket client connected for real-time updates.');
        const sendStats = async () => {
            try {
                const data = await fetchContainerStats();
                ws.send(JSON.stringify(data));
            }
            catch (error) {
                console.error('Error fetching container stats for WebSocket:', error);
                ws.send(JSON.stringify({ error: 'Error fetching container stats' }));
            }
        };
        sendStats();
        const interval = setInterval(sendStats, 500);
        ws.on('close', () => {
            console.log('WebSocket client disconnected.');
            clearInterval(interval);
        });
    });
    return router;
};
//# sourceMappingURL=containerStats.js.map