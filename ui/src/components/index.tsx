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
} from '@mui/material';

interface Container {
  name: string;
  status: string;
  warning: boolean;
  memUsage: string;
  memPercent: string;
  cpuPercent: string;
  netIO: string;
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

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3003/api/metrics-stream');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.metrics) {
        const transformedContainers = transformMetricsToContainers(
          data.metrics
        );
        setContainers(transformedContainers);

        // Update the count of different container statuses
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

    return () => {
      socket.close();
    };
  }, []);

  const transformMetricsToContainers = (metrics: string): Container[] => {
    const lines = metrics.split('\n');
    const containerMetrics: Record<string, Partial<Container>> = {};

    lines.forEach((line) => {
      const match = line.match(/container="([^"]+)"/);
      if (!match) return;

      const containerName = match[1];
      const valueMatch = line.match(/ ([0-9.]+)$/);
      const value = valueMatch ? parseFloat(valueMatch[1]) : 0;

      if (line.includes('container_cpu_usage')) {
        containerMetrics[containerName] = {
          ...containerMetrics[containerName],
          name: containerName,
          cpuPercent: `${value.toFixed(2)}%`,
        };
      } else if (line.includes('container_memory_usage')) {
        containerMetrics[containerName] = {
          ...containerMetrics[containerName],
          memUsage: `${(value / 1024 / 1024).toFixed(2)} MB`,
          memPercent: `${((value / 1024 / 1024 / 1000) * 100).toFixed(2)}%`,
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
      } else if (line.includes('container_pids')) {
        containerMetrics[containerName] = {
          ...containerMetrics[containerName],
          pids: `${value}`,
        };
      }
    });

    return Object.values(containerMetrics).map((container) => ({
      name: container.name || '--',
      status: 'running',
      warning: false,
      memUsage: container.memUsage || '--',
      memPercent: container.memPercent || '--',
      cpuPercent: container.cpuPercent || '--',
      netIO: container.netIO || '--',
      pids: container.pids || '--',
    }));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 4 }}>
      <Typography
        variant='h4'
        component='h1'
        sx={{ color: 'primary.main', fontWeight: 600, mb: 4 }}
      >
        DockIQ
      </Typography>

      {/* Status Cards (Running, Stopped, Unhealthy, Restarting) */}
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
            <Typography
              variant='h5'
              sx={{ color: status.color, fontWeight: 600 }}
            >
              {status.count}
            </Typography>
            <Typography variant='h6' sx={{ color: status.color }}>
              {status.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Tabs for Table View and Chart View */}
      <Tabs
        value={tabValue}
        onChange={(event, newValue) => setTabValue(newValue)}
        sx={{ mb: 2, borderBottom: '1px solid rgba(255,255,255,0.2)' }}
      >
        <Tab label='Table View' />
        <Tab label='Chart View' />
      </Tabs>

      {/* Table View */}
      {tabValue === 0 && (
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
                <TableCell>PIDS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {containers.map((container, index) => (
                <TableRow hover key={index}>
                  <TableCell>{container.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={container.status}
                      size='small'
                      sx={{
                        bgcolor:
                          container.status === 'running'
                            ? 'rgba(46, 125, 50, 0.2)'
                            : 'rgba(158, 158, 158, 0.2)',
                        color:
                          container.status === 'running'
                            ? '#66bb6a'
                            : '#9e9e9e',
                      }}
                    />
                  </TableCell>
                  <TableCell>{container.cpuPercent || '--'}</TableCell>
                  <TableCell>{container.memPercent || '--'}</TableCell>
                  <TableCell>{container.memUsage}</TableCell>
                  <TableCell>{container.netIO}</TableCell>
                  <TableCell>{container.pids}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Chart View */}
      {tabValue === 1 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <iframe
            src='http://localhost:3006/public-dashboards/08aded82fd6b49e09b2b4a4086cc0406'
            width='100%'
            height='500px'
            title='Grafana Dashboard'
          />
        </Box>
      )}
    </Box>
  );
};

export default DockIQ;
