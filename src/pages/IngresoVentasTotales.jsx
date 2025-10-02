import React, { useEffect, useMemo, useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import {
  getAll,
  CreateObje,
  UpdateObje,
} from '../service/IngresoVentaTotal.js';

import IngresoVentaTotalModal from '../components/IngresoVentaTotal/IngresoVentaTotalModal.jsx';
import IngresoTotalECharts from '../components/graficos/IngresoTotalECharts.jsx';

import {
  formatMonthYear,
  formatPercent,
  formatNumber,
} from '../lib/convert.js';

import { getPeriodo } from '../service/libs.js';

// Definición de columnas para la tabla (datos)
const columns = [
  { id: 'periodo', label: 'Periodo', minWidth: 80, format: formatMonthYear },
  {
    id: 'PresMen',
    label: 'Presupuesto Mensual',
    minWidth: 80,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'VentMenOtrIng',
    label: 'Venta Men. con otros Ingresos',
    minWidth: 130,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'venMenCer',
    label: 'Venta Men. Cerámica',
    minWidth: 130,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'otrIngr',
    label: 'Otros Ingresos',
    minWidth: 120,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'venAcuOtros',
    label: 'Venta Acumulado Otros',
    minWidth: 140,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'venAcuCer',
    label: 'Venta Acum. Cerámica',
    minWidth: 130,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'acuPres',
    label: 'Acum. Presupuesto',
    minWidth: 110,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'diffVe_OtrosvsPres',
    label: 'Diff Ventas otros vs Presupuesto',
    minWidth: 110,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'diffVen_CervsPres',
    label: 'Diff Venta cerámica vs Presupuesto',
    minWidth: 110,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'meta',
    label: 'Meta',
    minWidth: 50,
    align: 'right',
    format: formatPercent,
  },
  {
    id: 'cumplMenCeramica',
    label: 'Cumpl. Mensual Cerámica',
    minWidth: 110,
    align: 'right',
    format: formatPercent,
  },
  {
    id: 'cumplOtrosIngrAcuvsAcumPres',
    label: 'Cumpl. Otros Ingresos Acum. vs Acum. Presupuesto',
    minWidth: 110,
    align: 'right',
    format: formatPercent,
  },
];

export default function IngresoVentasTotales() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState(null);

  const [rows, setRows] = useState([]); // normalizados para la tabla
  const [valorsTabla, setValoresTabla] = useState([]); // datos para gráficos

  // modal crear/editar
  const [openModal, setOpenModal] = useState(false);
  const [periodoActual, setPeriodoActual] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null); // null = crear, objeto = editar

  //

  // Carga de datos (unificada)
  const loadUtilities = async (isReload = false) => {
    isReload ? setReloading(true) : setLoading(true);
    setError(null);
    try {
      const resp = await getAll();
      const normalizados = resp?.normalizados ?? [];
      const valores = resp?.valores ?? [];
      setRows(normalizados);
      setValoresTabla(valores);
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

  // Normaliza strings para búsqueda (quita acentos, pasa a minúsculas)
  const normalize = (s) =>
    String(s ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();

  // Filtrado de filas por query
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

  // Si cambia el tamaño del filtro, resetea la página
  useEffect(() => {
    setPage(0);
  }, [filtered.length]);

  const start = page * rowsPerPage;
  const sliced = useMemo(
    () => filtered.slice(start, start + rowsPerPage),
    [filtered, start, rowsPerPage]
  );

  // Abrir modal para crear
  const handleRegistrar = async () => {
    try {
      setSelectedRow(null); // crear
      setOpenModal(true);
      const per = await getPeriodo(); // 'YYYY-MM-01' o { periodo: '...' }
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

  // Abrir modal para editar
  const handleEditar = (row) => {
    // console.log('edit row', { id: row?.id, periodo: row?.periodo });
    setSelectedRow(row); // modo edición
    setOpenModal(true);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
      <Toolbar sx={{ gap: 2, flexWrap: 'wrap', position: 'relative' }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          UTILIDADES GESTIÓN 2025-2026
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

      {error && <Box sx={{ px: 2, py: 1, color: 'error.main' }}>{error}</Box>}

      <TableContainer sx={{ width: '100%' }}>
        <Table
          stickyHeader
          aria-label="tabla utilidades"
          sx={{
            minWidth: 900,
            borderCollapse: 'separate',
            borderSpacing: 0,
            '& th, & td': { borderBottom: '1px solid', borderColor: 'divider' },
            '& th:not(:last-of-type), & td:not(:last-of-type)': {
              borderRight: '1px solid',
              borderColor: 'divider',
            },
            '& thead th': { fontWeight: 600, bgcolor: 'background.paper' },
          }}
        >
          <TableHead>
            {/* Fila 1: grupos (sumar 1 colSpan para Acciones) */}
            <TableRow>
              <TableCell
                align="center"
                colSpan={1}
                sx={{ top: 0, position: 'sticky', zIndex: 3 }}
              >
                Periodo
              </TableCell>
              <TableCell
                align="center"
                colSpan={4}
                sx={{ top: 0, position: 'sticky', zIndex: 3 }}
              >
                Metas mensuales
              </TableCell>
              <TableCell
                align="center"
                colSpan={3}
                sx={{ top: 0, position: 'sticky', zIndex: 3 }}
              >
                Acumulado
              </TableCell>
              <TableCell
                align="center"
                colSpan={2}
                sx={{ top: 0, position: 'sticky', zIndex: 3 }}
              >
                Diferencias
              </TableCell>
              <TableCell
                align="center"
                colSpan={3}
                sx={{ top: 0, position: 'sticky', zIndex: 3 }}
              >
                Cumplimiento (%)
              </TableCell>
              <TableCell
                align="center"
                colSpan={1}
                sx={{ top: 0, position: 'sticky', zIndex: 3 }}
              >
                Acciones
              </TableCell>
            </TableRow>

            {/* Fila 2: encabezados de columnas + Acciones */}
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  style={{ minWidth: col.minWidth }}
                  sx={{ top: 56, position: 'sticky', zIndex: 3 }}
                >
                  {col.label}
                </TableCell>
              ))}
              <TableCell
                align="center"
                sx={{ top: 56, position: 'sticky', zIndex: 3, minWidth: 120 }}
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
                {columns.map((col) => {
                  const val = r?.[col.id];
                  return (
                    <TableCell key={col.id} align={col.align}>
                      {col.format ? col.format(val) : val}
                    </TableCell>
                  );
                })}

                {/* Celda de acciones */}
                <TableCell align="center">
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

            {/* Estado vacío */}
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
        rowsPerPageOptions={[10, 25, 100]}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(+e.target.value);
          setPage(0);
        }}
      />

      {/* Modal de registro / edición */}
      <IngresoVentaTotalModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() => loadUtilities(true)} // recarga tabla
        initialValues={selectedRow} // null → crear, objeto → editar
        periodoActual={periodoActual} // usado solo en crear
        createFn={CreateObje} // POST
        updateFn={UpdateObje} // PUT/PATCH
        editablePeriodo={false} // true si quieres que se pueda cambiar el mes
        idKey="id"
      />

      {/* Gráfico (usa los valores ya preparados en el backend) */}
      <IngresoTotalECharts rows={valorsTabla} />
    </Paper>
  );
}
