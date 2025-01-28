"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_ws_1 = __importDefault(require("express-ws"));
const cors_1 = __importDefault(require("cors"));
const metrics_1 = __importDefault(require("./routes/metrics"));
const containerStats_1 = __importDefault(require("./routes/containerStats"));
const app = (0, express_1.default)();
(0, express_ws_1.default)(app);
app.use((0, cors_1.default)({
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Backend server is running!' });
});
app.get('/ping', (req, res) => {
    res.json({ status: 'ok', message: 'pong' });
});
app.use('/metrics', metrics_1.default);
const containerStats = (0, containerStats_1.default)(app);
app.use('/api', containerStats);
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ status: 'error', message: err.message });
});
const port = Number(process.env.PORT) || 3001;
app.listen(port, '0.0.0.0', () => {
    console.log(`Backend server running on port ${port}`);
});
//# sourceMappingURL=app.js.map