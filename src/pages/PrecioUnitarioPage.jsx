import React, { use, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  CircularProgress,
  LinearProgress,
  Stack,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';

import {
  getAll,
  ObtenerPeriodo,
  updatePrecioUnitario,
  CreatePrecioUnitario,
  UpdateMeta,
} from '../service/precioUnitario.js';
import PrecioUnitarioModal from '../components/PrecioUnitario/PrecioUnitarioModal.jsx';
import PrecioUnitarioECharts from '../components/PrecioUnitario/PrecioUnitarioECharts.jsx';

import {
  formatMonthYear,
  formatPercent,
  formatNumber,
} from '../lib/convert.js';
import PrecioUnitarioMetaModal from '../components/CambiarMentaModal.jsx';
// Columnas de la tabla
const columns = [
  { id: 'periodo', label: 'Periodo', minWidth: 80, format: formatMonthYear },
  {
    id: 'presMen',
    label: 'Presupuesto Mensual',
    minWidth: 80,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'precProm',
    label: 'Precio Promedio',
    minWidth: 130,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'regionCentro',
    label: 'Region Centro',
    minWidth: 130,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'regionEste',
    label: 'Region Este',
    minWidth: 120,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'regionOeste',
    label: 'Region Oeste',
    minWidth: 140,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'fabrica',
    label: 'Fabrica',
    minWidth: 130,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'exportacion',
    label: 'Meta',
    minWidth: 110,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'meta',
    label: 'Cumplimiento Mensual',
    minWidth: 110,
    align: 'right',
    format: formatPercent,
  },
  {
    id: 'cumplimientoMensual',
    label: 'Cumplimiento Acumulado',
    minWidth: 110,
    align: 'right',
    format: formatPercent,
  },
];

export default function PrecioUnitarioPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10); // arranca en 5

  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState(null);

  const [rows, setRows] = useState([]); // normalizados para tabla
  const [valorsTabla, setValoresTabla] = useState([]); // datos para gráfico

  // modal crear/editar
  const [openModal, setOpenModal] = useState(false);
  const [periodoActual, setPeriodoActual] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null); // null = crear

  const [openMeta, setOpenMeta] = useState(false);

  // Cargar datos
  const loadUtilities = async (isReload = false) => {
    isReload ? setReloading(true) : setLoading(true);
    setError(null);
    try {
      const resp = await getAll();
      //console.log(resp);
      const normalizados = resp?.normalizados ?? [];
      const valores = resp?.valores ?? [];
      const ValCum = resp?.graficaCumplimiento ?? [];
      console.log('PrecioUnitario', normalizados);
      setRows(normalizados);
      setValoresTabla(valores);
      //console.log('***********', ValCum);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la lista');
      setRows([]);
      setValoresTabla([]);
    } finally {
      isReload ? setReloading(false) : setLoading(false);
    }
  };

  useEffect(() => {
    loadUtilities(false);
  }, []);

  // Buscar
  const normalize = (s) =>
    String(s ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();

  const filtered = useMemo(() => {
    const data = Array.isArray(rows) ? rows : [];
    const nq = normalize(query.trim());
    if (!nq) return data;
    return data.filter((r) =>
      columns.some((c) => {
        const v = r?.[c.id];
        const raw = normalize(v);
        const formatted = c.format ? normalize(c.format(v)) : '';
        return raw.includes(nq) || formatted.includes(nq);
      })
    );
  }, [query, rows]);

  useEffect(() => {
    setPage(0);
  }, [filtered.length]);

  const start = page * rowsPerPage;
  const sliced = useMemo(
    () => filtered.slice(start, start + rowsPerPage),
    [filtered, start, rowsPerPage]
  );

  const handleRegisterMeta = async () => {
    setOpenMeta(true);
  };

  // Abrir modal - Crear
  const handleRegistrar = async () => {
    try {
      setSelectedRow(null);
      setOpenModal(true);
      const per = await ObtenerPeriodo();
      const p =
        typeof per === 'string'
          ? per
          : typeof per?.periodo === 'string'
            ? per.periodo
            : null;
      setPeriodoActual(p);
    } catch (err) {
      console.log(err);
      setPeriodoActual(null);
    }
  };

  // Abrir modal - Editar
  const handleEditar = (row) => {
    setSelectedRow(row);
    console.log(row);
    setOpenModal(true);
  };

  const HEADER_ROW1 = 40; // si usas size="medium", usa 56

  // Estilos sticky
  const sxStickyBase = {
    position: 'sticky',
    bgcolor: 'background.paper',
    zIndex: 3,
  };
  const sxHeadTop1 = { top: 0, height: HEADER_ROW1, ...sxStickyBase };
  const sxHeadTop2 = { top: HEADER_ROW1, ...sxStickyBase };
  const sxLeftStickyHead = {
    ...sxStickyBase,
    left: 0,
    boxShadow: (t) => `2px 0 0 ${t.palette.divider} inset`,
    zIndex: 4,
  };
  const sxRightStickyHead = {
    ...sxStickyBase,
    right: 0,
    boxShadow: (t) => `-2px 0 0 ${t.palette.divider} inset`,
    zIndex: 4,
  };
  const sxLeftStickyCell = {
    position: 'sticky',
    left: 0,
    bgcolor: 'background.paper',
    boxShadow: (t) => `2px 0 0 ${t.palette.divider} inset`,
    zIndex: 1,
  };
  const sxRightStickyCell = {
    position: 'sticky',
    right: 0,
    bgcolor: 'background.paper',
    boxShadow: (t) => `-2px 0 0 ${t.palette.divider} inset`,
    zIndex: 1,
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
      <Stack spacing={3}>
        <Paper>
          <Toolbar sx={{ gap: 2, flexWrap: 'wrap', position: 'relative' }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              VENTAS TOTALES
            </Typography>

            <Button
              size="small"
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleRegistrar}
              disabled={loading || reloading}
            >
              Registrar
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleRegisterMeta}
              disabled={loading || reloading}
            >
              Cambiar meta
            </Button>

            <Box sx={{ width: { xs: '100%', sm: 320 } }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: query ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setQuery('')}
                        aria-label="Limpiar búsqueda"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Box>

            {(reloading || loading) && (
              <LinearProgress
                sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
              />
            )}
          </Toolbar>

          {error && (
            <Box sx={{ px: 2, py: 1, color: 'error.main' }}>{error}</Box>
          )}

          <TableContainer
            sx={{ width: '100%', maxHeight: 560, overflow: 'auto' }}
          >
            <Table
              stickyHeader
              size="small"
              aria-label="tabla utilidades"
              sx={{
                minWidth: 900,
                borderCollapse: 'separate',
                borderSpacing: 0,
                '& th, & td': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  whiteSpace: 'nowrap',
                  fontVariantNumeric: 'tabular-nums',
                },
                '& th:not(:last-of-type), & td:not(:last-of-type)': {
                  borderRight: '1px solid',
                  borderColor: 'divider',
                },
                '& thead th': { fontWeight: 600, bgcolor: 'background.paper' },
              }}
            >
              <TableHead>
                {/* Fila 1: grupos */}
                <TableRow>
                  <TableCell
                    sx={{ ...sxHeadTop1, ...sxLeftStickyHead, py: 0.5 }}
                  >
                    Periodo
                  </TableCell>
                  <TableCell
                    align="center"
                    colSpan={2}
                    sx={{ ...sxHeadTop1, py: 0.5 }}
                  >
                    Ingresos mensuales
                  </TableCell>
                  <TableCell
                    align="center"
                    colSpan={2}
                    sx={{ ...sxHeadTop1, py: 0.5 }}
                  >
                    Acumulado
                  </TableCell>
                  <TableCell
                    align="center"
                    colSpan={2}
                    sx={{ ...sxHeadTop1, py: 0.5 }}
                  >
                    Diferencias
                  </TableCell>
                  <TableCell
                    align="center"
                    colSpan={3}
                    sx={{ ...sxHeadTop1, py: 0.5 }}
                  >
                    Cumplimiento (%)
                  </TableCell>
                  <TableCell
                    align="center"
                    colSpan={1}
                    sx={{ ...sxHeadTop1, ...sxRightStickyHead }}
                  >
                    Acciones
                  </TableCell>
                </TableRow>

                {/* Fila 2: encabezados reales */}
                <TableRow>
                  {columns.map((col, idx) => (
                    <TableCell
                      key={col.id}
                      align={col.align}
                      style={{ minWidth: col.minWidth }}
                      sx={{
                        ...sxHeadTop2,
                        ...(idx === 0 ? sxLeftStickyHead : {}),
                      }}
                    >
                      {col.label}
                    </TableCell>
                  ))}
                  <TableCell
                    align="center"
                    sx={{ ...sxHeadTop2, ...sxRightStickyHead, minWidth: 120 }}
                  >
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {sliced.map((r, idx) => (
                  <TableRow
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={r?.id ?? `${r?.periodo ?? 'row'}-${idx}`}
                  >
                    {columns.map((col, cIdx) => {
                      const val = r?.[col.id];
                      return (
                        <TableCell
                          key={col.id}
                          align={col.align}
                          sx={cIdx === 0 ? sxLeftStickyCell : undefined}
                        >
                          {col.format ? col.format(val) : val}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={sxRightStickyCell}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditar(r)}
                        sx={{ mr: 1 }}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {!error && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} align="center">
                      {query
                        ? 'Sin resultados para tu búsqueda.'
                        : 'No hay utilidades registradas.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_e, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 12]}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />

          <PrecioUnitarioModal
            open={openModal}
            onClose={() => setOpenModal(false)}
            onSuccess={() => loadUtilities(true)}
            initialValues={selectedRow}
            periodoActual={periodoActual}
            createFn={CreatePrecioUnitario}
            updateFn={updatePrecioUnitario}
            editablePeriodo={false}
            idKey="id"
            periodoAcual={periodoActual}
          />

          <PrecioUnitarioMetaModal
            open={openMeta}
            onClose={() => setOpenMeta(false)}
            initialMeta={100}
            updateMeta={UpdateMeta}
            onSuccess={() => {
              loadUtilities(true);
            }}
          />
        </Paper>

        <Paper>
          <PrecioUnitarioECharts rows={valorsTabla} />
        </Paper>
      </Stack>
    </Paper>
  );
}

// {/* Modal crear/editar */}
// <IngresoVentaTotalModal
//   open={openModal}
//   onClose={() => setOpenModal(false)}
//   onSuccess={() => loadUtilities(true)}
//   initialValues={selectedRow}
//   periodoActual={periodoActual}
//   createFn={CreateObje}
//   updateFn={UpdateObje}
//   editablePeriodo={false}
//   idKey="id"
// />

{
  /* deja 24px entre hijos por defecto */
}
// <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
//   <IngresoTotalECharts rows={0} />
// </Paper>
// <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
//   <CumplimientoECharts rows={valoresCump} metaDefault={90} />
// </Paper>
