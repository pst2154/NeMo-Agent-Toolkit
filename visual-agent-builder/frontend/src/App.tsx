import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  CssBaseline,
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  alpha,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CloudUpload as CloudUploadIcon,
  ArrowForward as ArrowForwardIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import VisualBuilder from './pages/VisualBuilder';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#76b900', // NVIDIA green
      light: '#9cd326',
      dark: '#5a8c00',
    },
    secondary: {
      main: '#1a1a1a', // NVIDIA black
      light: '#333333',
      dark: '#000000',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'welcome' | 'builder'>('welcome');

  if (currentView === 'builder') {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <VisualBuilder />
      </ThemeProvider>
    );
  }

  const features = [
    {
      icon: <AutoAwesomeIcon fontSize="large" />,
      title: 'Drag & Drop Interface',
      description: 'Build complex AI workflows visually without writing code',
    },
    {
      icon: <SpeedIcon fontSize="large" />,
      title: 'Rapid Prototyping',
      description: 'Test and iterate on your agent workflows in real-time',
    },
    {
      icon: <SecurityIcon fontSize="large" />,
      title: 'Enterprise Ready',
      description: 'Built on NVIDIA NeMo Agent toolkit with production-grade reliability',
    },
    {
      icon: <CloudUploadIcon fontSize="large" />,
      title: 'Easy Deployment',
      description: 'Export to YAML and deploy to any NeMo Agent toolkit environment',
    },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(
            theme.palette.primary.light,
            0.1
          )} 100%)`,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ py: 8 }}>
            {/* Hero Section */}
            <Paper
              elevation={0}
              sx={{
                p: 6,
                mb: 6,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Chip
                  label="NVIDIA NeMo Agent Toolkit"
                  sx={{
                    mb: 2,
                    backgroundColor: alpha('#fff', 0.2),
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
                <Typography variant="h3" component="h1" gutterBottom>
                  Visual Agent Builder
                </Typography>
                <Typography variant="h5" component="h2" gutterBottom sx={{ opacity: 0.95, fontWeight: 400 }}>
                  Build AI Agent Workflows Visually
                </Typography>
                <Typography variant="body1" paragraph sx={{ mt: 2, opacity: 0.9, maxWidth: 600 }}>
                  Create powerful AI agent workflows using an intuitive drag-and-drop interface. No coding
                  required. Powered by NVIDIA NeMo Agent toolkit.
                </Typography>

                <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => setCurrentView('builder')}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      backgroundColor: 'white',
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha('#fff', 0.9),
                      },
                    }}
                  >
                    Launch Builder
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    href="http://localhost:8000/docs"
                    target="_blank"
                    endIcon={<CodeIcon />}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: alpha('#fff', 0.1),
                      },
                    }}
                  >
                    API Documentation
                  </Button>
                </Box>
              </Box>
            </Paper>

            {/* Features Grid */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.3s',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          mb: 2,
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* System Status */}
            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#4caf50',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    },
                  }}
                />
                System Status
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Backend API
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                      ✓ Running
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      localhost:8000
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Frontend
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                      ✓ Active
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      localhost:3000
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Database
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                      ✓ Connected
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      SQLite
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Components
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                      ✓ 16 Available
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ready to use
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
