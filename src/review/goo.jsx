import * as React from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  InputBase,
  Paper,
  Button,
  Chip,
  Avatar,
  Tooltip,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import AddIcon from '@mui/icons-material/Add';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';

const drawerWidth = 240;

const theme = createTheme({
  palette: {
    background: { default: '#f7f8fb' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial',
    h4: { fontWeight: 800 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { boxShadow: '0 8px 24px rgba(10, 37, 64, 0.05)' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: '#eef0f3' },
        head: { fontWeight: 700, color: '#637083' },
      },
    },
  },
});

const SidebarHeader = styled('div')(({ theme }) => ({
  ...theme.mixins.toolbar,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '0 16px',
  fontWeight: 700,
}));

const StatusDot = ({ color = '#22c55e' }) => (
  <span
    style={{
      display: 'inline-block',
      width: 10,
      height: 10,
      borderRadius: 999,
      background: color,
      marginRight: 8,
    }}
  />
);

const users = [
  {
    id: 1,
    name: 'Jese Leos',
    email: 'jese.leos@example.com',
    role: 'Administrator',
    status: 'Active',
    statusColor: '#22c55e',
    lastLogin: '2023-10-26 10:30 AM',
    avatar: 'https://i.pravatar.cc/100?img=5',
  },
  {
    id: 2,
    name: 'Bonnie Green',
    email: 'bonnie@example.com',
    role: 'Editor',
    status: 'Pending',
    statusColor: '#f59e0b',
    lastLogin: '2023-10-25 03:15 PM',
    avatar: 'https://i.pravatar.cc/100?img=1',
  },
  {
    id: 3,
    name: 'Thomas Lean',
    email: 'thomas.lean@example.com',
    role: 'Viewer',
    status: 'Inactive',
    statusColor: '#ef4444',
    lastLogin: '2023-09-12 11:00 AM',
    avatar: 'https://i.pravatar.cc/100?img=13',
  },
];

function Topbar() {
  return (
    <AppBar
      color="inherit"
      position="fixed"
      elevation={0}
      sx={{
        borderBottom: '1px solid #eef0f3',
        ml: `${drawerWidth}px`,
        width: `calc(100% - ${drawerWidth}px)`,
        background: '#fff',
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <Paper
          variant="outlined"
          sx={{
            px: 2,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            minWidth: 360,
            borderRadius: 999,
          }}
        >
          <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <InputBase placeholder="Global Search…" sx={{ flex: 1 }} />
        </Paper>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Notificaciones">
          <IconButton>
            <NotificationsNoneOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Avatar
          src="https://i.pravatar.cc/80?img=7"
          sx={{ width: 36, height: 36 }}
        />
        <Typography sx={{ fontWeight: 600 }}>John Doe</Typography>
      </Toolbar>
    </AppBar>
  );
}

function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid #eef0f3',
        },
      }}
    >
      <SidebarHeader>
        <Avatar sx={{ bgcolor: '#175ce5', width: 32, height: 32 }}>C</Avatar>
        <Typography sx={{ fontWeight: 800 }}>CMS</Typography>
      </SidebarHeader>
      <Divider />
      <List>
        {[
          { icon: <DashboardIcon />, label: 'Dashboard' },
          { icon: <PeopleIcon />, label: 'User Management', selected: true },
          { icon: <Inventory2OutlinedIcon />, label: 'Product Catalog' },
          { icon: <ReceiptLongOutlinedIcon />, label: 'Order History' },
          { icon: <SettingsOutlinedIcon />, label: 'Settings' },
        ].map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton selected={item.selected}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <LogoutOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
}

function FiltersBar() {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      alignItems="center"
    >
      <TextField
        placeholder="Search users by name, email or role…"
        size="small"
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <Select displayEmpty defaultValue="">
          <MenuItem value="">
            <em>Filter by Role</em>
          </MenuItem>
          <MenuItem value={'Administrator'}>Administrator</MenuItem>
          <MenuItem value={'Editor'}>Editor</MenuItem>
          <MenuItem value={'Viewer'}>Viewer</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <Select displayEmpty defaultValue="">
          <MenuItem value="">
            <em>Filter by Status</em>
          </MenuItem>
          <MenuItem value={'Active'}>Active</MenuItem>
          <MenuItem value={'Pending'}>Pending</MenuItem>
          <MenuItem value={'Inactive'}>Inactive</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}

function UsersTable() {
  return (
    <Paper sx={{ p: 0, overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={56}></TableCell>
              <TableCell>USER</TableCell>
              <TableCell>ROLE</TableCell>
              <TableCell>STATUS</TableCell>
              <TableCell>LAST LOGIN</TableCell>
              <TableCell align="right">ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      border: '2px solid #cfd6e4',
                      mx: 1,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={u.avatar} />
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{u.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {u.email}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography>{u.role}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StatusDot color={u.statusColor} />
                    <Typography>{u.status}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography color="text.secondary">{u.lastLogin}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small">
                      <EditOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error">
                      <DeleteOutlineOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Showing 1–3 of 100
        </Typography>
        <Pagination count={3} page={2} siblingCount={0} />
      </Box>
    </Paper>
  );
}

export default function MUIUserManagementDemo() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Sidebar />
      <Topbar />
      <Box
        component="main"
        sx={{ flexGrow: 1, ml: `${drawerWidth}px`, p: 3, mt: '64px' }}
      >
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Dashboard / User Management
        </Typography>
        <Typography variant="h4" sx={{ mb: 3 }}>
          All Users
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2,
          }}
        >
          <FiltersBar />
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />}>
              Export to CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ background: '#175ce5' }}
            >
              Add New User
            </Button>
          </Stack>
        </Box>

        <UsersTable />
      </Box>
    </ThemeProvider>
  );
}
