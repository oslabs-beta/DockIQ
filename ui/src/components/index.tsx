import React, { useState, useEffect } from "react";
import "./styles.css"; // Add this for refresh animation
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface Container {
  name: string;
  status: string;
  warning: boolean;
  memUsage: string;
  memLimit: string;
  netIO: string;
  blockIO: string;
  pids: string;
}

interface Metrics {
  cpuUsage: string;
  memoryUsage: string;
}

const DockIQ: React.FC = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [statusCounts, setStatusCounts] = useState({
    running: 0,
    stopped: 0,
    unhealthy: 0,
    restarting: 0,
  });
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false); // Added for refresh animation

  // Fetch container stats from the backend
  const fetchContainerStats = async () => {
    try {
      const response = await fetch("http://localhost:3007/api/container-stats");
      const data = await response.json();

      // Parse the backend response
      const containerData: Container[] = data.containers || [];
      setContainers(containerData);

      // Update status counts
      const counts = containerData.reduce(
        (acc, container) => {
          if (container.status === "running") acc.running++;
          else if (container.status === "exited") acc.stopped++;
          else if (container.status === "unhealthy") acc.unhealthy++;
          else if (container.status === "restarting") acc.restarting++;
          return acc;
        },
        { running: 0, stopped: 0, unhealthy: 0, restarting: 0 }
      );

      setStatusCounts(counts);
    } catch (error) {
      console.error("Error fetching container stats:", error);
    }
  };

  // Fetch Prometheus metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch(
        "http://localhost:3007/api/metrics/advanced"
      );
      const data = await response.json();

      // Assuming `data` contains `cpuUsage` and `memoryUsage`
      setMetrics({
        cpuUsage: `${data.data.cpuUsage} cores`,
        memoryUsage: `${data.data.memoryUsage} MB`,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  const fetchData = async () => {
    setIsRefreshing(true); // Start refresh animation
    try {
      await fetchContainerStats();
      await fetchMetrics();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000); // Ensure animation completes
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        p: 4,
      }}
    >
      {/* Header */}
      <Typography
        variant="h4"
        component="h1"
        sx={{
          color: "primary.main",
          fontWeight: 600,
          mb: 4,
        }}
      >
        DockIQ
      </Typography>

      {/* Metrics */}
      {metrics && (
        <Box
          sx={{
            display: "flex",
            gap: 4,
            mb: 4,
          }}
        >
          <Paper
            sx={{
              p: 3,
              bgcolor: "rgba(25, 118, 210, 0.08)",
              flex: 1,
            }}
          >
            <Typography variant="h6" sx={{ color: "primary.main" }}>
              CPU Usage
            </Typography>
            <Typography variant="h5">{metrics.cpuUsage}</Typography>
          </Paper>
          <Paper
            sx={{
              p: 3,
              bgcolor: "rgba(255, 167, 38, 0.08)",
              flex: 1,
            }}
          >
            <Typography variant="h6" sx={{ color: "warning.main" }}>
              Memory Usage
            </Typography>
            <Typography variant="h5">{metrics.memoryUsage}</Typography>
          </Paper>
        </Box>
      )}

      {/* Status Cards */}
      <Box
        sx={{
          display: "flex",
          gap: 4,
          mb: 4,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        {["running", "stopped", "unhealthy", "restarting"].map(
          (status, index) => (
            <Paper
              key={index}
              sx={{
                p: 3,
                height: 120,
                bgcolor: `rgba(${
                  status === "running"
                    ? "25, 118, 210"
                    : status === "stopped"
                    ? "158, 158, 158"
                    : status === "unhealthy"
                    ? "211, 47, 47"
                    : "255, 167, 38"
                }, 0.08)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
              }}
            >
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    color: `${
                      status === "running"
                        ? "primary.main"
                        : status === "stopped"
                        ? "grey.500"
                        : status === "unhealthy"
                        ? "error.main"
                        : "warning.main"
                    }`,
                  }}
                >
                  {statusCounts[status as keyof typeof statusCounts]}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: `${
                      status === "running"
                        ? "primary.main"
                        : status === "stopped"
                        ? "grey.500"
                        : status === "unhealthy"
                        ? "error.main"
                        : "warning.main"
                    }`,
                  }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Typography>
              </Box>
            </Paper>
          )
        )}
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          bgcolor: "background.paper",
          "& .MuiTableCell-root": {
            borderColor: "rgba(255, 255, 255, 0.12)",
          },
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Memory Usage/Limit</TableCell>
              <TableCell>Net I/O</TableCell>
              <TableCell>Block I/O</TableCell>
              <TableCell>PIDs</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {containers.map((container, index) => (
              <TableRow key={index}>
                <TableCell>{container.name}</TableCell>
                <TableCell>
                  <Chip label={container.status} size="small" />
                </TableCell>
                <TableCell>{`${container.memUsage} / ${container.memLimit}`}</TableCell>
                <TableCell>{container.netIO}</TableCell>
                <TableCell>{container.blockIO}</TableCell>
                <TableCell>{container.pids}</TableCell>
                <TableCell>
                  <IconButton size="small">
                    <KeyboardArrowDownIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Refresh Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <Button
          startIcon={
            <RefreshIcon className={isRefreshing ? "animate-spin" : ""} />
          }
          onClick={fetchData}
          sx={{
            color: "text.secondary",
            textTransform: "none",
            "&:hover": {
              bgcolor: "transparent",
              color: "text.primary",
            },
          }}
        >
          Refresh
        </Button>
      </Box>
    </Box>
  );
};

export default DockIQ;
