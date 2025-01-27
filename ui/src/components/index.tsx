import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface Container {
  name: string;
  status: string;
  warning: boolean;
  memUsage: string;
  memPercent: string;
  cpuPercent: string;
  netIO: string;
  blockIO: string;
  pids: string;
}

const DockIQ: React.FC = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [statusCounts, setStatusCounts] = useState({
    running: 0,
    stopped: 0,
    unhealthy: 0,
    restarting: 0,
  });
  const [tabValue, setTabValue] = useState<number>(0);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3003/api/metrics-stream');

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.metrics) {
        const transformedContainers = transformMetricsToContainers(
          data.metrics
        );
        setContainers(transformedContainers);

        // Update status counts based on container states
        const counts = {
          running: transformedContainers.filter((c) => c.status === 'running')
            .length,
          stopped: transformedContainers.filter((c) => c.status === 'stopped')
            .length,
          unhealthy: transformedContainers.filter(
            (c) => c.status === 'unhealthy'
          ).length,
          restarting: transformedContainers.filter(
            (c) => c.status === 'restarting'
          ).length,
        };
        setStatusCounts(counts);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      socket.close();
    };
  }, []);

  // Helper function to transform Prometheus metrics into container objects
  const transformMetricsToContainers = (metrics: string): Container[] => {
    const lines = metrics.split('\n');
    const containerMetrics: Record<string, Partial<Container>> = {};

    lines.forEach((line) => {
      const match = line.match(/container="([^"]+)"/); // Extract container name
      if (!match) return; // Skip lines without a container label

      const containerName = match[1];
      const valueMatch = line.match(/ ([0-9.]+)$/); // Extract metric value
      const value = valueMatch ? parseFloat(valueMatch[1]) : 0;

      if (line.includes('container_cpu_usage')) {
        containerMetrics[containerName] = {
          ...containerMetrics[containerName],
          name: containerName,
          cpuPercent: `${value.toFixed(2)}%`, // Format as percentage
        };
      } else if (line.includes('container_memory_usage')) {
        containerMetrics[containerName] = {
          ...containerMetrics[containerName],
          memUsage: `${(value / 1024 / 1024).toFixed(2)} MB`, // Convert to MB
          memPercent: `${((value / 1024 / 1024 / 1000) * 100).toFixed(2)}%`, // Scale for memory
        };
      } else if (line.includes('container_network_rx_bytes')) {
        containerMetrics[containerName] = {
          ...containerMetrics[containerName],
          netIO: `${Math.round(value / 1024)} KB / --`,
        };
      } else if (line.includes('container_network_tx_bytes')) {
        containerMetrics[containerName] = {
          ...containerMetrics[containerName],
          netIO: `${
            containerMetrics[containerName].netIO || '--'
          } / ${Math.round(value / 1024)} KB`,
        };
      } else if (line.includes('container_block_read_bytes')) {
        containerMetrics[containerName] = {
          ...containerMetrics[containerName],
          blockIO: `${Math.round(value / 1024)} KB / --`,
        };
      } else if (line.includes('container_block_write_bytes')) {
        containerMetrics[containerName] = {
          ...containerMetrics[containerName],
          blockIO: `${
            containerMetrics[containerName].blockIO || '--'
          } / ${Math.round(value / 1024)} KB`,
        };
      } else if (line.includes('container_pids')) {
        containerMetrics[containerName] = {
          ...containerMetrics[containerName],
          pids: `${value}`,
        };
      }
    });

    return Object.values(containerMetrics).map((container) => ({
      name: container.name || '--',
      status: 'running', // Placeholder for now
      warning: false, // Placeholder for now
      memUsage: container.memUsage || '--',
      memPercent: container.memPercent || '--',
      cpuPercent: container.cpuPercent || '--',
      netIO: container.netIO || '--',
      blockIO: container.blockIO || '--',
      pids: container.pids || '--',
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 4,
      }}
    >
      {/* Header */}
      <Typography
        variant='h4'
        component='h1'
        sx={{
          color: 'primary.main',
          fontWeight: 600,
          mb: 4,
        }}
      >
        DockIQ
      </Typography>

      {/* Status Cards */}
      <Box
        sx={{
          display: 'flex',
          gap: 4,
          mb: 4,
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        {[
          {
            label: 'Running',
            count: statusCounts.running,
            color: 'primary.main',
            bgColor: 'rgba(25, 118, 210, 0.08)',
          },
          {
            label: 'Stopped',
            count: statusCounts.stopped,
            color: 'grey.500',
            bgColor: 'rgba(158, 158, 158, 0.08)',
          },
          {
            label: 'Unhealthy',
            count: statusCounts.unhealthy,
            color: 'error.main',
            bgColor: 'rgba(211, 47, 47, 0.08)',
          },
          {
            label: 'Restarting',
            count: statusCounts.restarting,
            color: 'warning.main',
            bgColor: 'rgba(255, 167, 38, 0.08)',
          },
        ].map((status, index) => (
          <Paper
            key={index}
            sx={{
              p: 3,
              height: 120,
              bgcolor: status.bgColor,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flex: 1,
            }}
          >
            <Box
              sx={{
                bgcolor: status.color,
                p: 1,
                borderRadius: 1,
                opacity: 0.8,
              }}
            >
              <Typography variant='h5'>{status.count}</Typography>
            </Box>
            <Box>
              <Typography variant='h6' sx={{ color: status.color }}>
                {status.label}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>NAME</TableCell>
              <TableCell>STATUS</TableCell>
              <TableCell>CPU %</TableCell>
              <TableCell>MEM %</TableCell>
              <TableCell>MEM USAGE</TableCell>
              <TableCell>NET I/O</TableCell>
              <TableCell>BLOCK I/O</TableCell>
              <TableCell>PIDS</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {containers.map((container, index) => (
              <React.Fragment key={index}>
                <TableRow hover>
                  <TableCell>{container.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={container.status}
                      size='small'
                      sx={{
                        bgcolor:
                          container.status === 'running'
                            ? 'rgba(46, 125, 50, 0.2)'
                            : container.status === 'unhealthy'
                            ? 'rgba(211, 47, 47, 0.2)'
                            : container.status === 'restarting'
                            ? 'rgba(255, 167, 38, 0.2)'
                            : 'rgba(158, 158, 158, 0.2)',
                        color:
                          container.status === 'running'
                            ? '#66bb6a'
                            : container.status === 'unhealthy'
                            ? '#f44336'
                            : container.status === 'restarting'
                            ? '#ffa726'
                            : '#9e9e9e',
                      }}
                    />
                  </TableCell>
                  <TableCell>{container.cpuPercent || '--'}</TableCell>
                  <TableCell>{container.memPercent || '--'}</TableCell>
                  <TableCell>{container.memUsage}</TableCell>
                  <TableCell>{container.netIO}</TableCell>
                  <TableCell>{container.blockIO}</TableCell>
                  <TableCell>{container.pids}</TableCell>
                  <TableCell>
                    <IconButton
                      size='small'
                      onClick={() =>
                        setExpandedRows((prev) => ({
                          ...prev,
                          [index]: !prev[index],
                        }))
                      }
                      sx={{
                        transform: expandedRows[index]
                          ? 'rotate(180deg)'
                          : 'none',
                        transition: 'transform 0.2s',
                      }}
                    >
                      <KeyboardArrowDownIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
                {expandedRows[index] && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Box sx={{ p: 2 }}>
                        <Typography variant='h6' gutterBottom>
                          Expanded content for {container.name}
                        </Typography>
                        <iframe
                          src={`http://localhost:3006/d/ceavpt5ifcc8wf/cpu-usage-display?orgId=1&var-container=${container.name}&panelId=1&fullscreen&kiosk`}
                          title={`Grafana Dashboard for ${container.name}`}
                          style={{
                            width: '100%',
                            height: '400px',
                            border: 'none',
                          }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DockIQ;
