// ReusableKpiTableMRT.jsx
// Misma idea que tu ReusableKpiTable pero con MUCHO menos código
// Usa Material React Table (MRT) para resolver visibilidad, pinning, density, búsqueda, paginación, etc.
// - Column groups (encabezados agrupados) con columnas anidadas
// - Vistas/pinning/visibilidad persistidas en localStorage
// - Export CSV/XLSX de columnas visibles
// - Acciones: Registrar / Editar / Cambiar Meta

// Requisitos:
// npm i material-react-table @tanstack/react-table xlsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import * as XLSX from 'xlsx';

// ------------------- Helpers -------------------
const lsGet = (k, fb) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fb;
  } catch {
    return fb;
  }
};
const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const defaultFormat = (v) => (v ?? '') + '';
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

// Convierte tu definición de columnas + groups a columnas MRT (anidadas → encabezados agrupados)
function toMrtColumns({ columns, groups }) {
  // mapa groupId -> { header, columns: [] }
  const groupMap = Object.fromEntries(
    (groups || []).map((g) => [
      g.id,
      {
        header: g.label,
        columns: [],
        muiTableHeadCellProps: {
          sx: { whiteSpace: 'normal', lineHeight: 1.1 },
        },
      },
    ])
  );

  const base = []; // columnas sin grupo

  for (const c of columns) {
    const colDef = {
      accessorKey: c.id,
      header: c.label,
      size: c.minWidth || 120,
      enableHiding: true,
      // alineaciones
      muiTableHeadCellProps: { align: c.align },
      muiTableBodyCellProps: {
        align: c.align,
        sx: { fontVariantNumeric: 'tabular-nums' },
      },
      // formato
      Cell: ({ cell }) => {
        const v = cell.getValue();
        if (c.format) return c.format(v);
        if (c.type === 'percent') return defaultFormatPercent(v);
        return defaultFormat(v);
      },
      // para ordenar correctamente números
      sortingFn:
        c.type === 'number' || c.type === 'percent' ? 'basic' : 'alphanumeric',
    };

    if (c.group && groupMap[c.group]) groupMap[c.group].columns.push(colDef);
    else base.push(colDef);
  }

  // Ensambla: primero columnas base, luego grupos con columnas
  return [
    ...base,
    ...Object.values(groupMap).filter((g) => g.columns.length > 0),
  ];
}

// Totales/Promedios de las columnas visibles actualmente
function computeTotalsAndAverages({ table }) {
  const cols = table.getVisibleLeafColumns();
  const rows = table.getRowModel().rows;
  const totals = new Map();
  const counts = new Map();
  for (const col of cols) {
    totals.set(col.id, 0);
    counts.set(col.id, 0);
  }
  rows.forEach((r) => {
    cols.forEach((c) => {
      const v = r.getValue(c.id);
      const n = Number(v);
      if (Number.isFinite(n)) {
        totals.set(c.id, totals.get(c.id) + n);
        counts.set(c.id, counts.get(c.id) + 1);
      }
    });
  });
  const avgs = new Map();
  cols.forEach((c) => {
    const count = counts.get(c.id) || 1;
    avgs.set(c.id, totals.get(c.id) / count);
  });
  return { totals, avgs };
}

// Export helpers para columnas visibles
function exportVisibleCSV({ table, filename = 'tabla.csv' }) {
  const cols = table.getVisibleLeafColumns();
  const headers = cols.map((c) => c.columnDef.header);
  const dataRows = table
    .getRowModel()
    .rows.map((r) => cols.map((c) => r.getValue(c.id)));
  const csv = buildCSV(headers, dataRows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportVisibleXLSX({ table, filename = 'tabla.xlsx' }) {
  const cols = table.getVisibleLeafColumns();
  const headers = cols.map((c) => c.columnDef.header);
  const dataRows = table
    .getRowModel()
    .rows.map((r) => cols.map((c) => r.getValue(c.id)));
  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ------------------- Componente -------------------
export default function ReusableKpiTableMRT({
  // Título y llave para LS
  title = 'Tabla KPI',
  lsKeyPrefix = 'kpi_mrt',

  // Estructura
  groups = [], // [{ id, label }]
  columns = [], // [{ id, label, minWidth, align, type, format, group }]

  // Vistas predefinidas
  presetViews = {}, // { name: { visible:[ids], pinnedLeft?:[], pinnedRight?:[] } }

  // Modo servicios (carga interna)
  services, // { getAll, create, update, getPeriodo? }

  // Modo datos externos
  data,

  // Callbacks externos
  onRegister,
  onEditRow,
  onChangeMeta,

  // Edit dialog opcional
  EditDialog,
}) {
  const [rows, setRows] = useState(() => (Array.isArray(data) ? data : []));
  const [loading, setLoading] = useState(!Array.isArray(data));
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [periodoActual, setPeriodoActual] = useState(null);

  // Estado persistido (visibilidad, pinning, density)
  const [columnVisibility, setColumnVisibility] = useState(() =>
    lsGet(`${lsKeyPrefix}_colVis`, {})
  );
  const [columnPinning, setColumnPinning] = useState(() =>
    lsGet(`${lsKeyPrefix}_pin`, {
      left: [columns[0]?.id].filter(Boolean),
      right: [],
    })
  );
  const [density, setDensity] = useState(() =>
    lsGet(`${lsKeyPrefix}_density`, 'compact')
  );

  useEffect(
    () => lsSet(`${lsKeyPrefix}_colVis`, columnVisibility),
    [columnVisibility]
  );
  useEffect(() => lsSet(`${lsKeyPrefix}_pin`, columnPinning), [columnPinning]);
  useEffect(() => lsSet(`${lsKeyPrefix}_density`, density), [density]);

  // Cargar desde servicios si aplica
  const loadAll = async () => {
    if (!services?.getAll) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await services.getAll();
      const list = Array.isArray(resp) ? resp : resp?.normalizados || [];
      setRows(list);
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar la lista');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!Array.isArray(data)) loadAll();
  }, []);
  useEffect(() => {
    if (Array.isArray(data)) setRows(data);
  }, [data]);

  // Mapea a columnas MRT (con encabezados agrupados)
  const mrtColumns = useMemo(
    () => toMrtColumns({ columns, groups }),
    [columns, groups]
  );

  // Toolbar: vistas (presets)
  const [anchorEl, setAnchorEl] = useState(null);
  const openViews = Boolean(anchorEl);

  const applyView = (name) => {
    const conf = presetViews[name];
    if (!conf) return;
    // visibilidad
    const vis = {};
    columns.forEach((c) => (vis[c.id] = conf.visible?.includes(c.id)));
    // siempre muestra la primera columna
    if (columns[0]?.id) vis[columns[0].id] = true;
    setColumnVisibility(vis);
    // pinning
    setColumnPinning({
      left: conf.pinnedLeft || [columns[0]?.id].filter(Boolean),
      right: conf.pinnedRight || [],
    });
    setAnchorEl(null);
  };

  // Acciones
  const handleRegistrar = async () => {
    if (onRegister) return onRegister();
    if (!EditDialog) return;
    try {
      setSelectedRow(null);
      if (services?.getPeriodo) {
        const per = await services.getPeriodo();
        const p = typeof per === 'string' ? per : (per?.periodo ?? null);
        setPeriodoActual(p);
      } else {
        setPeriodoActual(null);
      }
      setOpenModal(true);
    } catch (e) {
      console.error(e);
      setPeriodoActual(null);
      setOpenModal(true);
    }
  };

  const handleEditar = (row) => {
    if (onEditRow) return onEditRow(row);
    if (!EditDialog) return;
    setSelectedRow(row);
    setOpenModal(true);
  };

  // Instancia MRT
  const table = useMaterialReactTable({
    columns: mrtColumns,
    data: rows,
    enableColumnActions: false,
    enableSorting: false,
    enableColumnDragging: false,
    enableColumnOrdering: false,

    enableColumnResizing: true,
    enableColumnPinning: true,
    enableStickyHeader: true,
    enableStickyFooter: true,

    enableDensityToggle: true,
    enableHiding: true,
    enableFullScreenToggle: true,
    enableGlobalFilter: true,
    defaultColumn: {
      minSize: 160,
      size: 240, // ancho base mayor para mostrar títulos largos
      maxSize: 600,
    },

    // Estados controlados
    state: {
      showProgressBars: loading,
      columnVisibility,
      columnPinning,
      density,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onDensityChange: setDensity,

    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
      showGlobalFilter: true,
      density: density,
    },
    paginationDisplayMode: 'pages',

    // Acciones por fila (Editar)
    renderRowActions: ({ row }) => (
      <IconButton size="small" onClick={() => handleEditar(row.original)}>
        <EditIcon fontSize="small" />
      </IconButton>
    ),

    // Toolbar superior personalizada
    renderTopToolbarCustomActions: ({ table }) => (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 1 }}>
        {/* Registrar */}
        {(onRegister || EditDialog) && (
          <Button
            size="small"
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleRegistrar}
          >
            Registrar
          </Button>
        )}
        {onChangeMeta && (
          <Button size="small" variant="contained" onClick={onChangeMeta}>
            Cambiar Meta
          </Button>
        )}
        {/* Vistas */}
        {Object.keys(presetViews || {}).length > 0 && (
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ViewColumnIcon />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              Vistas
            </Button>
            <Menu
              open={openViews}
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
            >
              {Object.keys(presetViews).map((name) => (
                <MenuItem key={name} onClick={() => applyView(name)}>
                  {name}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
        {/* Export */}
        <Button
          size="small"
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={() =>
            exportVisibleCSV({
              table,
              filename: `${title.replace(/\s+/g, '_').toLowerCase()}_visibles.csv`,
            })
          }
        >
          CSV
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={() =>
            exportVisibleXLSX({
              table,
              filename: `${title.replace(/\s+/g, '_').toLowerCase()}_visibles.xlsx`,
            })
          }
        >
          XLSX
        </Button>
      </Stack>
    ),

    // Toolbar de búsqueda afinada
    muiSearchTextFieldProps: {
      placeholder: 'Buscar…',
      InputProps: {
        startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
        endAdornment: (
          <IconButton size="small">
            <ClearIcon fontSize="small" />
          </IconButton>
        ),
      },
    },

    // Footer inferior para Totales/Promedios simples (por columnas visibles)
    renderBottomToolbarCustomActions: ({ table }) => {
      const { totals, avgs } = computeTotalsAndAverages({ table });
      const cols = table.getVisibleLeafColumns();
      if (!cols.length) return null;
      return (
        <Box sx={{ px: 2, py: 1, width: '100%', overflowX: 'auto' }}>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Totales
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
            {cols.map((c) => (
              <Box key={`t-${c.id}`} sx={{ minWidth: 120 }}>
                <Typography variant="caption" color="text.secondary">
                  {c.columnDef.header}
                </Typography>
                <Typography variant="body2">
                  {String(totals.get(c.id) ?? '')}
                </Typography>
              </Box>
            ))}
          </Stack>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, mt: 1, display: 'block' }}
          >
            Promedios
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
            {cols.map((c) => (
              <Box key={`a-${c.id}`} sx={{ minWidth: 120 }}>
                <Typography variant="caption" color="text.secondary">
                  {c.columnDef.header}
                </Typography>
                <Typography variant="body2">
                  {String(avgs.get(c.id) ?? '')}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      );
    },

    // Estética base similar a tu tabla (líneas y fondo blanco)
    muiTableProps: {
      sx: {
        '& .MuiTableCell-root': {
          borderRight: '1px solid',
          borderColor: 'divider',
        },
        '& .MuiTableCell-root:last-of-type': {
          borderRight: 'none',
        },
      },
    },
  });

  return (
    <Box sx={{ position: 'relative' }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <MaterialReactTable table={table} />

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
            await loadAll();
          }}
          editablePeriodo={false}
          idKey="id"
        />
      )}

      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

/* -------------------------------------------------------------
USO (ejemplo)
-------------------------------------------------------------

// import ReusableKpiTableMRT from './ReusableKpiTableMRT';
// import { formatMonthYear, formatPercent, formatNumber } from '../lib/convert';

// const GROUPS = [
//   { id: 'mensuales', label: 'Ingresos mensuales' },
//   { id: 'acumulado', label: 'Acumulado' },
//   { id: 'diferencias', label: 'Diferencias' },
//   { id: 'cumpl', label: 'Cumplimiento (%)' },
// ];
// const columns = [
//   { id: 'periodo', label: 'Periodo', minWidth: 80, format: formatMonthYear, type: 'date' },
//   { id: 'PresMen', label: 'Presupuesto Mensual', minWidth: 100, align: 'right', format: formatNumber, group: 'mensuales', type: 'number' },
//   { id: 'VentMenOtrIng', label: 'Venta Men. con otros Ingresos', minWidth: 160, align: 'right', format: formatNumber, group: 'mensuales', type: 'number' },
//   { id: 'venMenCer', label: 'Venta Men. Cerámica', minWidth: 150, align: 'right', format: formatNumber, group: 'mensuales', type: 'number' },
//   { id: 'otrIngr', label: 'Otros Ingresos', minWidth: 120, align: 'right', format: formatNumber, group: 'mensuales', type: 'number' },
//   { id: 'venAcuOtros', label: 'Venta Acumulado Otros', minWidth: 160, align: 'right', format: formatNumber, group: 'acumulado', type: 'number' },
//   { id: 'venAcuCer', label: 'Venta Acum. Cerámica', minWidth: 160, align: 'right', format: formatNumber, group: 'acumulado', type: 'number' },
//   { id: 'acuPres', label: 'Acum. Presupuesto', minWidth: 140, align: 'right', format: formatNumber, group: 'acumulado', type: 'number' },
//   { id: 'diffVe_OtrosvsPres', label: 'Diff Ventas otros vs Presupuesto', minWidth: 180, align: 'right', format: formatNumber, group: 'diferencias', type: 'number' },
//   { id: 'diffVen_CervsPres', label: 'Diff Venta cerámica vs Presupuesto', minWidth: 180, align: 'right', format: formatNumber, group: 'diferencias', type: 'number' },
//   { id: 'meta', label: 'Meta', minWidth: 80, align: 'right', group: 'cumpl', type: 'percent' },
//   { id: 'cumplMenCeramica', label: 'Cumpl. Mensual Cerámica', minWidth: 170, align: 'right', group: 'cumpl', type: 'percent' },
//   { id: 'cumplOtrosIngrAcuvsAcumPres', label: 'Cumpl. Otros Ingresos Acum. vs Acum. Presupuesto', minWidth: 220, align: 'right', group: 'cumpl', type: 'percent' },
// ];
// const PRESET_VIEWS = {
//   'KPIs mensuales': { visible: ['periodo','PresMen','VentMenOtrIng','venMenCer','otrIngr','cumplMenCeramica'] },
//   Acumulado: { visible: ['periodo','venAcuOtros','venAcuCer','acuPres','cumplOtrosIngrAcuvsAcumPres'] },
//   Diferencias: { visible: ['periodo','diffVe_OtrosvsPres','diffVen_CervsPres','meta'] },
//   Todo: { visible: columns.map((c) => c.id) },
// };

// <ReusableKpiTableMRT
//   title="INGRESO POR VENTA TOTALES"
//   lsKeyPrefix="ivt_mrt"
//   groups={GROUPS}
//   columns={columns}
//   presetViews={PRESET_VIEWS}
//   services={{ getAll, getPeriodo, create: CreateObje, update: UpdateObje }}
//   EditDialog={IngresoVentaTotalModal}
// />
*/
