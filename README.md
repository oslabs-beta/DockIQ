# DockIQ
Real-time Docker container monitoring and metrics visualization! 🐳
![DockIQ Dashboard](assets/Dockiq.gif)

DockIQ provides an intuitive interface for monitoring Docker containers with real-time metrics and visualization capabilities.

## Tech Stack

### Frontend:
* React with TypeScript for robust type safety
* Material-UI (MUI) for component styling and layout
* WebSocket client for real-time data updates

### Backend:
* Node.js Express server with TypeScript
* Dockerode for Docker engine interaction
* Express-ws for WebSocket server implementation
* Prom-client for Prometheus metrics collection

### Monitoring & Visualization:
* Prometheus for time-series data storage and querying
* Grafana for advanced visualization capabilities
* Docker for containerization and orchestration

## Features

### 📊 Real-time Metrics Monitoring
DockIQ continuously tracks essential container metrics through our advanced monitoring system. The metrics tracking includes comprehensive CPU usage percentage monitoring, detailed memory utilization with both raw usage and percentage metrics, complete network I/O statistics, and current PID count for each container. All of these metrics are carefully stored in our Prometheus database with a configurable retention period to ensure you have access to historical data when you need it.

### 🔄 Live Status Updates
Our real-time monitoring system provides immediate visibility into your container ecosystem. You can instantly see which containers are currently running, which ones have stopped, any containers that might be in an unhealthy state, and those that are in the process of restarting. This comprehensive status tracking ensures you're always aware of your containers' current state.

### 📈 Beautiful Visualization
The interface has been crafted using Material-UI to provide a clean, modern experience. The main dashboard presents a status overview with cards that give you immediate insight into your container ecosystem. Below this, you'll find a detailed metrics table that provides in-depth information about each container. All of this data is updated in real-time through our WebSocket connection, ensuring you always have the latest information at your fingertips.

## How it works
DockIQ operates through a sophisticated system of four main containerized services working in harmony. The backend service, built with Node.js, serves as the primary collector of Docker metrics, making this data available through both WebSocket connections and REST APIs. This data is then stored by our Prometheus service, which maintains time-series metrics with a precise 5-second scrape interval.

The visualization layer is handled by Grafana, which provides additional analytical capabilities and graphing options. The frontend, developed in React, delivers a responsive and intuitive user interface that updates in real-time as new data becomes available.

These services communicate seamlessly over a dedicated Docker network. Prometheus actively scrapes metrics from two sources: its own instance on port 9090 and the backend service endpoint at port 3003/api/metrics. The Grafana service is exposed on port 3006, and it's important to ensure this port is available for the extension to function correctly.

## Installation & Usage

### 1. Pull the Image from Docker Hub
```bash
# Pull latest version
docker pull kimalena9/docker-extension:latest 

# For a specific version
docker pull kimalena9/docker-extension:v1.0.0  # If you tagged a version

# Verify the installation
docker images | grep docker-extension
