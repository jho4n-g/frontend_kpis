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

import {
  formatMonthYear,
  formatPercent,
  formatNumber,
} from '../lib/convert.js';

import { getAllUtilities, createUtilities } from '../service/utilidad.services';
import UtilityUpsertModal from '../components/UtilidadPage/EditModalUtilidad.jsx';
// -------- columnas (segunda fila de header) --------
const columns = [
  { id: 'periodo', label: 'Periodo', minWidth: 120, format: formatMonthYear },
  {
    id: 'mensualidad_mensual',
    label: 'Mensualidad',
    minWidth: 120,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'meta_mensual',
    label: 'Meta mensual',
    minWidth: 120,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'utilidades_acumuladas',
    label: 'Utilidades acum.',
    minWidth: 140,
    align: 'right',
    format: formatNumber,
  },
  {
    id: 'meta_acumulada',
    label: 'Meta acumulada',
    minWidth: 140,
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
    id: 'cumplimento_mensual',
    label: 'Cumpl. mensual',
    minWidth: 110,
    align: 'right',
    format: formatPercent,
  },
  {
    id: 'cumplimiento_acumulado',
    label: 'Cumpl. acumulado',
    minWidth: 110,
    align: 'right',
    format: formatPercent,
  },
];

export default function UtilidadesTable() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [rowUtilis, setRowUtils] = useState(null);

  const [upsertOpen, setUpsertOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [reloading, setReloading] = useState(false); // fetchs posteriores
  const [error, setError] = useState(null);

  const loadUtilities = async (isReload = false) => {
    isReload ? setReloading(true) : setLoading(true);
    setError(null);
    try {
      const resp = await getAllUtilities();
      const list = Array.isArray(resp?.data)
        ? resp.data
        : Array.isArray(resp)
          ? resp
          : [];
      setRowUtils(list);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la lista');
      setRowUtils([]);
    } finally {
      isReload ? setReloading(false) : setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const resp = await getAllUtilities();
        if (!active) return;
        const list = Array.isArray(resp?.data)
          ? resp.data
          : Array.isArray(resp)
            ? resp
            : [];
        setRowUtils(list);
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

  // ---- filtro simple por texto en cualquier columna visible ----
  // para que la búsqueda ignore mayúsculas, tildes, etc.
  const normalize = (s) =>
    String(s ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();

  const filtered = useMemo(() => {
    const data = Array.isArray(rowUtilis) ? rowUtilis : [];
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
  }, [query, rowUtilis]);

  const start = page * rowsPerPage;

  const sliced = useMemo(
    () => filtered.slice(start, start + rowsPerPage),
    [filtered, start, rowsPerPage]
  );

  // ---- acciones ----
  const handleRegister = () => {
    setEditRow(null);
    setUpsertOpen(true);
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
      <UtilityUpsertModal
        open={upsertOpen}
        onClose={() => setUpsertOpen(false)}
        onSuccess={() => loadUtilities(true)}
        initialValues={editRow}
        createFn={createUtilities}
        updateFn={false}
        idKey="id" // o "_id" según tu backend
      />
    </Paper>
  );
}
