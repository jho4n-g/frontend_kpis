import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { createTheme, alpha } from '@mui/material/styles';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import BusinessIcon from '@mui/icons-material/Business';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout, ThemeSwitcher } from '@toolpad/core/DashboardLayout';
import { DemoProvider } from '@toolpad/core/internal';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Account,
  AccountPreview,
  AccountPopoverFooter,
  SignOutButton,
} from '@toolpad/core/Account';

// 🎨 Tema minimal blanco
const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#006633' }, // verde corporativo
    background: { default: '#ffffff', paper: '#ffffff' },
    divider: '#eee',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: `'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`,
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          color: '#111',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          borderBottom: '1px solid #eee',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#fff',
          borderRight: '1px solid #eee',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '4px 8px',
          paddingLeft: 12,
          paddingRight: 12,
          '&.Mui-selected': {
            backgroundColor: alpha('#006633', 0.08),
            '&:hover': { backgroundColor: alpha('#006633', 0.12) },
          },
        },
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

  const [session, setSession] = React.useState(demoSession);
  const authentication = React.useMemo(
    () => ({
      signIn: () => setSession(demoSession),
      signOut: () => {
        setSession(null);
      },
    }),
    []
  );

  // 🔗 Navegación (sin cambios de lógica)
  const NAVIGATION = [
    { segment: 'utilidad', title: 'Utilidad', icon: <PeopleIcon /> },
    {
      segment: 'ventasTotales',
      title: 'Ventas Totales',
      icon: <SecurityIcon />,
    },
    {
      segment: '#',
      title: 'Logs',
      icon: <HistoryIcon />,
      children: [
        { segment: '#', title: 'Login', icon: <DescriptionIcon /> },
        { segment: 'acciones', title: 'Acciones', icon: <DescriptionIcon /> },
      ],
    },
    {
      segment: '#',
      title: 'Responsables',
      icon: <AssignmentIcon />,
    },
    { segment: '#', title: 'Documentos', icon: <DescriptionIcon /> },
    { segment: '#', title: 'Socios', icon: <GroupIcon /> },
    { segment: '#', title: 'Sucursales', icon: <BusinessIcon /> },
  ];

  // ✅ AppBar minimal: solo ThemeSwitcher a la derecha
  function CustomToolbarActions() {
    return (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ width: '100%' }}
      >
        {/* Izquierda vacía para look limpio */}
        <Box sx={{ flex: 1 }} />
        <ThemeSwitcher />
      </Stack>
    );
  }

  // 👤 Footer de cuenta (igual, minimal)
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
          // Logo/branding minimal a la izquierda en AppBar
          logo: (
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, color: '#006633', letterSpacing: 0.4 }}
            >
              Intranet
            </Typography>
          ),
          title: '',
          homeUrl: '/',
        }}
        theme={appTheme}
        router={{ pathname: location.pathname, navigate }}
        navigation={NAVIGATION}
        authentication={authentication}
        session={session}
      >
        <DashboardLayout
          slots={{
            toolbarActions: CustomToolbarActions,
            sidebarFooter: SidebarFooterAccount,
          }}
          sx={{
            '& .MuiDrawer-paper': { maxWidth: 230 },
            bgcolor: '#fff',
          }}
        >
          {/* Lienzo de contenido blanco y aireado */}
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              minHeight: 'calc(100vh - 64px)',
              bgcolor: '#fff',
            }}
          >
            {/* Encabezado de página opcional (sin "Panel" ni buscador) */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={1.5}
              sx={{ mb: 2 }}
            ></Stack>

            {/* Tarjeta principal */}
            <Box
              sx={{
                backgroundColor: '#fff',
                border: '1px solid #eee',
                borderRadius: 2,
                p: { xs: 2, sm: 3 },
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
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
