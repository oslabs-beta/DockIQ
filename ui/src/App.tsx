import { ThemeProvider, CssBaseline } from '@mui/material';
import DockIQ from './components/index';
import { darkTheme } from './darkTheme';
import React from 'react';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <DockIQ />
    </ThemeProvider>
  );
};

export default App;
