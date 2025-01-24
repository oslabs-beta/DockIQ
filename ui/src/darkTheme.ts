import { createTheme } from '@mui/material';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9', // MUI's signature blue (this is what was on the official MUI Docs)
    },
    background: {
      default: '#0A1929', // Navy background
      paper: '#001E3C', // Darker navy for surfaces
    },
    text: {
      primary: '#fff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    divider: 'rgba(194, 224, 255, 0.08)', // MUI's custom divider color
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(194, 224, 255, 0.08)',
        },
        head: {
          fontWeight: 600,
          color: '#fff',
          backgroundColor: '#001E3C', // Darker navy for table header
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Removes default paper gradient
        },
      },
    },
  },
});
