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
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

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

const DockIQ: React.FC = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [statusCounts, setStatusCounts] = useState({
    running: 0,
    stopped: 0,
    unhealthy: 0,
    restarting: 0,
  });
  const [tabValue, setTabValue] = useState<number>(0);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const socket = new WebSocket(
      'ws://localhost:3003/api/container-stats-stream'
    );

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Parse the backend response
      const containerData: Container[] = data.containers || [];
      setContainers(containerData);

      // Update status counts
      const counts = {
        running: data.stats.running || 0,
        stopped: data.stats.stopped || 0,
        unhealthy: data.stats.unhealthy || 0,
        restarting: data.stats.restarting || 0,
      };
      setStatusCounts(counts);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Cleanup WebSocket connection when the component unmounts
    return () => {
      socket.close();
    };
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          TabIndicatorProps={{
            style: {
              display: 'none',
            },
          }}
          textColor='inherit'
        >
          <Tab
            label='Stats'
            sx={{
              textTransform: 'none',
              '&.Mui-selected': { color: 'text.primary' },
            }}
          />
          <Tab
            label='Logs'
            sx={{
              textTransform: 'none',
              '&.Mui-selected': { color: 'text.primary' },
            }}
          />
          <Tab
            label='Alerts'
            sx={{
              textTransform: 'none',
              '&.Mui-selected': { color: 'text.primary' },
            }}
          />
        </Tabs>
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          bgcolor: 'background.paper',
          '& .MuiTableCell-root': {
            borderColor: 'rgba(255, 255, 255, 0.12)',
          },
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>NAME</TableCell>
              <TableCell>STATUS</TableCell>
              <TableCell>MEM USAGE/LIMIT</TableCell>
              <TableCell>NET I/O</TableCell>
              <TableCell>BLOCK I/O</TableCell>
              <TableCell>PIDS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {containers.map((container, index) => (
              <TableRow
                key={index}
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
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
                      fontWeight: 500,
                      fontSize: '0.75rem',
                    }}
                  />
                </TableCell>
                <TableCell>{container.memUsage}</TableCell>
                <TableCell>{container.netIO}</TableCell>
                <TableCell>{container.blockIO}</TableCell>
                <TableCell>{container.pids}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DockIQ;
