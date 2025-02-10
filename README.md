# DockIQ

DockIQ is a real-time container monitoring tool that provides insights into CPU, memory, network, and block I/O usage of Docker containers using Prometheus and WebSockets. It enables developers and system administrators to track container performance, detect anomalies, and optimize resource utilization.

## 🚀 Features
- **Real-time container metrics monitoring** with 500ms refresh rate
- **Live status tracking** with color-coded indicators:
  - Running (green)
  - Stopped (grey)
  - Unhealthy (red)
  - Restarting (orange)
- **Comprehensive metrics collection**:
  - CPU usage percentage
  - Memory usage (MB and percentage)
  - Network I/O (KB TX/RX)
  - Block I/O (KB Read/Write)
  - Active process count (PIDs)
- **Integration with Prometheus** for metrics collection and storage
- **Grafana dashboard embedding** for advanced visualization
- **Interactive UI** with Material UI components and expandable container rows
- **Docker container orchestration** with Docker Compose
- **REST API & WebSocket support** for easy data retrieval
- **Extensible architecture** to support future enhancements

## 🛠 Tech Stack
- **Frontend**: React, TypeScript, Material UI
- **Backend**: Node.js, Express, Prometheus client library
- **Data Collection**: Docker API, Prometheus
- **Containerization**: Docker, Docker Compose
- **Visualization**: Grafana

## 📂 Project Structure
```
📦 DockIQ
 ┣ 📂 backend
 ┃ ┣ 📜 containerMetrics.ts (Docker metrics collection)
 ┃ ┣ 📜 metrics.ts (Advanced PromQL queries)
 ┃ ┣ 📜 server.ts (Express server setup)
 ┣ 📂 ui
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📜 components (React UI components)
 ┃ ┃ ┣ 📜 services (API calls and WebSocket logic)
 ┃ ┃ ┣ 📜 App.tsx (Main React app)
 ┃ ┃ ┣ 📜 index.tsx (React entry point)
 ┃ ┣ 📜 package.json (Frontend dependencies)
 ┣ 📂 prometheus
 ┃ ┣ 📜 prometheus.yml (Prometheus configuration)
 ┃ ┣ 📜 Dockerfile (Prometheus setup)
 ┣ 📜 Dockerfile (Main container setup)
 ┣ 📜 docker-compose.yaml (Container orchestration)
 ┣ 📜 .env (Environment variables)
 ┣ 📜 .gitignore (Git ignore file)
 ┣ 📜 Makefile (Build automation)
 ┣ 📜 README.md (Project documentation)
```

## 📦 Installation & Setup
### Prerequisites
- Docker & Docker Compose installed
- Node.js & npm installed

### Setup Steps
1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/DockIQ.git
   cd DockIQ
   ```
2. **Configure environment variables:**
   ```sh
   cp .env.example .env
   ```
3. **Install dependencies:**
   ```sh
   cd ui && npm install
   cd ../backend && npm install
   ```
4. **Start the application:**
   ```sh
   docker-compose up --build
   ```

## 🎮 Usage Guide
### Accessing the UI
- Open `http://localhost:3000` in your browser to monitor container metrics
- Live container status is displayed in the dashboard
- Click on a container to view detailed metrics and performance trends
- Grafana dashboard for visualization is accessible at `http://localhost:3006`

### API Endpoints
- `GET /api/metrics` - Fetches latest container metrics
- `GET /api/metrics/advanced` - Executes PromQL queries for advanced insights
- `ws://localhost:3003/api/metrics-stream` - WebSocket connection for real-time updates

## 🛠 Troubleshooting
- **Containers are not showing up?**
  - Ensure Docker is running
  - Check the `.env` file and verify Prometheus configuration
  - Run `docker logs <container-name>` to check logs
- **WebSocket connection issues?**
  - Ensure backend is running on the correct port (`3003`)
  - Verify that the frontend WebSocket endpoint is correctly set

## 🔥 Future Improvements
- **Container health monitoring alerts** (email/slack notifications)
- **User authentication & role-based access** for multi-user support
- **Multi-cluster monitoring** to support Kubernetes deployments
- **Exportable reports** for historical performance analysis
- **Advanced analytics & anomaly detection** using AI/ML

## 👥 Contributors
- WIP

## 📜 License
This project is licensed under the MIT License.

---
Feel free to contribute and enhance DockIQ! 🚀
