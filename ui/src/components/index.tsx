import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
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

  // Fetch data from the backend
  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/container-stats');
      const data = await response.json();

      // Parse the backend response
      const containerData: Container[] = data.containers || [];
      setContainers(containerData);

      // Update status counts
      const counts = containerData.reduce(
        (acc, container) => {
          if (container.status === 'running') acc.running++;
          else if (container.status === 'exited') acc.stopped++;
          else if (container.status === 'unhealthy') acc.unhealthy++;
          else if (container.status === 'restarting') acc.restarting++;
          return acc;
        },
        { running: 0, stopped: 0, unhealthy: 0, restarting: 0 }
      );

      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching container data:', error);
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
        <Paper
          sx={{
            p: 3,
            height: 120,
            bgcolor: 'rgba(25, 118, 210, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flex: 1,
          }}
        >
          <Box
            sx={{
              bgcolor: 'primary.main',
              p: 1,
              borderRadius: 1,
              opacity: 0.8,
            }}
          >
            <Box component='span' sx={{ typography: 'h5' }}>
              {statusCounts.running}
            </Box>
          </Box>
          <Box>
            <Typography variant='h6' sx={{ color: 'primary.main' }}>
              Running
            </Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 3,
            height: 120,
            bgcolor: 'rgba(158, 158, 158, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flex: 1,
          }}
        >
          <Box
            sx={{
              bgcolor: 'grey.500',
              p: 1,
              borderRadius: 1,
              opacity: 0.8,
            }}
          >
            <Box component='span' sx={{ typography: 'h5' }}>
              {statusCounts.stopped}
            </Box>
          </Box>
          <Box>
            <Typography variant='h6' sx={{ color: 'grey.500' }}>
              Stopped
            </Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 3,
            height: 120,
            bgcolor: 'rgba(211, 47, 47, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flex: 1,
          }}
        >
          <Box
            sx={{
              bgcolor: 'error.main',
              p: 1,
              borderRadius: 1,
              opacity: 0.8,
            }}
          >
            <Box component='span' sx={{ typography: 'h5' }}>
              {statusCounts.unhealthy}
            </Box>
          </Box>
          <Box>
            <Typography variant='h6' sx={{ color: 'error.main' }}>
              Unhealthy
            </Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 3,
            height: 120,
            bgcolor: 'rgba(255, 167, 38, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flex: 1,
          }}
        >
          <Box
            sx={{
              bgcolor: 'warning.main',
              p: 1,
              borderRadius: 1,
              opacity: 0.8,
            }}
          >
            <Box component='span' sx={{ typography: 'h5' }}>
              {statusCounts.restarting}
            </Box>
          </Box>
          <Box>
            <Typography variant='h6' sx={{ color: 'warning.main' }}>
              Restarting
            </Typography>
          </Box>
        </Paper>
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
              '&.Mui-selected': {
                color: 'text.primary',
              },
            }}
          />
          <Tab
            label='Logs'
            sx={{
              textTransform: 'none',
              '&.Mui-selected': {
                color: 'text.primary',
              },
            }}
          />
          <Tab
            label='Alerts'
            sx={{
              textTransform: 'none',
              '&.Mui-selected': {
                color: 'text.primary',
              },
            }}
          />
        </Tabs>
      </Box>

      {/* Refresh Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          startIcon={<RefreshIcon />}
          sx={{
            color: 'text.secondary',
            textTransform: 'none',
            '&:hover': {
              bgcolor: 'transparent',
              color: 'text.primary',
            },
          }}
          onClick={fetchData}
        >
          Refresh
        </Button>
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
              <TableCell></TableCell>
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
                        container.status === 'Running'
                          ? 'rgba(46, 125, 50, 0.2)'
                          : container.status === 'Unhealthy'
                          ? 'rgba(211, 47, 47, 0.2)'
                          : container.status === 'Restarting'
                          ? 'rgba(255, 167, 38, 0.2)'
                          : 'rgba(158, 158, 158, 0.2)',
                      color:
                        container.status === 'Running'
                          ? '#66bb6a'
                          : container.status === 'Unhealthy'
                          ? '#f44336'
                          : container.status === 'Restarting'
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
                <TableCell>
                  <IconButton size='small' sx={{ color: 'text.secondary' }}>
                    <KeyboardArrowDownIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DockIQ;
