import { Gauge, Registry } from 'prom-client';

// Create Prometheus gauges to measure CPU, Memory, Network, and Processes
const cpuGauge = new Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage in percentage',
  labelNames: ['container'],
});

const memoryGauge = new Gauge({
  name: 'memory_usage_percent',
  help: 'Memory usage in percentage',
  labelNames: ['container'],
});

const networkInGauge = new Gauge({
  name: 'network_in_bytes',
  help: 'Network in bytes',
  labelNames: ['container'],
});

const networkOutGauge = new Gauge({
  name: 'network_out_bytes',
  help: 'Network out bytes',
  labelNames: ['container'],
});

const pidsGauge = new Gauge({
  name: 'pids',
  help: 'Number of processes',
  labelNames: ['container'],
});

// Register all metrics
const register = new Registry();
register.registerMetric(cpuGauge);
register.registerMetric(memoryGauge);
register.registerMetric(networkInGauge);
register.registerMetric(networkOutGauge);
register.registerMetric(pidsGauge);

// Export the metrics and the registry
export { register, cpuGauge, memoryGauge, networkInGauge, networkOutGauge, pidsGauge };
