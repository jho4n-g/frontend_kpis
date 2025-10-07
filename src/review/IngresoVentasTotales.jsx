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
  TableFooter,
  TablePagination,
  TableRow,
  CircularProgress,
  LinearProgress,
  Stack,
  Menu,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';

// Exportar a XLSX
import * as XLSX from 'xlsx';

import {
  getAll,
  CreateObje,
  UpdateObje,
} from '../service/IngresoVentaTotal.js';
import IngresoVentaTotalModal from '../components/IngresoVentaTotal/IngresoVentaTotalModal.jsx';
import IngresoTotalECharts from '../components/graficos/IngresoTotalECharts.jsx';
import CumplimientoECharts from '../components/graficos/CumplimientoECharts.jsx';

import {
  formatMonthYear,
  formatPercent,
  formatNumber,
} from '../lib/convert.js';
import { getPeriodo } from '../service/libs.js';

// ------------------- Definición de columnas (incluye group y tipo) -------------------
const GROUPS = [
  { id: 'mensuales', label: 'Ingresos mensuales' },
  { id: 'acumulado', label: 'Acumulado' },
  { id: 'diferencias', label: 'Diferencias' },
  { id: 'cumpl', label: 'Cumplimiento (%)' },
];

// tipo: 'number' | 'percent' | 'date' | 'text'
const columns = [
  {
    id: 'periodo',
    label: 'Periodo',
    minWidth: 80,
    format: formatMonthYear,
    group: null,
    type: 'date',
  },
  {
    id: 'PresMen',
    label: 'Presupuesto Mensual',
    minWidth: 100,
    align: 'right',
    format: formatNumber,
    group: 'mensuales',
    type: 'number',
  },
  {
    id: 'VentMenOtrIng',
    label: 'Venta Men. con otros Ingresos',
    minWidth: 160,
    align: 'right',
    format: formatNumber,
    group: 'mensuales',
    type: 'number',
  },
  {
    id: 'venMenCer',
    label: 'Venta Men. Cerámica',
    minWidth: 150,
    align: 'right',
    format: formatNumber,
    group: 'mensuales',
    type: 'number',
  },
  {
    id: 'otrIngr',
    label: 'Otros Ingresos',
    minWidth: 120,
    align: 'right',
    format: formatNumber,
    group: 'mensuales',
    type: 'number',
  },
  {
    id: 'venAcuOtros',
    label: 'Venta Acumulado Otros',
    minWidth: 160,
    align: 'right',
    format: formatNumber,
    group: 'acumulado',
    type: 'number',
  },
  {
    id: 'venAcuCer',
    label: 'Venta Acum. Cerámica',
    minWidth: 160,
    align: 'right',
    format: formatNumber,
    group: 'acumulado',
    type: 'number',
  },
  {
    id: 'acuPres',
    label: 'Acum. Presupuesto',
    minWidth: 140,
    align: 'right',
    format: formatNumber,
    group: 'acumulado',
    type: 'number',
  },
  {
    id: 'diffVe_OtrosvsPres',
    label: 'Diff Ventas otros vs Presupuesto',
    minWidth: 180,
    align: 'right',
    format: formatNumber,
    group: 'diferencias',
    type: 'number',
  },
  {
    id: 'diffVen_CervsPres',
    label: 'Diff Venta cerámica vs Presupuesto',
    minWidth: 180,
    align: 'right',
    format: formatNumber,
    group: 'diferencias',
    type: 'number',
  },
  {
    id: 'meta',
    label: 'Meta',
    minWidth: 80,
    align: 'right',
    format: formatPercent,
    group: 'cumpl',
    type: 'percent',
  },
  {
    id: 'cumplMenCeramica',
    label: 'Cumpl. Mensual Cerámica',
    minWidth: 170,
    align: 'right',
    format: formatPercent,
    group: 'cumpl',
    type: 'percent',
  },
  {
    id: 'cumplOtrosIngrAcuvsAcumPres',
    label: 'Cumpl. Otros Ingresos Acum. vs Acum. Presupuesto',
    minWidth: 220,
    align: 'right',
    format: formatPercent,
    group: 'cumpl',
    type: 'percent',
  },
];

const colById = Object.fromEntries(columns.map((c) => [c.id, c]));

// Presets de vistas
const PRESET_VIEWS = {
  'KPIs mensuales': {
    visible: [
      'periodo',
      'PresMen',
      'VentMenOtrIng',
      'venMenCer',
      'otrIngr',
      'cumplMenCeramica',
    ],
  },
  Acumulado: {
    visible: [
      'periodo',
      'venAcuOtros',
      'venAcuCer',
      'acuPres',
      'cumplOtrosIngrAcuvsAcumPres',
    ],
  },
  Diferencias: {
    visible: ['periodo', 'diffVe_OtrosvsPres', 'diffVen_CervsPres', 'meta'],
  },
  Todo: { visible: columns.map((c) => c.id) },
};

// ---------- Utilidades ----------
const getDefaultVisible = () =>
  Object.fromEntries(columns.map((c) => [c.id, true]));

const loadLS = (k, fallback) => {
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};
const saveLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

function buildCSV(headers, rows) {
  const escape = (v) => {
    const s = String(v ?? '');
    if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const r of rows) lines.push(r.map(escape).join(','));
  return lines.join('\n');
}

function download(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Alturas de filas de header
const HEADER_ROW1 = 40; // grupos
const HEADER_ROW2 = 40; // encabezados reales

export default function IngresoVentasTotales() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState(null);

  const [rows, setRows] = useState([]); // normalizados para tabla
  const [valorsTabla, setValoresTabla] = useState([]); // datos para gráfico
  const [valoresCump, setValoresCump] = useState([]);

  // modal crear/editar
  const [openModal, setOpenModal] = useState(false);
  const [periodoActual, setPeriodoActual] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null); // null = crear

  // ---------- Columnas: visibilidad + pineo ----------
  const defaultVisible = useMemo(
    () => ({ ...getDefaultVisible(), periodo: true }),
    []
  );
  const [visibleCols, setVisibleCols] = useState(() =>
    loadLS('ivt_visible_cols', defaultVisible)
  );
  useEffect(() => saveLS('ivt_visible_cols', visibleCols), [visibleCols]);

  const [pinnedLeft, setPinnedLeft] = useState(() =>
    loadLS('ivt_pinned_left', ['periodo'])
  );
  const [pinnedRight, setPinnedRight] = useState(() =>
    loadLS('ivt_pinned_right', [])
  );
  useEffect(() => saveLS('ivt_pinned_left', pinnedLeft), [pinnedLeft]);
  useEffect(() => saveLS('ivt_pinned_right', pinnedRight), [pinnedRight]);

  // Vistas guardadas
  const [customViews, setCustomViews] = useState(() => loadLS('ivt_views', {}));
  const [activeView, setActiveView] = useState('');
  useEffect(() => saveLS('ivt_views', customViews), [customViews]);

  const applyView = (name, preset = false) => {
    const conf = preset ? PRESET_VIEWS[name] : customViews[name];
    if (!conf) return;
    const vis = Object.fromEntries(columns.map((c) => [c.id, false]));
    for (const id of conf.visible) vis[id] = true;
    vis.periodo = true; // forzar
    setVisibleCols(vis);
    if (conf.pinnedLeft) setPinnedLeft(conf.pinnedLeft);
    if (conf.pinnedRight) setPinnedRight(conf.pinnedRight);
    setActiveView(name);
  };

  const deleteView = (name) => {
    setCustomViews((v) => {
      const n = { ...v };
      delete n[name];
      return n;
    });
    if (activeView === name) setActiveView('');
  };

  // Selector de columnas (menú)
  const [anchorCols, setAnchorCols] = useState(null);
  const openCols = Boolean(anchorCols);
  const handleOpenCols = (e) => setAnchorCols(e.currentTarget);
  const handleCloseCols = () => setAnchorCols(null);

  const toggleCol = (id) => {
    setVisibleCols((prev) => ({
      ...prev,
      [id]: id === 'periodo' ? true : !prev[id],
    }));
  };

  const setAllCols = (val) => {
    const next = Object.fromEntries(
      columns.map((c) => [c.id, c.id === 'periodo' ? true : val])
    );
    setVisibleCols(next);
  };

  const resetCols = () => setVisibleCols(defaultVisible);

  // Orden visible (estático según `columns`)
  const visibleOrdered = useMemo(
    () => columns.filter((c) => !!visibleCols[c.id]),
    [visibleCols]
  );

  // Offsets para pinned
  const leftOffsets = useMemo(() => {
    const off = {};
    let acc = 0;
    for (const id of pinnedLeft.filter((id) => visibleCols[id])) {
      off[id] = acc;
      acc += (colById[id]?.minWidth ?? 120) + 1; // +1 por borde
    }
    return off;
  }, [pinnedLeft, visibleCols]);

  const rightOffsets = useMemo(() => {
    const off = {};
    let acc = 120; // reservar espacio para Acciones (minWidth ~120)
    for (const id of [...pinnedRight].reverse()) {
      if (!visibleCols[id]) continue;
      off[id] = acc;
      acc += (colById[id]?.minWidth ?? 120) + 1;
    }
    return off;
  }, [pinnedRight, visibleCols]);

  const isPinnedLeft = (id) => pinnedLeft.includes(id);
  const isPinnedRight = (id) => pinnedRight.includes(id);

  const pinLeft = (id) =>
    setPinnedLeft((arr) => Array.from(new Set([...arr, id])));
  const unpinLeft = (id) => setPinnedLeft((arr) => arr.filter((x) => x !== id));
  const pinRight = (id) =>
    setPinnedRight((arr) => Array.from(new Set([...arr, id])));
  const unpinRight = (id) =>
    setPinnedRight((arr) => arr.filter((x) => x !== id));

  // ------------------- Cargar datos -------------------
  const loadUtilities = async (isReload = false) => {
    isReload ? setReloading(true) : setLoading(true);
    setError(null);
    try {
      const resp = await getAll();
      const normalizados = resp?.normalizados ?? [];
      const valores = resp?.valores ?? [];
      const ValCum = resp?.graficaCumplimiento ?? [];
      setValoresCump(ValCum);
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

  // ------------------- Búsqueda global (única) -------------------
  const normalize = (s) =>
    String(s ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();

  const rowMatchesQuery = (r, nq) => {
    if (!nq) return true;
    return columns.some((c) => {
      const v = r?.[c.id];
      const raw = normalize(v);
      const formatted = c.format ? normalize(c.format(v)) : '';
      return raw.includes(nq) || formatted.includes(nq);
    });
  };

  const filtered = useMemo(() => {
    const data = Array.isArray(rows) ? rows : [];
    const nq = normalize(query.trim());
    return data.filter((r) => rowMatchesQuery(r, nq));
  }, [query, rows]);

  useEffect(() => {
    setPage(0);
  }, [filtered.length]);

  const start = page * rowsPerPage;
  const sliced = useMemo(
    () => filtered.slice(start, start + rowsPerPage),
    [filtered, start, rowsPerPage]
  );

  // ------------------- Modal handlers -------------------
  const handleRegistrar = async () => {
    try {
      setSelectedRow(null);
      setOpenModal(true);
      const per = await getPeriodo();
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

  const handleEditar = (row) => {
    setSelectedRow(row);
    setOpenModal(true);
  };

  // ------------------- Densidad -------------------
  const [density, setDensity] = useState(() =>
    loadLS('ivt_density', 'compact')
  );
  useEffect(() => saveLS('ivt_density', density), [density]);
  const tableSize = density === 'compact' ? 'small' : 'medium';

  // ------------------- Export -------------------
  const getVisibleHeaderLabels = () => visibleOrdered.map((c) => c.label);
  const getVisibleRowsFormatted = (data) =>
    data.map((r) =>
      visibleOrdered.map((c) => (c.format ? c.format(r?.[c.id]) : r?.[c.id]))
    );

  const exportCSV = () => {
    const csv = buildCSV(
      getVisibleHeaderLabels(),
      getVisibleRowsFormatted(filtered)
    );
    download('ingresos_visibles.csv', csv, 'text/csv;charset=utf-8');
  };

  const exportXLSX = () => {
    const headers = getVisibleHeaderLabels();
    const body = getVisibleRowsFormatted(filtered);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ingresos');
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    download(
      'ingresos_visibles.xlsx',
      out,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  };

  // ------------------- Totales y promedios (sobre filtrados) -------------------
  const totalsAndAvg = useMemo(() => {
    const sums = {};
    const counts = {};
    for (const c of visibleOrdered) {
      if (c.type === 'number' || c.type === 'percent') {
        sums[c.id] = 0;
        counts[c.id] = 0;
      }
    }
    for (const r of filtered) {
      for (const c of visibleOrdered) {
        if (c.type === 'number' || c.type === 'percent') {
          const val = Number(r?.[c.id]);
          if (Number.isFinite(val)) {
            sums[c.id] += val;
            counts[c.id] += 1;
          }
        }
      }
    }
    const totals = Object.fromEntries(
      visibleOrdered.map((c) => [
        c.id,
        c.type === 'number'
          ? sums[c.id]
          : c.type === 'percent'
            ? sums[c.id] / (counts[c.id] || 1)
            : null,
      ])
    );
    const avgs = Object.fromEntries(
      visibleOrdered.map((c) => [
        c.id,
        c.type === 'number' || c.type === 'percent'
          ? sums[c.id] / (counts[c.id] || 1)
          : null,
      ])
    );
    return { totals, avgs };
  }, [filtered, visibleOrdered]);

  // ------------------- Estilos sticky -------------------
  const sxStickyBase = {
    position: 'sticky',
    bgcolor: 'background.paper',
    zIndex: 3,
  };
  const sxHeadTop1 = { top: 0, height: HEADER_ROW1, ...sxStickyBase };
  const sxLeftStickyHead = {
    ...sxStickyBase,
    left: 0,
    boxShadow: (t) => `2px 0 0 ${t.palette.divider} inset`,
    zIndex: 6,
  };
  const sxRightStickyHead = {
    ...sxStickyBase,
    right: 0,
    boxShadow: (t) => `-2px 0 0 ${t.palette.divider} inset`,
    zIndex: 6,
  };
  const sxLeftStickyCell = (id) => ({
    position: 'sticky',
    left: leftOffsets[id] ?? 0,
    bgcolor: 'background.paper',
    boxShadow: (t) => `2px 0 0 ${t.palette.divider} inset`,
    zIndex: 2,
  });
  const sxRightStickyCell = (id) => ({
    position: 'sticky',
    right: rightOffsets[id] ?? 0,
    bgcolor: 'background.paper',
    boxShadow: (t) => `-2px 0 0 ${t.palette.divider} inset`,
    zIndex: 2,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', position: 'relative' }}>
      <Stack spacing={3}>
        <Paper>
          <Toolbar sx={{ gap: 1, flexWrap: 'wrap', position: 'relative' }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              INGRESO POR VENTA TOTALES{' '}
              {activeView ? `— Vista: ${activeView}` : ''}
            </Typography>

            <Tooltip title="Aplicar vista / Columnas / Pinned">
              <Button
                size="small"
                variant="outlined"
                onClick={handleOpenCols}
                startIcon={<ViewColumnIcon />}
              >
                Vistas/Columnas
              </Button>
            </Tooltip>

            {/* Densidad */}
            <ToggleButtonGroup
              size="small"
              value={density}
              exclusive
              onChange={(_e, v) => v && setDensity(v)}
            >
              <ToggleButton value="compact">Compacta</ToggleButton>
              <ToggleButton value="normal">Normal</ToggleButton>
            </ToggleButtonGroup>

            {/* Export */}
            <Tooltip title="Exportar CSV">
              <IconButton size="small" onClick={exportCSV}>
                <FileDownloadOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Exportar XLSX">
              <Button
                size="small"
                variant="contained"
                onClick={exportXLSX}
                startIcon={<FileDownloadOutlinedIcon />}
              >
                XLSX
              </Button>
            </Tooltip>

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

          {error && (
            <Box sx={{ px: 2, py: 1, color: 'error.main' }}>{error}</Box>
          )}

          {/* Menú de Vistas + Columnas + Pin */}
          <Menu anchorEl={anchorCols} open={openCols} onClose={handleCloseCols}>
            <Box sx={{ p: 1.5, width: 380 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Aplicar vista
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: 'wrap', mb: 1 }}
              >
                {Object.keys(PRESET_VIEWS).map((name) => (
                  <Button
                    key={name}
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      applyView(name, true);
                      handleCloseCols();
                    }}
                  >
                    {name}
                  </Button>
                ))}
              </Stack>

              {Object.keys(customViews).length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>
                    Tus vistas
                  </Typography>
                  <Stack spacing={0.5}>
                    {Object.keys(customViews).map((name) => (
                      <Stack
                        direction="row"
                        alignItems="center"
                        key={name}
                        spacing={1}
                      >
                        <Button
                          size="small"
                          onClick={() => {
                            applyView(name, false);
                            handleCloseCols();
                          }}
                        >
                          {name}
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteView(name)}
                          title="Eliminar vista"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}

              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                Mostrar/ocultar columnas & anclar
              </Typography>
              <FormGroup>
                {columns.map((c) => (
                  <Stack
                    direction="row"
                    alignItems="center"
                    key={c.id}
                    sx={{ pr: 1 }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={!!visibleCols[c.id]}
                          onChange={() => toggleCol(c.id)}
                          disabled={c.id === 'periodo'}
                        />
                      }
                      label={c.label}
                      sx={{ flexGrow: 1 }}
                    />
                    <Tooltip
                      title={
                        isPinnedLeft(c.id)
                          ? 'Desanclar izquierda'
                          : 'Anclar a la izquierda'
                      }
                    >
                      <IconButton
                        size="small"
                        onClick={() =>
                          isPinnedLeft(c.id) ? unpinLeft(c.id) : pinLeft(c.id)
                        }
                      >
                        {isPinnedLeft(c.id) ? (
                          <PushPinIcon fontSize="small" />
                        ) : (
                          <PushPinOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        isPinnedRight(c.id)
                          ? 'Desanclar derecha'
                          : 'Anclar a la derecha'
                      }
                    >
                      <IconButton
                        size="small"
                        onClick={() =>
                          isPinnedRight(c.id)
                            ? unpinRight(c.id)
                            : pinRight(c.id)
                        }
                      >
                        {isPinnedRight(c.id) ? (
                          <PushPinIcon fontSize="small" />
                        ) : (
                          <PushPinOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </FormGroup>

              <Divider sx={{ my: 1 }} />
              <Stack direction="row" spacing={1} justifyContent="space-between">
                <Button size="small" onClick={() => setAllCols(true)}>
                  Todas
                </Button>
                <Button size="small" onClick={() => setAllCols(false)}>
                  Ninguna
                </Button>
                <Button size="small" onClick={resetCols}>
                  Restablecer
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleCloseCols}
                >
                  Cerrar
                </Button>
              </Stack>
            </Box>
          </Menu>

          <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
            <Table
              stickyHeader
              size={tableSize}
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
                {/* Fila 1: grupos dinámicos según columnas visibles */}
                <TableRow>
                  {visibleCols.periodo && (
                    <TableCell
                      sx={{
                        position: 'sticky',
                        top: 0,
                        left: 0,
                        bgcolor: 'background.paper',
                        boxShadow: (t) => `2px 0 0 ${t.palette.divider} inset`,
                        zIndex: 6,
                        height: HEADER_ROW1,
                        py: 0.5,
                      }}
                    >
                      Periodo
                    </TableCell>
                  )}
                  {GROUPS.map((g) => {
                    const count = visibleOrdered.filter(
                      (c) => c.group === g.id
                    ).length;
                    if (!count) return null;
                    return (
                      <TableCell
                        key={g.id}
                        align="center"
                        colSpan={count}
                        sx={{ ...sxHeadTop1, py: 0.5 }}
                      >
                        {g.label}
                      </TableCell>
                    );
                  })}
                  <TableCell
                    align="center"
                    colSpan={1}
                    sx={{ ...sxRightStickyHead, height: HEADER_ROW1, py: 0.5 }}
                  >
                    Acciones
                  </TableCell>
                </TableRow>

                {/* Fila 2: encabezados reales */}
                <TableRow>
                  {visibleOrdered.map((col, idx) => (
                    <TableCell
                      key={col.id}
                      align={col.align}
                      sx={{
                        position: 'sticky',
                        top: HEADER_ROW1,
                        bgcolor: 'background.paper',
                        zIndex: 6,
                        minWidth: col.minWidth,
                        ...(idx === 0 ? sxLeftStickyHead : {}),
                      }}
                    >
                      {col.label}
                    </TableCell>
                  ))}
                  <TableCell
                    align="center"
                    sx={{
                      position: 'sticky',
                      top: HEADER_ROW1,
                      right: 0,
                      bgcolor: 'background.paper',
                      zIndex: 6,
                      minWidth: 120,
                    }}
                  >
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {sliced.map((r, ridx) => (
                  <TableRow
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={r?.id ?? `${r?.periodo ?? 'row'}-${ridx}`}
                  >
                    {visibleOrdered.map((col) => {
                      const val = r?.[col.id];
                      const pinnedLeftSx = isPinnedLeft(col.id)
                        ? sxLeftStickyCell(col.id)
                        : null;
                      const pinnedRightSx = isPinnedRight(col.id)
                        ? sxRightStickyCell(col.id)
                        : null;
                      return (
                        <TableCell
                          key={col.id}
                          align={col.align}
                          sx={{
                            ...(pinnedLeftSx || {}),
                            ...(pinnedRightSx || {}),
                          }}
                        >
                          {col.format ? col.format(val) : val}
                        </TableCell>
                      );
                    })}
                    <TableCell
                      align="center"
                      sx={{
                        position: 'sticky',
                        right: 0,
                        bgcolor: 'background.paper',
                        boxShadow: (t) => `-2px 0 0 ${t.palette.divider} inset`,
                        zIndex: 2,
                      }}
                    >
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
                    <TableCell
                      colSpan={visibleOrdered.length + 1}
                      align="center"
                    >
                      {query
                        ? 'Sin resultados para tu búsqueda.'
                        : 'No hay utilidades registradas.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              {/* Footer con Totales y Promedios */}
              <TableFooter>
                <TableRow>
                  {visibleOrdered.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.align}
                      sx={{ fontWeight: 700 }}
                    >
                      {col.type === 'number'
                        ? formatNumber(totalsAndAvg.totals[col.id])
                        : col.type === 'percent'
                          ? formatPercent(totalsAndAvg.totals[col.id])
                          : ''}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Totales
                  </TableCell>
                </TableRow>
                <TableRow>
                  {visibleOrdered.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.align}
                      sx={{ fontStyle: 'italic' }}
                    >
                      {col.type === 'number'
                        ? formatNumber(totalsAndAvg.avgs[col.id])
                        : col.type === 'percent'
                          ? formatPercent(totalsAndAvg.avgs[col.id])
                          : ''}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontStyle: 'italic' }}>
                    Promedios
                  </TableCell>
                </TableRow>
              </TableFooter>
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

          {/* Modal crear/editar */}
          <IngresoVentaTotalModal
            open={openModal}
            onClose={() => setOpenModal(false)}
            onSuccess={() => loadUtilities(true)}
            initialValues={selectedRow}
            periodoActual={periodoActual}
            createFn={CreateObje}
            updateFn={UpdateObje}
            editablePeriodo={false}
            idKey="id"
          />
        </Paper>

        {/* Gráficos */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <IngresoTotalECharts rows={valorsTabla} />
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <CumplimientoECharts rows={valoresCump} metaDefault={90} />
        </Paper>
      </Stack>
    </Paper>
  );
}
