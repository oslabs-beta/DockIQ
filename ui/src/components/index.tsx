import React from 'react';
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
  const containers: Container[] = [
    {
      name: 'container-name',
      status: 'Running',
      warning: true,
      memUsage: '--',
      memLimit: '--',
      netIO: '--',
      blockIO: '--',
      pids: '--',
    },
    {
      name: 'container-name',
      status: 'Running',
      warning: true,
      memUsage: '--',
      memLimit: '--',
      netIO: '--',
      blockIO: '--',
      pids: '--',
    },
  ];

  const [tabValue, setTabValue] = React.useState<number>(0);

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
              0
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
              0
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
              0
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
              0
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
              <TableCell>CPU %</TableCell>
              <TableCell>MEM %</TableCell>
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
                    label='Running'
                    size='small'
                    sx={{
                      bgcolor: 'rgba(46, 125, 50, 0.2)', // MUI's success background
                      color: '#66bb6a', // MUI's success text
                      fontWeight: 500,
                      fontSize: '0.75rem',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label='Warning'
                    size='small'
                    sx={{
                      bgcolor: 'rgba(237, 108, 2, 0.2)', // MUI's warning background
                      color: '#ff9800', // MUI's warning text
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
