# Use Prometheus base image
FROM prom/prometheus:latest

# Add the Prometheus configuration file to the correct location in the container
COPY prometheus.yml /etc/prometheus/prometheus.yml

# Expose the default Prometheus port
EXPOSE 9090

