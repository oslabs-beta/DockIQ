"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/advanced', async (req, res) => {
    try {
        const response = await fetch('http://localhost:9090/api/v1/query?query=rate(container_cpu_usage_seconds_total[1m])');
        if (!response.ok) {
            throw new Error(`Prometheus API error: ${response.statusText}`);
        }
        const data = await response.json();
        res.json({ data });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=metrics.js.map