import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, alpha } from '@mui/material/styles';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import BusinessIcon from '@mui/icons-material/Business';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import MonetizationOn from '@mui/icons-material/MonetizationOn';
import SettingsIcon from '@mui/icons-material/Settings';
import LightModeIcon from '@mui/icons-material/LightMode';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DarkModeIcon from '@mui/icons-material/DarkMode';
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

/** ===================== TEMA: claro cálido + oscuro ===================== */
const makeTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: '#006633' },
      ...(mode === 'dark'
        ? {
            background: { default: '#0e1111', paper: '#111416' },
            divider: 'rgba(255,255,255,0.12)',
            text: { primary: '#EAEAEA', secondary: '#BDBDBD' },
          }
        : {
            // Blanco cálido/crema para descansar la vista
            background: { default: '#FAF7F2', paper: '#FFFDF8' },
            divider: '#E7DED1',
            text: { primary: '#1C1B19', secondary: '#5C574D' },
          }),
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily:
        "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: (theme) => ({
          body:
            theme.palette.mode === 'light'
              ? {
                  // Patrón sutil en modo claro (puedes quitarlo si no lo quieres)
                  backgroundImage: `radial-gradient(${alpha(
                    '#006633',
                    0.03
                  )} 1px, transparent 1px),
                                    radial-gradient(${alpha(
                                      '#8B6B3E',
                                      0.02
                                    )} 1px, transparent 1px)`,
                  backgroundPosition: '0 0, 16px 16px',
                  backgroundSize: '32px 32px',
                }
              : {},
        }),
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow:
              theme.palette.mode === 'light'
                ? '0 1px 2px rgba(0,0,0,0.06)'
                : '0 1px 2px rgba(0,0,0,0.4)',
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
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
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
                theme.palette.mode === 'light' ? 0.1 : 0.2
              ),
              '&:hover': {
                backgroundColor: alpha(
                  theme.palette.primary.main,
                  theme.palette.mode === 'light' ? 0.16 : 0.28
                ),
              },
            },
          }),
        },
      },
    },
  });

const demoSession = {
  user: { name: 'Usuario Activo', email: 'user@example.com', image: '' },
};

export default function HomePage({ window }) {
  const navigate = useNavigate();
  const location = useLocation();
  const appWindow = window !== undefined ? window() : undefined;

  // ======== MODE (toggle claro/oscuro, persistido en localStorage) ========
  const [mode, setMode] = React.useState(() => {
    const saved = localStorage.getItem('intranet_mode');
    return saved === 'dark' || saved === 'light' ? saved : 'light'; // inicia en claro cálido
  });
  React.useEffect(() => {
    localStorage.setItem('intranet_mode', mode);
  }, [mode]);

  const theme = React.useMemo(() => makeTheme(mode), [mode]);

  const [session, setSession] = React.useState(demoSession);
  const authentication = React.useMemo(
    () => ({
      signIn: () => setSession(demoSession),
      signOut: () => setSession(null),
    }),
    []
  );

  // 🔗 Navegación
  const NAVIGATION = [
    { segment: 'utilidad', title: 'Utilidad', icon: <PeopleIcon /> },
    {
      segment: 'ventasTotales',
      title: 'Ventas Totales',
      icon: <SecurityIcon />,
    },
    {
      title: 'Ingreso por venta totales',
      icon: <MonetizationOn />,
      children: [
        {
          segment: 'ingresoVentasTotales',
          title: 'Registro',
          icon: <DescriptionIcon />,
        },
        {
          segment: 'ingresoVentasTotales/kpis',
          title: 'KPI',
          icon: <DescriptionIcon />,
        },
      ],
    },
    {
      segment: 'precioUnitario',
      title: 'Precio Unitario',
      icon: <LocalOfferIcon />,
    },
    { segment: 'prueba', title: 'Documentos', icon: <DescriptionIcon /> },
    { segment: '#2', title: 'Socios', icon: <GroupIcon /> },
    { segment: '#3', title: 'Sucursales', icon: <BusinessIcon /> },
  ];

  // AppBar actions: botón para cambiar el modo
  function CustomToolbarActions() {
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ width: '100%' }}
      >
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          size="small"
          startIcon={mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
        >
          {mode === 'dark' ? 'Fondo claro' : 'Fondo oscuro'}
        </Button>
      </Stack>
    );
  }

  // 👤 Footer de cuenta
  function SidebarFooterAccount({ mini }) {
    const PreviewComponent = React.useMemo(
      () => (props) => (
        <AccountPreview
          {...props}
          variant={mini ? 'condensed' : 'expanded'}
          sx={{ p: 1 }}
        />
      ),
      [mini]
    );

    function SidebarPopoverContent({ close }) {
      return (
        <Stack direction="column" spacing={1} sx={{ p: 1.25, minWidth: 220 }}>
          <Button
            fullWidth
            variant="text"
            onClick={() => {
              navigate('/utilidad');
              close();
            }}
            sx={{ justifyContent: 'flex-start', gap: 1 }}
          >
            <SettingsIcon fontSize="small" />
            Configuración
          </Button>

          <AccountPopoverFooter>
            <SignOutButton
              onClick={authentication.signOut}
              slotProps={{
                button: {
                  children: 'Cerrar sesión',
                  color: 'error',
                  variant: 'outlined',
                },
              }}
            />
          </AccountPopoverFooter>
        </Stack>
      );
    }

    return (
      <Account
        slotProps={{ preview: { variant: mini ? 'condensed' : 'expanded' } }}
        localeText={{ accountSignOutLabel: 'Cerrar sesión' }}
        slots={{
          preview: PreviewComponent,
          popoverContent: SidebarPopoverContent,
        }}
      />
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
            toolbarActions: CustomToolbarActions,
            sidebarFooter: SidebarFooterAccount,
          }}
          sx={{
            '& .MuiDrawer-paper': { p: 0 },
            bgcolor: 'background.default',
          }}
        >
          {/* Lienzo de contenido */}
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              minHeight: 'calc(100vh - 64px)',
              bgcolor: 'background.default',
            }}
          >
            {/* Tarjeta principal */}
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

HomePage.propTypes = { window: PropTypes.func };
