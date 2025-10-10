// src/pages/InformeVentaResiduos.jsx
import React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Divider,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// --- Helpers de formato ---
const toDate = (v) =>
  v ? new Date(v).toLocaleDateString('es-BO', { timeZone: 'UTC' }) : '';
const toMoney = (v) =>
  (v ?? 0).toLocaleString('es-BO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

// --- Datos demo (elimina y pásalos por props) ---
const DEMO_ROWS = [
  {
    id: 1,
    fecha: '2025-10-08',
    nroRecibo: 1197,
    detalle: 'LEÑA',
    cantidad: 1,
    um: 'CAMIONETA',
    precioUnitario: 50,
  },
  {
    id: 2,
    fecha: '2025-10-08',
    nroRecibo: 1196,
    detalle: 'PALLET DE MADERA',
    cantidad: 8,
    um: 'PZA',
    precioUnitario: 15,
  },
  {
    id: 3,
    fecha: '2025-10-08',
    nroRecibo: 1195,
    detalle: 'PALLET DE MADERA EN MAL ESTADO',
    cantidad: 36,
    um: 'PZA',
    precioUnitario: 5,
  },
];

export default function InformeVentaResiduos({
  rows = DEMO_ROWS,
  title = 'INFORME VENTA RESIDUOS',
  logoSrc, // ej: import logo from '@/assets/coboce.png'
  showActions = true,
  onEdit, // (row) => void
  onDelete, // (row) => void
}) {
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // Normaliza filas (calcula total si no viene)
  const normalized = React.useMemo(
    () =>
      (rows || []).map((r, i) => ({
        nro: i + 1,
        total:
          r.total ??
          (Number(r.cantidad) || 0) * (Number(r.precioUnitario) || 0),
        ...r,
      })),
    [rows]
  );

  // Filtro por Detalle (y por nroRecibo)
  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return normalized;
    return normalized.filter(
      (r) =>
        String(r.detalle || '')
          .toLowerCase()
          .includes(term) ||
        String(r.nroRecibo || '')
          .toLowerCase()
          .includes(term)
    );
  }, [normalized, q]);

  const paged = React.useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Paper sx={{ p: 2 }}>
      {/* Cabecera tipo planilla */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <Box
          sx={{ width: 96, height: 56, display: 'flex', alignItems: 'center' }}
        >
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="logo"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          ) : (
            <Box
              sx={{
                width: 96,
                height: 56,
                borderRadius: 1,
                bgcolor: '#e6efe9',
                border: '1px solid #cfe3d7',
              }}
            />
          )}
        </Box>
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={800} letterSpacing={0.4}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ width: 96 }} />
      </Stack>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <TextField
          size="small"
          label="Buscar por detalle o Nº recibo"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ width: 360 }}
        />
      </Stack>

      <Divider sx={{ mb: 1 }} />

      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow
              sx={{
                '& th': {
                  fontWeight: 700,
                  fontSize: 12,
                  bgcolor: 'background.paper',
                },
              }}
            >
              <TableCell align="center" width={60}>
                No
              </TableCell>
              <TableCell align="center" width={110}>
                FECHA
              </TableCell>
              <TableCell align="center" width={110}>
                No RECIBO
              </TableCell>
              <TableCell>DETALLE</TableCell>
              <TableCell align="right" width={100}>
                CANTIDAD
              </TableCell>
              <TableCell align="center" width={90}>
                U.M.
              </TableCell>
              <TableCell align="right" width={140}>
                PRECIO UN. (Bs)
              </TableCell>
              <TableCell align="right" width={140}>
                TOTAL (Bs)
              </TableCell>
              {showActions && (
                <TableCell align="right" width={110}>
                  Acciones
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showActions ? 9 : 8}
                  align="center"
                  sx={{ py: 3, color: 'text.secondary' }}
                >
                  Sin datos
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row) => (
                <TableRow key={row.id ?? `${row.nro}-${row.nroRecibo}`}>
                  <TableCell align="center">{row.nro}</TableCell>
                  <TableCell align="center">{toDate(row.fecha)}</TableCell>
                  <TableCell align="center">{row.nroRecibo}</TableCell>
                  <TableCell>{row.detalle}</TableCell>
                  <TableCell align="right">{row.cantidad}</TableCell>
                  <TableCell align="center">{row.um}</TableCell>
                  <TableCell align="right">
                    {toMoney(row.precioUnitario)}
                  </TableCell>
                  <TableCell align="right">{toMoney(row.total)}</TableCell>
                  {showActions && (
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onEdit?.(row)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete?.(row)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página"
        rowsPerPageOptions={[10, 25, 50]}
      />
    </Paper>
  );
}
