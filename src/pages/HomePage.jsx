import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Chip from '@mui/material/Chip';
import { createTheme, alpha } from '@mui/material/styles';
// Icons
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import BusinessIcon from '@mui/icons-material/Business';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import MonetizationOn from '@mui/icons-material/MonetizationOn';
import SettingsIcon from '@mui/icons-material/Settings';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import TableChartIcon from '@mui/icons-material/TableChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { DemoProvider } from '@toolpad/core/internal';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Account,
  AccountPreview,
  AccountPopoverFooter,
  SignOutButton,
} from '@toolpad/core/Account';

/* ===================== THEME (colores intensos, verde corporativo) ===================== */
const makeTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: '#006633', contrastText: '#FFFFFF' },
      secondary: { main: '#6E33FF', contrastText: '#FFFFFF' },
      info: { main: '#2D6BFF', contrastText: '#FFFFFF' },
      success: { main: '#00C853', contrastText: '#FFFFFF' },
      warning: { main: '#FFAB00', contrastText: '#1B1300' },
      error: { main: '#FF3D00', contrastText: '#FFFFFF' },
      ...(mode === 'dark'
        ? {
            background: { default: '#0e1111', paper: '#111416' },
            divider: 'rgba(255,255,255,0.12)',
            text: { primary: '#EAEAEA', secondary: '#BDBDBD' },
          }
        : {
            background: { default: '#F5F7FB', paper: '#FFFFFF' },
            divider: '#E5E7EB',
            text: { primary: '#0F172A', secondary: '#475569' },
          }),
      action: {
        selectedOpacity: 0.18,
        hoverOpacity: 0.08,
        focusOpacity: 0.12,
        activatedOpacity: 0.2,
      },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily:
        "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      h6: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 700, letterSpacing: 0.2 },
    },
    custom: {
      gradients: {
        purple: 'linear-gradient(135deg, #6E33FF 0%, #4C17E2 100%)',
        blue: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
        cyan: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)',
        green: 'linear-gradient(135deg, #006633 0%, #004d29 100%)',
        orange: 'linear-gradient(135deg, #FF8F00 0%, #EF6C00 100%)',
        red: 'linear-gradient(135deg, #FF3D00 0%, #D50000 100%)',
      },
      cardShadow: '0 12px 30px rgba(3,7,18,0.12)',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: (theme) => ({
          body:
            theme.palette.mode === 'light' ? { backgroundImage: 'none' } : {},
        }),
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow:
              theme.palette.mode === 'light'
                ? '0 2px 8px rgba(2,6,23,0.06)'
                : '0 2px 8px rgba(2,6,23,0.35)',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 10,
            margin: '4px 8px',
            paddingLeft: 12,
            paddingRight: 12,
            '&.Mui-selected': {
              backgroundColor: alpha(
                theme.palette.primary.main,
                theme.palette.mode === 'light' ? 0.18 : 0.28
              ),
              '&:hover': {
                backgroundColor: alpha(
                  theme.palette.primary.main,
                  theme.palette.mode === 'light' ? 0.24 : 0.34
                ),
              },
            },
          }),
        },
      },
      MuiChip: {
        variants: [
          {
            props: { variant: 'soft' },
            style: ({ theme }) => ({
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              color: theme.palette.primary.main,
              borderRadius: 12,
              '&.MuiChip-colorInfo': {
                backgroundColor: alpha(theme.palette.info.main, 0.08),
                color: theme.palette.info.main,
              },
            }),
          },
        ],
      },
      MuiButton: {
        styleOverrides: {
          containedPrimary: { boxShadow: '0 8px 18px rgba(0,102,51,0.28)' },
          containedSecondary: { boxShadow: '0 8px 18px rgba(110,51,255,0.32)' },
        },
      },
    },
  });

/* =========================== APP SHELL =========================== */
export default function AppShell({ window }) {
  const navigate = useNavigate();
  const location = useLocation();
  const appWindow = window !== undefined ? window() : undefined;

  // modo / sesión (igual)
  const [mode, setMode] = React.useState(() => {
    const saved = localStorage.getItem('intranet_mode');
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  });
  React.useEffect(() => localStorage.setItem('intranet_mode', mode), [mode]);
  const theme = React.useMemo(() => makeTheme(mode), [mode]);

  const [session, setSession] = React.useState({
    user: { name: 'Usuario Activo', email: 'user@example.com' },
  });
  const authentication = React.useMemo(
    () => ({
      signIn: () =>
        setSession({
          user: { name: 'Usuario Activo', email: 'user@example.com' },
        }),
      signOut: () => setSession(null),
    }),
    []
  );

  // ====== Navegación con SUBMENÚS ======
  const NAVIGATION = [
    { kind: 'header', title: 'Dashboard' },
    {
      segment: 'precioUnitario',
      title: 'Precio Unitario',
      icon: <AssignmentIcon />,
    },

    { kind: 'header', title: 'Gestión Comercial' },
    {
      segment: 'ventasTotales',
      title: 'Ventas Totales',
      icon: <TableChartIcon />,
    },
    {
      title: 'Ingresos',
      icon: <DescriptionIcon />,
      children: [
        {
          segment: 'ingresoVentasTotales',
          title: 'Registro',
          icon: <TableChartIcon />,
        },
        {
          segment: 'ingresoVentasTotales/kpis',
          title: 'KPIs',
          icon: <BarChartIcon />,
        },
      ],
    },

    { kind: 'header', title: 'Personas y Sucursales' },
    { segment: 'prueba', title: 'Colaboradores', icon: <GroupIcon /> },
    { segment: 'roles', title: 'Roles y Permisos', icon: <SecurityIcon /> },
    { segment: 'sucursales', title: 'Sucursales', icon: <BusinessIcon /> },

    { kind: 'divider' },

    { kind: 'header', title: 'Documentos' },
    { segment: 'documentos', title: 'Documentos', icon: <DescriptionIcon /> },
  ];

  /* --------- Acciones del AppBar (derecha): notific., modo y perfil --------- */
  function ToolbarActions() {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleOpen = (e) => setAnchorEl(e.currentTarget);
    const handleClose = () => setAnchorEl(null);

    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ ml: 'auto' }}
      >
        <Tooltip title="Notificaciones">
          <IconButton>
            <Badge variant="dot" color="error">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Chip
          variant="soft"
          size="small"
          label={mode === 'dark' ? 'Oscuro' : 'Claro'}
          onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
          onDelete={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
          deleteIcon={mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          sx={{ mr: 0.5 }}
        />

        <Tooltip title="Cuenta">
          <IconButton onClick={handleOpen} size="small" sx={{ ml: 0.5 }}>
            <Avatar sx={{ width: 34, height: 34 }}>UA</Avatar>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <MenuItem disabled>
            <ListItemIcon>
              <AccountCircleIcon fontSize="small" />
            </ListItemIcon>
            {session?.user?.name || 'Usuario'}
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              navigate('/perfil');
              handleClose();
            }}
          >
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Perfil y preferencias
          </MenuItem>
          <MenuItem
            onClick={() => {
              navigate('/ajustes');
              handleClose();
            }}
          >
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Configuración
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              authentication.signOut();
              handleClose();
            }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Stack>
    );
  }

  return (
    <DemoProvider window={appWindow}>
      <AppProvider
        branding={{
          logo: (
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: 'primary.main',
                letterSpacing: 0.4,
              }}
            >
              Intranet
            </Typography>
          ),
          title: '',
          homeUrl: '/',
        }}
        theme={theme}
        router={{ pathname: location.pathname, navigate }}
        navigation={NAVIGATION}
        authentication={authentication}
        session={session}
      >
        <CssBaseline />
        <DashboardLayout
          slots={{
            toolbarActions: ToolbarActions,
            // CAMBIO: sidebarFooter eliminado para que no aparezca el usuario en el lateral
          }}
          slotProps={{
            // CAMBIO: estilizado del SIDEBAR para verse como la 2ª imagen
            sidebar: {
              sx: {
                p: 0,
                '& .MuiDrawer-paper': {
                  width: 268, // ancho cómodo tipo Berry
                },
                // Headers de sección
                '& .MuiListSubheader-root': {
                  fontSize: 11,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  color: 'text.secondary',
                  lineHeight: 2.2,
                },
                // Items
                '& .MuiListItemButton-root': {
                  mx: 1,
                  my: 0.5,
                  borderRadius: 2,
                  py: 0.85,
                  '& .MuiListItemIcon-root': {
                    minWidth: 36,
                    color: 'text.secondary',
                  },
                  '& .MuiTypography-root': { fontWeight: 600 },
                  '&:hover': {
                    bgcolor: (t) =>
                      alpha(
                        t.palette.primary.main,
                        t.palette.mode === 'light' ? 0.08 : 0.18
                      ),
                  },
                  '&.Mui-selected': {
                    bgcolor: (t) =>
                      alpha(
                        t.palette.secondary.main,
                        t.palette.mode === 'light' ? 0.16 : 0.24
                      ),
                    color: 'text.primary',
                    '& .MuiListItemIcon-root': { color: 'inherit' },
                    '&:hover': {
                      bgcolor: (t) =>
                        alpha(
                          t.palette.secondary.main,
                          t.palette.mode === 'light' ? 0.22 : 0.3
                        ),
                    },
                  },
                },
                // Indentación de submenus (2º nivel)
                '& .MuiCollapse-root .MuiListItemButton-root': {
                  pl: 3,
                },
              },
            },
          }}
          sx={{
            bgcolor: 'background.default',
            '& .MuiDrawer-paper': { p: 0 },
          }}
        >
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              minHeight: 'calc(100vh - 64px)',
              bgcolor: 'background.default',
            }}
          >
            <Box
              sx={{
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: { xs: 2, sm: 3 },
                boxShadow:
                  mode === 'light'
                    ? '0 1px 2px rgba(0,0,0,0.06)'
                    : '0 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              <Outlet />
            </Box>
          </Box>
        </DashboardLayout>
      </AppProvider>
    </DemoProvider>
  );
}

AppShell.propTypes = { window: PropTypes.func };
