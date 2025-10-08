import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Link,
  Stack,
  Divider,
  Button,
  CircularProgress,
  CssBaseline,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

import logoCeramiga from '../../img/logo-ceramica-coboce.png';

// --- Mockup de Login con Material UI ---
// - Diseño moderno, glassmorphism, gradiente de fondo, modo claro/oscuro
// - Validación básica en cliente y estados de carga/errores
// - Botón de Google solo UI (listo para integrar OAuth)
// - Fácil de tematizar: cambia los colores del theme (ej. primary.main)

export default function MuiLoginMockup() {
  const [mode, setMode] = useState('dark');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: mode === 'dark' ? '#22d3ee' : '#0ea5e9' }, // cyan/sky
          secondary: { main: '#22c55e' }, // emerald
          background: {
            default: mode === 'dark' ? '#0b0f19' : '#eef2f7',
            paper:
              mode === 'dark' ? 'rgba(17,24,39,0.8)' : 'rgba(255,255,255,0.85)',
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
      alert(
        `✅ Login simulado para ${username} (remember=${remember}). Integra tu API /auth/login.`
      );
    }, 900);
  }

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
          p: 3,
          background: `radial-gradient(1200px 600px at 10% 10%, ${
            mode === 'dark' ? '#0b7285' : '#93c5fd'
          }33, transparent 60%), radial-gradient(800px 400px at 90% 80%, ${
            mode === 'dark' ? '#22c55e' : '#06b6d4'
          }22, transparent 60%), linear-gradient(135deg, ${
            mode === 'dark' ? '#0b0f19' : '#eef2f7'
          }, ${mode === 'dark' ? '#0f172a' : '#f8fafc'})`,
        }}
      >
        {/* Toggle de tema */}
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

        <Paper elevation={8} sx={{ width: 420, maxWidth: '100%', p: 4 }}>
          {/* Logo minimal */}
          <Stack spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: 4,
                overflow: 'hidden',
              }}
            >
              <img src={logoCeramiga} alt="Logo" />
            </Box>
            <Typography variant="h5" fontWeight={800} textAlign="center">
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

        {/* Pie de página */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="caption"
            color="common.white"
            sx={{ opacity: 0.8 }}
          >
            © {new Date().getFullYear()} MiEmpresa — Seguridad y Sencillez
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
