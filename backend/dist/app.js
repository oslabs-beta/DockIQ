"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const ws_1 = require("ws");
const path_1 = __importDefault(require("path"));
const metrics_1 = __importDefault(require("./routes/metrics"));
const containerStats_1 = __importDefault(require("./routes/containerStats"));
const dockerode_1 = __importDefault(require("dockerode"));
const docker = new dockerode_1.default();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Backend server is running!' });
});
app.get('/ping', (req, res) => {
    res.json({ status: 'ok', message: 'pong' });
});
app.use('/metrics', metrics_1.default);
app.use('/api', containerStats_1.default);
const frontendBuildPath = path_1.default.join(__dirname, process.env.FRONTEND_BUILD_PATH || '../ui/build');
app.use(express_1.default.static(frontendBuildPath));
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(frontendBuildPath, 'index.html'));
});
const port = parseInt(process.env.PORT || '3007', 10);
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Backend server running on port ${port}`);
});
const wss = new ws_1.WebSocketServer({ server });
wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    const interval = setInterval(async () => {
        try {
            const containers = await docker.listContainers({ all: true });
            const containerData = await Promise.all(containers.map(async (container) => {
                const containerInstance = docker.getContainer(container.Id);
                try {
                    const stats = await new Promise((resolve, reject) => {
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
                        memUsage: `${Math.round(stats.memory_stats.usage / 1024 / 1024)} MB`,
                        memLimit: `${Math.round(stats.memory_stats.limit / 1024 / 1024)} MB`,
                        netIO: `${Math.round(stats.networks.eth0.rx_bytes / 1024)} KB / ${Math.round(stats.networks.eth0.tx_bytes / 1024)} KB`,
                        blockIO: `${Math.round(stats.blkio_stats.io_service_bytes_recursive?.[0]?.value / 1024 || 0)} KB`,
                        pids: stats.pids_stats?.current || '--',
                    };
                }
                catch (error) {
                    console.error(`Error fetching stats for container ${container.Id}:`, error);
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
            ws.send(JSON.stringify({ containers: containerData }));
            console.log('WebSocket data sent:', containerData);
        }
        catch (error) {
            console.error('Error fetching container stats:', error);
        }
    }, 5000);
    ws.on('close', () => {
        console.log('WebSocket connection closed');
        clearInterval(interval);
    });
});
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ status: 'error', message: err.message });
});
exports.default = app;
//# sourceMappingURL=app.js.map