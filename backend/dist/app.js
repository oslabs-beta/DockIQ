"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const metrics_1 = __importDefault(require("./routes/metrics"));
const containerStats_1 = __importDefault(require("./routes/containerStats"));
const app = (0, express_1.default)();
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    next();
});
app.use(express_1.default.json());
app.get('/', (req, res) => {
    console.log('Root route hit');
    res.json({ status: 'ok', message: 'Backend server is running!' });
});
app.get('/ping', (req, res) => {
    console.log('Ping route hit');
    res.json({ status: 'ok', message: 'pong' });
});
app.use('/metrics', metrics_1.default);
app.use('/api', containerStats_1.default);
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ status: 'error', message: err.message });
});
const port = Number(process.env.PORT) || 3001;
app.listen(port, '0.0.0.0', () => {
    console.log(`Backend server running on port ${port}`);
    console.log(`Try accessing: http://localhost:${port}/ping`);
});
exports.default = app;
//# sourceMappingURL=app.js.map