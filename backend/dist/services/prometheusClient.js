"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instantQuery = void 0;
const prometheus_query_1 = require("prometheus-query");
const prometheusClient = new prometheus_query_1.PrometheusDriver({
    endpoint: process.env.PROMETHEUS_URL || 'http://localhost:9094',
});
const instantQuery = async (query) => {
    try {
        const result = await prometheusClient.instantQuery(query);
        return result;
    }
    catch (error) {
        console.error(`Error executing Prometheus query: ${query}`, error);
        throw new Error('Failed to fetch data from Prometheus');
    }
};
exports.instantQuery = instantQuery;
exports.default = prometheusClient;
//# sourceMappingURL=prometheusClient.js.map