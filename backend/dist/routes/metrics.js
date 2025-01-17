"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
console.log('test');
const router = (0, express_1.Router)();
const prometheusUrl = process.env.PROMETHEUS_URL || 'http://prometheus:9090';
router.get('/advanced', async (req, res) => {
    try {
        console.log('Received request to /advanced endpoint');
        console.log(`Using Prometheus URL: ${prometheusUrl}/api/v1/query?query=rate(container_cpu_usage_seconds_total%5B1m%5D)`);
        const response = await fetch(`${prometheusUrl}/api/v1/query?query=rate(container_cpu_usage_seconds_total%5B1m%5D)`);
        console.log('Fetch status:', response.status);
        if (!response.ok) {
            throw new Error(`Prometheus API error: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Successfully fetched data from Prometheus:', data);
        res.json({ data });
    }
    catch (error) {
        console.error('Error fetching data from Prometheus:', error.message);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=metrics.js.map