import { PrometheusDriver } from 'prometheus-query';

// Initialize PrometheusDriver with the Prometheus server endpoint
const prometheusClient = new PrometheusDriver({
  endpoint: process.env.PROMETHEUS_URL || 'http://localhost:9094', // Default to localhost if not specified
});

// Dynamically infer the return type of `instantQuery`
type PrometheusResponse = Awaited<ReturnType<PrometheusDriver['instantQuery']>>;

/**
 * Perform an instant Prometheus query.
 * @param query - The PromQL query string
 * @returns The Prometheus query result
 */
export const instantQuery = async (
  query: string
): Promise<PrometheusResponse> => {
  try {
    const result = await prometheusClient.instantQuery(query);
    return result;
  } catch (error) {
    console.error(`Error executing Prometheus query: ${query}`, error);
    throw new Error('Failed to fetch data from Prometheus');
  }
};

export default prometheusClient;
