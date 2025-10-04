// components/ReusableKpiTable.jsx
// Componente genérico para reutilizar tu página de tabla KPI con MUI
// Permite:
//  - Enviar GROUPS y columns
//  - Usar servicios (getAll, getPeriodo, create/update) o datos externos (data)
//  - Pasar callbacks onRegister/onEditRow y un EditDialog opcional
//  - Exportar CSV/XLSX, búsqueda global, vistas/pinned, densidad, totales/promedios, paginación

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
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';

import * as XLSX from 'xlsx';

// ------------------- Helpers -------------------
const HEADER_ROW1 = 40; // grupos
const HEADER_ROW2 = 40; // encabezados reales

const defaultFormat = (v) => String(v ?? '');
const defaultFormatPercent = (v) =>
  typeof v === 'number' ? `${(v * 100).toFixed(2)}%` : '';

const buildCSV = (headers, rows) => {
  const escape = (val) => {
    const s = String(val ?? '');
    if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const r of rows) lines.push(r.map(escape).join(','));
  return lines.join('\n');
};

const download = (filename, content, mime = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const normalize = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

// ------------------- Componente -------------------
export default function ReusableKpiTable({
  // Título y llaves LS
  title = 'Tabla KPI',
  lsKeyPrefix = 'kpi_table',

  // Estructura de columnas y grupos
  groups = [], // [{ id, label }]
  columns = [], // [{ id, label, minWidth, align, type: 'number'|'percent'|'date'|'text', format, group }]

  // Vistas predefinidas (por nombre)
  presetViews = {}, // { "KPIs": { visible: ['col1', 'col2'], pinnedLeft?:[], pinnedRight?:[] }, ... }

  // Servicios (modo 1: el propio componente carga datos)
  services, // { getAll: () => Promise<{ normalizados: any[] }| any[]>, getPeriodo?: () => Promise<string|{periodo:string}>, create?: fn, update?: fn }

  // Datos externos (modo 2: el padre pasa data ya cargada)
  data, // array de filas ya normalizadas

  // Callbacks de acciones
  onRegister, // () => void | Promise<void>
  onEditRow, // (row) => void | Promise<void>

  // Componente de edición opcional (modal), si se prefiere controlar aquí
  EditDialog, // ({ open, onClose, selectedRow, periodoActual, onSuccess }) => JSX

  // Opciones UI
  rowsPerPageOptions = [10, 12],
  defaultRowsPerPage = 10,
  initialDensity = 'compact', // 'compact' | 'normal'
}) {
  // Map rápido de columnas
  const colById = useMemo(
    () => Object.fromEntries(columns.map((c) => [c.id, c])),
    [columns]
  );

  const getDefaultVisible = () =>
    Object.fromEntries(columns.map((c) => [c.id, true]));

  const loadLS = (k, fallback) => {
    try {
      const raw = localStorage.getItem(`${lsKeyPrefix}_${k}`);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  };
  const saveLS = (k, v) =>
    localStorage.setItem(`${lsKeyPrefix}_${k}`, JSON.stringify(v));

  // ------------------- Estado principal -------------------
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  const [loading, setLoading] = useState(!Array.isArray(data));
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState(null);

  const [rows, setRows] = useState(() => (Array.isArray(data) ? data : []));

  // Modal interno (si EditDialog está presente)
  const [openModal, setOpenModal] = useState(false);
  const [periodoActual, setPeriodoActual] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null); // null = crear

  // ---------- Columnas: visibilidad + pineo ----------
  const defaultVisible = useMemo(
    () => ({ ...getDefaultVisible(), [columns[0]?.id]: true }),
    [columns]
  );
  const [visibleCols, setVisibleCols] = useState(() =>
    loadLS('visible_cols', defaultVisible)
  );
  useEffect(() => saveLS('visible_cols', visibleCols), [visibleCols]);

  const [pinnedLeft, setPinnedLeft] = useState(() =>
    loadLS('pinned_left', [columns[0]?.id].filter(Boolean))
  );
  const [pinnedRight, setPinnedRight] = useState(() =>
    loadLS('pinned_right', [])
  );
  useEffect(() => saveLS('pinned_left', pinnedLeft), [pinnedLeft]);
  useEffect(() => saveLS('pinned_right', pinnedRight), [pinnedRight]);

  const [customViews, setCustomViews] = useState(() => loadLS('views', {}));
  const [activeView, setActiveView] = useState('');
  useEffect(() => saveLS('views', customViews), [customViews]);

  const applyView = (name, preset = false) => {
    const conf = preset ? presetViews[name] : customViews[name];
    if (!conf) return;
    const vis = Object.fromEntries(columns.map((c) => [c.id, false]));
    for (const id of conf.visible) if (vis.hasOwnProperty(id)) vis[id] = true;
    // Forzar que la primera columna (generalmente "periodo") esté visible
    if (columns[0]?.id) vis[columns[0].id] = true;
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
      [id]: id === columns[0]?.id ? true : !prev[id],
    }));
  };

  const setAllCols = (val) => {
    const next = Object.fromEntries(
      columns.map((c) => [c.id, c.id === columns[0]?.id ? true : val])
    );
    setVisibleCols(next);
  };

  const resetCols = () => setVisibleCols(defaultVisible);

  // Orden visible (según `columns`)
  const visibleOrdered = useMemo(
    () => columns.filter((c) => !!visibleCols[c.id]),
    [columns, visibleCols]
  );

  // Offsets para pinned
  const leftOffsets = useMemo(() => {
    const off = {};
    let acc = 0;
    for (const id of pinnedLeft.filter((id) => visibleCols[id])) {
      off[id] = acc;
      acc += (colById[id]?.minWidth ?? 120) + 1;
    }
    return off;
  }, [pinnedLeft, visibleCols, colById]);

  const rightOffsets = useMemo(() => {
    const off = {};
    let acc = 120; // espacio Acciones
    for (const id of [...pinnedRight].reverse()) {
      if (!visibleCols[id]) continue;
      off[id] = acc;
      acc += (colById[id]?.minWidth ?? 120) + 1;
    }
    return off;
  }, [pinnedRight, visibleCols, colById]);

  const isPinnedLeft = (id) => pinnedLeft.includes(id);
  const isPinnedRight = (id) => pinnedRight.includes(id);
  const pinLeft = (id) =>
    setPinnedLeft((arr) => Array.from(new Set([...arr, id])));
  const unpinLeft = (id) => setPinnedLeft((arr) => arr.filter((x) => x !== id));
  const pinRight = (id) =>
    setPinnedRight((arr) => Array.from(new Set([...arr, id])));
  const unpinRight = (id) =>
    setPinnedRight((arr) => arr.filter((x) => x !== id));

  // ------------------- Cargar datos (si services) -------------------
  const loadAll = async (isReload = false) => {
    if (!services?.getAll) return; // modo data-controlado
    isReload ? setReloading(true) : setLoading(true);
    setError(null);
    try {
      const resp = await services.getAll();
      const list = Array.isArray(resp) ? resp : (resp?.normalizados ?? []);
      setRows(list);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la lista');
      setRows([]);
    } finally {
      isReload ? setReloading(false) : setLoading(false);
    }
  };

  useEffect(() => {
    if (!Array.isArray(data)) loadAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si cambian los datos externos, actualiza
  useEffect(() => {
    if (Array.isArray(data)) setRows(data);
  }, [data]);

  // ------------------- Búsqueda global -------------------
  const rowMatchesQuery = (r, nq) => {
    if (!nq) return true;
    return columns.some((c) => {
      const v = r?.[c.id];
      const raw = normalize(v);
      const format = c.format || defaultFormat;
      const formatted = normalize(format(v));
      return raw.includes(nq) || formatted.includes(nq);
    });
  };

  const filtered = useMemo(() => {
    const dataArr = Array.isArray(rows) ? rows : [];
    const nq = normalize(query.trim());
    return dataArr.filter((r) => rowMatchesQuery(r, nq));
  }, [query, rows, columns]);

  useEffect(() => setPage(0), [filtered.length]);

  const start = page * rowsPerPage;
  const sliced = useMemo(
    () => filtered.slice(start, start + rowsPerPage),
    [filtered, start, rowsPerPage]
  );

  // ------------------- Densidad -------------------
  const [density, setDensity] = useState(() =>
    loadLS('density', initialDensity)
  );
  useEffect(() => saveLS('density', density), [density]);
  const tableSize = density === 'compact' ? 'small' : 'medium';

  // ------------------- Export -------------------
  const getVisibleHeaderLabels = () => visibleOrdered.map((c) => c.label);
  const getVisibleRowsFormatted = (dataRows) =>
    dataRows.map((r) =>
      visibleOrdered.map((c) => (c.format ? c.format(r?.[c.id]) : r?.[c.id]))
    );

  const exportCSV = () => {
    const csv = buildCSV(
      getVisibleHeaderLabels(),
      getVisibleRowsFormatted(filtered)
    );
    download(
      `${title.replace(/\s+/g, '_').toLowerCase()}_visibles.csv`,
      csv,
      'text/csv;charset=utf-8'
    );
  };

  const exportXLSX = () => {
    const headers = getVisibleHeaderLabels();
    const body = getVisibleRowsFormatted(filtered);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    download(
      `${title.replace(/\s+/g, '_').toLowerCase()}_visibles.xlsx`,
      out,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  };

  // ------------------- Totales y promedios -------------------
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

  // ------------------- Acciones (Registrar/Editar) -------------------
  const handleRegistrar = async () => {
    if (onRegister) return onRegister();
    if (!EditDialog) return; // no hay nada que abrir
    try {
      setSelectedRow(null);
      setOpenModal(true);
      if (services?.getPeriodo) {
        const per = await services.getPeriodo();
        const p =
          typeof per === 'string'
            ? per
            : typeof per?.periodo === 'string'
              ? per.periodo
              : null;
        setPeriodoActual(p);
      } else {
        setPeriodoActual(null);
      }
    } catch (err) {
      console.log(err);
      setPeriodoActual(null);
    }
  };

  const handleEditar = (row) => {
    if (onEditRow) return onEditRow(row);
    if (!EditDialog) return;
    setSelectedRow(row);
    setOpenModal(true);
    console.log(row);
  };

  // -------------- Render --------------
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
              {title} {activeView ? `— Vista: ${activeView}` : ''}
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

            <ToggleButtonGroup
              size="small"
              value={density}
              exclusive
              onChange={(_e, v) => v && setDensity(v)}
            >
              <ToggleButton value="compact">Compacta</ToggleButton>
              <ToggleButton value="normal">Normal</ToggleButton>
            </ToggleButtonGroup>

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

            {(onRegister || EditDialog) && (
              <Button
                size="small"
                variant="contained"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleRegistrar}
                disabled={loading || reloading}
              >
                Registrar
              </Button>
            )}

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

          {/* Menú Vistas/Columnas/Pin */}
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
                {Object.keys(presetViews).map((name) => (
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
                {columns.map((c, idx) => (
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
                          disabled={idx === 0}
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
              aria-label="tabla kpi"
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
                  {visibleCols[columns[0]?.id] && (
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
                      {columns[0]?.label}
                    </TableCell>
                  )}
                  {groups.map((g) => {
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
                  {(onEditRow || EditDialog) && (
                    <TableCell
                      align="center"
                      colSpan={1}
                      sx={{
                        ...sxRightStickyHead,
                        height: HEADER_ROW1,
                        py: 0.5,
                      }}
                    >
                      Acciones
                    </TableCell>
                  )}
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
                  {(onEditRow || EditDialog) && (
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
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {sliced.map((r, ridx) => (
                  <TableRow
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={r?.id ?? `${r?.[columns[0]?.id] ?? 'row'}-${ridx}`}
                  >
                    {visibleOrdered.map((col) => {
                      const val = r?.[col.id];
                      const pinnedLeftSx = isPinnedLeft(col.id)
                        ? sxLeftStickyCell(col.id)
                        : null;
                      const pinnedRightSx = isPinnedRight(col.id)
                        ? sxRightStickyCell(col.id)
                        : null;
                      const fmt =
                        col.format ||
                        (col.type === 'percent'
                          ? defaultFormatPercent
                          : defaultFormat);
                      return (
                        <TableCell
                          key={col.id}
                          align={col.align}
                          sx={{
                            ...(pinnedLeftSx || {}),
                            ...(pinnedRightSx || {}),
                          }}
                        >
                          {fmt(val)}
                        </TableCell>
                      );
                    })}
                    {(onEditRow || EditDialog) && (
                      <TableCell
                        align="center"
                        sx={{
                          position: 'sticky',
                          right: 0,
                          bgcolor: 'background.paper',
                          boxShadow: (t) =>
                            `-2px 0 0 ${t.palette.divider} inset`,
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
                    )}
                  </TableRow>
                ))}

                {!error && filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={
                        visibleOrdered.length +
                        (onEditRow || EditDialog ? 1 : 0)
                      }
                      align="center"
                    >
                      {query
                        ? 'Sin resultados para tu búsqueda.'
                        : 'No hay registros.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <TableFooter>
                <TableRow>
                  {visibleOrdered.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.align}
                      sx={{ fontWeight: 700 }}
                    >
                      {col.type === 'number'
                        ? col.format
                          ? col.format(totalsAndAvg.totals[col.id])
                          : totalsAndAvg.totals[col.id]
                        : col.type === 'percent'
                          ? col.format
                            ? col.format(totalsAndAvg.totals[col.id])
                            : defaultFormatPercent(totalsAndAvg.totals[col.id])
                          : ''}
                    </TableCell>
                  ))}
                  {(onEditRow || EditDialog) && (
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Totales
                    </TableCell>
                  )}
                </TableRow>
                <TableRow>
                  {visibleOrdered.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.align}
                      sx={{ fontStyle: 'italic' }}
                    >
                      {col.type === 'number'
                        ? col.format
                          ? col.format(totalsAndAvg.avgs[col.id])
                          : totalsAndAvg.avgs[col.id]
                        : col.type === 'percent'
                          ? col.format
                            ? col.format(totalsAndAvg.avgs[col.id])
                            : defaultFormatPercent(totalsAndAvg.avgs[col.id])
                          : ''}
                    </TableCell>
                  ))}
                  {(onEditRow || EditDialog) && (
                    <TableCell align="center" sx={{ fontStyle: 'italic' }}>
                      Promedios
                    </TableCell>
                  )}
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
            rowsPerPageOptions={rowsPerPageOptions}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
          />
        </Paper>
      </Stack>

      {EditDialog && (
        <EditDialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          initialValues={selectedRow}
          periodoActual={periodoActual}
          createFn={services?.create}
          updateFn={services?.update}
          onSuccess={async () => {
            setOpenModal(false);
            await loadAll(true);
          }}
          editablePeriodo={false}
          idKey="id"
        />
      )}
    </Paper>
  );
}

// -------------------------------------------------------------
// Ejemplos de uso
// -------------------------------------------------------------

// 1) MODO SERVICIOS (igual a tu página actual, pero usando el componente genérico)
//    - Le pasas groups, columns, presetViews y los servicios getAll/getPeriodo
//    - Usas tu IngresoVentaTotalModal como EditDialog

/*
import IngresoVentaTotalModal from '../components/IngresoVentaTotal/IngresoVentaTotalModal.jsx';
import { getAll, CreateObje, UpdateObje } from '../service/IngresoVentaTotal.js';
import { formatMonthYear, formatPercent, formatNumber } from '../lib/convert.js';

const GROUPS = [
  { id: 'mensuales', label: 'Ingresos mensuales' },
  { id: 'acumulado', label: 'Acumulado' },
  { id: 'diferencias', label: 'Diferencias' },
  { id: 'cumpl', label: 'Cumplimiento (%)' },
];

const columns = [
  { id: 'periodo', label: 'Periodo', minWidth: 80, format: formatMonthYear, group: null, type: 'date' },
  { id: 'PresMen', label: 'Presupuesto Mensual', minWidth: 100, align: 'right', format: formatNumber, group: 'mensuales', type: 'number' },
  { id: 'VentMenOtrIng', label: 'Venta Men. con otros Ingresos', minWidth: 160, align: 'right', format: formatNumber, group: 'mensuales', type: 'number' },
  { id: 'venMenCer', label: 'Venta Men. Cerámica', minWidth: 150, align: 'right', format: formatNumber, group: 'mensuales', type: 'number' },
  { id: 'otrIngr', label: 'Otros Ingresos', minWidth: 120, align: 'right', format: formatNumber, group: 'mensuales', type: 'number' },
  { id: 'venAcuOtros', label: 'Venta Acumulado Otros', minWidth: 160, align: 'right', format: formatNumber, group: 'acumulado', type: 'number' },
  { id: 'venAcuCer', label: 'Venta Acum. Cerámica', minWidth: 160, align: 'right', format: formatNumber, group: 'acumulado', type: 'number' },
  { id: 'acuPres', label: 'Acum. Presupuesto', minWidth: 140, align: 'right', format: formatNumber, group: 'acumulado', type: 'number' },
  { id: 'diffVe_OtrosvsPres', label: 'Diff Ventas otros vs Presupuesto', minWidth: 180, align: 'right', format: formatNumber, group: 'diferencias', type: 'number' },
  { id: 'diffVen_CervsPres', label: 'Diff Venta cerámica vs Presupuesto', minWidth: 180, align: 'right', format: formatNumber, group: 'diferencias', type: 'number' },
  { id: 'meta', label: 'Meta', minWidth: 80, align: 'right', format: formatPercent, group: 'cumpl', type: 'percent' },
  { id: 'cumplMenCeramica', label: 'Cumpl. Mensual Cerámica', minWidth: 170, align: 'right', format: formatPercent, group: 'cumpl', type: 'percent' },
  { id: 'cumplOtrosIngrAcuvsAcumPres', label: 'Cumpl. Otros Ingresos Acum. vs Acum. Presupuesto', minWidth: 220, align: 'right', format: formatPercent, group: 'cumpl', type: 'percent' },
];

const PRESET_VIEWS = {
  'KPIs mensuales': { visible: ['periodo','PresMen','VentMenOtrIng','venMenCer','otrIngr','cumplMenCeramica'] },
  Acumulado: { visible: ['periodo','venAcuOtros','venAcuCer','acuPres','cumplOtrosIngrAcuvsAcumPres'] },
  Diferencias: { visible: ['periodo','diffVe_OtrosvsPres','diffVen_CervsPres','meta'] },
  Todo: { visible: columns.map((c) => c.id) },
};

export function IngresoVentasTotalesPage() {
  return (
    <ReusableKpiTable
      title="INGRESO POR VENTA TOTALES"
      lsKeyPrefix="ivt"
      groups={GROUPS}
      columns={columns}
      presetViews={PRESET_VIEWS}
      services={{
        getAll,
        getPeriodo: async () => (await import('../service/libs.js')).getPeriodo(),
        create: CreateObje,
        update: UpdateObje,
      }}
      EditDialog={IngresoVentaTotalModal}
    />
  );
}
*/

// 2) MODO DATOS EXTERNOS + FUNCIONES (útil para abrir desde un popup y reutilizar)
//    - Le pasas los datos ya cargados (data) y un onRegister / onEditRow
//    - Perfecto para usar el componente dentro de un Dialog de otro módulo

/*
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

export function KPITableInDialog({ open, onClose, data, onRegister, onEditRow }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>KPIs — Vista rápida</DialogTitle>
      <DialogContent dividers>
        <ReusableKpiTable
          title="KPIs"
          lsKeyPrefix="kpi_dialog"
          groups={GROUPS}
          columns={columns}
          presetViews={PRESET_VIEWS}
          data={data}
          onRegister={onRegister}
          onEditRow={onEditRow}
          rowsPerPageOptions={[8, 12, 24]}
        />
      </DialogContent>
    </Dialog>
  );
}
*/
