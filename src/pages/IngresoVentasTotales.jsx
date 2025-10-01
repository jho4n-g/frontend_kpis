import React, { useEffect, useState, useMemo } from 'react';
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { LinearProgress } from '@mui/material';
import { getAll } from '../service/IngresoVentaTotal.js';
import IngresoVentaTotalModal from '../components/IngresoVentaTotal/IngresoVentaTotalModal.jsx';

import {
  formatMonthYear,
  formatPercent,
  formatNumber,
} from '../lib/convert.js';

import { CreateObje } from '../service/IngresoVentaTotal.js';

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
    label: 'Venta Men. Ceramica',
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
    label: 'Venta Acum. Ceramica',
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
    label: 'Diff Ventas otros Presupusto',
    minWidth: 110,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'diffVen_CervsPres',
    label: 'Diferencia entre venta ceramica vs presupuesto',
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
    label: 'Cumpl. Mensual Ceramica',
    minWidth: 110,
    align: 'right',
    format: formatPercent,
  },
  {
    id: 'cumplOtrosIngrAcuvsAcumPres',
    label: 'Cumpl. otros ingresos Acum. vs Acum. Presupuesto',
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
  const [row, setRow] = useState(null);

  const [reloading, setReloading] = useState(false); // fetchs posteriores
  const [error, setError] = useState(null);

  //abrir modal
  const [openModal, setOpenModal] = useState(true);

  const loadUtilities = async (isReload = false) => {
    isReload ? setReloading(true) : setLoading(true);
    setError(null);
    try {
      const resp = await getAll();
      console.log(resp);
      const list = Array.isArray(resp?.data)
        ? resp.data
        : Array.isArray(resp)
          ? resp
          : [];
      setRow(list);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la lista');
      setRow([]);
    } finally {
      isReload ? setReloading(false) : setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const resp = await getAll();
        if (!active) return;
        const list = Array.isArray(resp?.data)
          ? resp.data
          : Array.isArray(resp)
            ? resp
            : [];
        setRow(list);
      } catch (err) {
        console.log(err);
        if (active) setError('No se pudo cargar la lista');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    loadUtilities();
  }, []);

  const normalize = (s) =>
    String(s ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();

  const filtered = useMemo(() => {
    const data = Array.isArray(row) ? row : [];
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
  }, [query, row]);

  const start = page * rowsPerPage;

  const sliced = useMemo(
    () => filtered.slice(start, start + rowsPerPage),
    [filtered, start, rowsPerPage]
  );

  const handleRegister = () => {
    setOpenModal(true);
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
      {/* Toolbar con buscador */}
      <Toolbar sx={{ gap: 2, flexWrap: 'wrap', position: 'relative' }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          UTILIDADES GESTION 2025-2026
        </Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => handleRegister()}
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

        {reloading && (
          <LinearProgress
            sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
          />
        )}
      </Toolbar>
      {/* Mensaje de error (si hubo) */}
      {error && <Box sx={{ px: 2, py: 1, color: 'error.main' }}>{error}</Box>}

      {/* Tabla sticky con header agrupado + líneas sutiles */}
      <TableContainer sx={{ width: '100%' }}>
        <Table
          stickyHeader
          aria-label="tabla utilidades"
          sx={{
            minWidth: 900,
            borderCollapse: 'separate',
            borderSpacing: 0,
            '& th, & td': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
            '& th:not(:last-of-type), & td:not(:last-of-type)': {
              borderRight: '1px solid',
              borderColor: 'divider',
            },
            '& thead th': {
              fontWeight: 600,
              bgcolor: 'background.paper',
            },
          }}
        >
          <TableHead>
            {/* Fila 1: grupos */}
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
                colSpan={2}
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
                Cumplimiento (%)
              </TableCell>
            </TableRow>

            {/* Fila 2: columnas */}
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
            </TableRow>
          </TableHead>

          <TableBody>
            {sliced.map((row, idx) => (
              <TableRow
                hover
                role="checkbox"
                tabIndex={-1}
                key={`${row.periodo}-${idx}`}
              >
                {columns.map((col) => {
                  const val = row[col.id];
                  return (
                    <TableCell key={col.id} align={col.align}>
                      {col.format ? col.format(val) : val}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {/* Estado vacío cuando no hay filas */}
            {!error && filtered.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                {query
                  ? 'Sin resultados para tu búsqueda.'
                  : 'No hay utilidades registradas.'}
              </Box>
            )}

            {sliced.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center">
                  Sin resultados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* paginación */}
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

      <IngresoVentaTotalModal
        open={openModal}
        periodoAcutal="2025-05-01"
        onClose={() => setOpenModal(false)}
        createFn={CreateObje}
        onSuccess={() => loadUtilities(true)}
      />
    </Paper>
  );
}
