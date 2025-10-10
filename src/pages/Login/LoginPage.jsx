import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  CircularProgress,
  CssBaseline,
  Stack,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

// Coloca tu ruta real al logo
import logoCeramiga from '../../img/logo-ceramica-coboce.png';

// --- Login con MUI ---
// Limpieza de imports, imagen optimizada, y fondo con degradé verde para combinar con el logo.
// Se mantiene el resto del esquema de color casi igual (solo cambia el background).

export default function MuiLoginMockup() {
  const [mode, setMode] = useState('light');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          // Conservamos primary/secondary para no "cambiar colores" del login
          primary: { main: '#006633', contrastText: '#FFFFFF' },
          secondary: { main: '#22c55e' }, // emerald
          background: {
            default: mode === 'dark' ? '#0b0f19' : '#eef2f7',
            paper:
              mode === 'dark' ? 'rgba(17,24,39,0.8)' : 'rgba(255,255,255,0.9)',
          },
        },
        shape: { borderRadius: 16 },
        typography: {
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system',
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backdropFilter: 'blur(12px)',
                border:
                  mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(0,0,0,0.06)',
              },
            },
          },
        },
      }),
    [mode]
  );

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const isValidUser = /^[a-zA-Z0-9._-]{3,32}$/.test(username);
      if (!username || !password) {
        setError('Completa usuario y contraseña.');
        setLoading(false);
        return;
      }
      if (!isValidUser || password.length < 6) {
        setError(
          'El usuario debe tener 3–32 caracteres (letras, números, ., _, -) y la contraseña 6+.'
        );
        setLoading(false);
        return;
      }
      setLoading(false);
      alert(`✅ Login simulado para ${username}. Integra tu API /auth/login.`);
    }, 900);
  }

  // Colores verdes del fondo (degradé) para combinar con el logo
  const bg = {
    dark: `radial-gradient(1200px 600px at 10% 10%, #00663333, transparent 60%),
           radial-gradient(800px 400px at 90% 80%, #1A7F4B22, transparent 60%),
           linear-gradient(135deg, #0a1f16, #0f2d20)`,
    light: `radial-gradient(1200px 600px at 10% 10%, #1A7F4B33, transparent 60%),
            radial-gradient(800px 400px at 90% 80%, #4CAF5022, transparent 60%),
            linear-gradient(135deg, #e8f5ec, #f3faf6)`,
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100dvh',
          position: 'relative',
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
          p: { xs: 2, sm: 3 },
          background: mode === 'dark' ? bg.dark : bg.light,
        }}
      >
        {/* Toggle de tema (opcional) */}
        <IconButton
          onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            bgcolor: 'background.paper',
            boxShadow: 3,
            '&:hover': { opacity: 0.9 },
          }}
          aria-label="Alternar tema"
        >
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

        <Paper
          elevation={8}
          sx={{
            width: { xs: '100%', sm: 420, md: 480 },
            maxWidth: '100%',
            p: { xs: 3, sm: 4 },
            mx: { xs: 2, sm: 0 },
          }}
        >
          {/* Logo optimizado */}
          <Stack spacing={1.2} alignItems="center" sx={{ mb: 3 }}>
            <Box
              component="img"
              src={logoCeramiga}
              alt="Cerámica COBOCE"
              decoding="async"
              loading="eager"
              sx={{
                height: { xs: 44, sm: 56, md: 64 },
                width: 'auto',
                maxWidth: '100%',
                display: 'block',
                objectFit: 'contain',
                filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))',
                borderRadius: 0,
              }}
            />
            <Typography
              variant="h5"
              fontWeight={800}
              textAlign="center"
              sx={{ fontSize: { xs: 22, sm: 24 } }}
            >
              Bienvenido
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Inicia sesión para continuar
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.2}>
              <TextField
                label="Usuario"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircleIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Contraseña"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPwd((v) => !v)}
                        edge="end"
                        aria-label="mostrar contraseña"
                      >
                        {showPwd ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {error && (
                <Box
                  role="alert"
                  sx={{
                    borderRadius: 2,
                    p: 1.2,
                    px: 1.6,
                    bgcolor: mode === 'dark' ? '#fee2e2' : '#fff1f2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                    fontSize: 14,
                  }}
                >
                  {error}
                </Box>
              )}

              <Button
                type="submit"
                size="large"
                variant="contained"
                disableElevation
                disabled={loading}
                sx={{ py: 1.2, fontWeight: 700, letterSpacing: 0.2 }}
              >
                {loading ? (
                  <Stack direction="row" gap={1} alignItems="center">
                    <CircularProgress size={20} thickness={5} />
                    Verificando...
                  </Stack>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
