"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prometheus_query_1 = require("prometheus-query");
console.log('test');
const router = (0, express_1.Router)();
const prometheusClient = new prometheus_query_1.PrometheusDriver({
    endpoint: process.env.PROMETHEUS_URL || 'http://prometheus:9090',
});
router.get('/advanced', async (req, res) => {
    try {
        console.log('Received request to /advanced endpoint');
        const query = 'rate(container_cpu_usage_seconds_total[1m])';
        console.log(`Executing Prometheus Query: ${query}`);
        const data = await prometheusClient.instantQuery(query);
        console.log('Query result:', JSON.stringify(data, null, 2));
        res.json({ data });
    }
    catch (error) {
        console.error('Error in /metrics/advanced:', error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=metrics.js.map