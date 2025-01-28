"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prometheusClient_1 = __importDefault(require("../services/prometheusClient"));
const router = express_1.default.Router();
router.get('/advanced', async (req, res) => {
    try {
        console.log('Received request to /advanced endpoint');
        const query = 'rate(container_cpu_usage_seconds_total[1m])';
        console.log(`Executing Prometheus Query: ${query}`);
        const result = await prometheusClient_1.default.instantQuery(query);
        const transformedData = result.result.map((item) => ({
            container: item.metric.container || 'unknown',
            cpuPercent: parseFloat(item.value[1]) * 100,
        }));
        console.log('Transformed Data:', transformedData);
        res.json({ containers: transformedData });
    }
    catch (error) {
        console.error('Error in /metrics/advanced:', error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=metrics.js.map