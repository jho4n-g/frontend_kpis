import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Typography,
  Tooltip,
  useTheme,
  Divider,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import Autocomplete from '@mui/material/Autocomplete';

import { useNotify } from '@/ui/NotificationsProvider.jsx';

// Servicios
import {
  getDatosTabla,
  getReciboById, // <-- añade en tu service si no lo importabas aquí
  updateRecibo, // <-- idem
  deleteRecibo, // <-- idem: inhabilitar (delete)
} from '../../../service/generacionResiduo/recibos.service.js';
import { getProductos } from '../../../service/generacionResiduo/producto.service.js';

// ----------------- utils -----------------
const toNum = (v) => {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(/\s+/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const money = (n) =>
  Number(n ?? 0).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ----------------- Dialogo para pedir nro_recibo -----------------
function AskNroDialog({ open, title, label = 'No. de recibo', onClose }) {
  const [nro, setNro] = useState('');
  useEffect(() => {
    if (open) setNro('');
  }, [open]);
  return (
    <Dialog open={open} onClose={() => onClose(null)} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <TextField
          autoFocus
          fullWidth
          label={label}
          value={nro}
          onChange={(e) => setNro(e.target.value)}
          inputProps={{ inputMode: 'numeric' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(null)}>Cancelar</Button>
        <Button variant="contained" onClick={() => onClose(String(nro).trim())}>
          Aceptar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------- Dialogo EDITAR RECIBO (encabezado + items) -----------------
function EditReciboDialog({ open, recibo, onClose }) {
  // recibo: { id, nro_recibo, fecha, nombre_cliente, items:[{...}] }
  const notify = useNotify();
  const [prodOptions, setProdOptions] = useState([]);
  const [form, setForm] = useState({
    nro_recibo: '',
    fecha: '',
    nombre_cliente: '',
    items: [],
  });
  const [errors, setErrors] = useState({});
  const [rootError, setRootError] = useState('');
  const [saving, setSaving] = useState(false);

  const MAX_ITEMS = 6;
  const MIN_ITEMS = 1;

  const loadProductos = useCallback(async () => {
    const data = await getProductos('');
    setProdOptions(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setRootError('');
    setSaving(false);
    loadProductos();
    if (recibo) {
      setForm({
        nro_recibo: recibo.nro_recibo ?? '',
        fecha: recibo.fecha ?? '',
        nombre_cliente: recibo.nombre_cliente ?? '',
        items: (recibo.items ?? []).map((it) => ({
          id: it.id, // id del item (para referencia)
          producto_id: it.producto_id ?? it.producto?.id ?? null,
          producto_nombre: it.producto?.nombre ?? '',
          cantidad: String(it.cantidad ?? ''),
          unidadMedida: it.unidadMedida ?? 'kg',
          precio_unitario: String(it.precio_unitario ?? ''),
          total_linea: Number(it.total_linea ?? 0),
        })),
      });
    }
  }, [open, recibo, loadProductos]);

  const setItem = (idx, patch) => {
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], ...patch };
      return { ...f, items };
    });
  };

  const addItem = () => {
    setForm((f) => {
      if ((f.items?.length ?? 0) >= MAX_ITEMS) return f;
      return {
        ...f,
        items: [
          ...f.items,
          {
            id: undefined,
            producto_id: null,
            producto_nombre: '',
            cantidad: '',
            unidadMedida: 'kg',
            precio_unitario: '',
            total_linea: 0,
          },
        ],
      };
    });
  };
  const removeItem = (idx) => {
    setForm((f) => {
      if ((f.items?.length ?? 0) <= MIN_ITEMS) return f;
      const items = f.items.filter((_, i) => i !== idx);
      return { ...f, items };
    });
  };

  const validate = () => {
    const e = {};
    if (!form.nro_recibo) e.nro_recibo = 'Requerido';
    if (!form.fecha) e.fecha = 'Requerido (YYYY-MM-DD)';
    if (!form.nombre_cliente) e.nombre_cliente = 'Requerido';
    if (!form.items || form.items.length < MIN_ITEMS)
      e.items = `Debe tener al menos ${MIN_ITEMS} ítem`;
    if (form.items && form.items.length > MAX_ITEMS)
      e.items = `Máximo ${MAX_ITEMS} ítems`;

    form.items?.forEach((it, i) => {
      const errs = {};
      if (!it.producto_id) errs.producto_id = 'Selecciona producto';
      const cantidad = toNum(it.cantidad);
      if (!(cantidad > 0)) errs.cantidad = 'Cantidad > 0';
      const pu = toNum(it.precio_unitario);
      if (!(pu >= 0)) errs.precio_unitario = 'Precio ≥ 0';
      if (!it.unidadMedida) errs.unidadMedida = 'Requerido';
      if (Object.keys(errs).length) e[`item_${i}`] = errs;
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const totalRecibo = useMemo(() => {
    return (form.items ?? []).reduce((a, it) => {
      const t =
        Number(it.total_linea) ||
        toNum(it.cantidad) * toNum(it.precio_unitario);
      return a + (Number.isFinite(t) ? t : 0);
    }, 0);
  }, [form.items]);

  const handleSave = async () => {
    setRootError('');
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        nro_recibo: form.nro_recibo,
        fecha: form.fecha,
        nombre_cliente: form.nombre_cliente,
        items: form.items.map((it) => ({
          producto_id: it.producto_id,
          cantidad: toNum(it.cantidad),
          precio_unitario: toNum(it.precio_unitario),
          unidadMedida: it.unidadMedida,
          total_linea:
            Number(it.total_linea) ||
            toNum(it.cantidad) * toNum(it.precio_unitario),
        })),
      };
      const updated = await updateRecibo(recibo.id, payload);
      notify.success('Recibo actualizado');
      onClose(true, updated);
    } catch (err) {
      const msg =
        err?.errors?.join(', ') ||
        err?.message ||
        err?.detail ||
        'Error al actualizar';
      setRootError(msg);
      notify.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>Editar recibo</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {rootError && <Alert severity="error">{rootError}</Alert>}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="No. recibo"
              value={form.nro_recibo}
              onChange={(e) =>
                setForm((f) => ({ ...f, nro_recibo: e.target.value }))
              }
              error={Boolean(errors.nro_recibo)}
              helperText={errors.nro_recibo || ' '}
              fullWidth
            />
            <TextField
              label="Fecha (YYYY-MM-DD)"
              value={form.fecha}
              onChange={(e) =>
                setForm((f) => ({ ...f, fecha: e.target.value }))
              }
              error={Boolean(errors.fecha)}
              helperText={errors.fecha || ' '}
              fullWidth
            />
          </Stack>

          <TextField
            label="Nombre del cliente"
            value={form.nombre_cliente}
            onChange={(e) =>
              setForm((f) => ({ ...f, nombre_cliente: e.target.value }))
            }
            error={Boolean(errors.nombre_cliente)}
            helperText={errors.nombre_cliente || ' '}
            fullWidth
          />

          <Divider />
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Ítems (máx. {MAX_ITEMS})
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              variant="outlined"
              onClick={addItem}
              disabled={(form.items?.length ?? 0) >= MAX_ITEMS}
            >
              Añadir ítem
            </Button>
          </Stack>

          {Boolean(errors.items) && (
            <Alert severity="warning">{errors.items}</Alert>
          )}

          <Stack spacing={2}>
            {(form.items ?? []).map((it, i) => {
              const itErr = errors[`item_${i}`] || {};
              const selected =
                prodOptions.find((p) => p.id === it.producto_id) || null;
              const total =
                Number(it.total_linea) ||
                toNum(it.cantidad) * toNum(it.precio_unitario);

              return (
                <Paper
                  key={i}
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: 1.5 }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Autocomplete
                      options={prodOptions}
                      getOptionLabel={(opt) => opt?.nombre ?? ''}
                      value={selected}
                      onChange={(e, val) =>
                        setItem(i, {
                          producto_id: val?.id || null,
                          producto_nombre: val?.nombre || '',
                        })
                      }
                      sx={{ minWidth: 240 }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Producto"
                          error={Boolean(itErr.producto_id)}
                          helperText={itErr.producto_id || ' '}
                        />
                      )}
                    />
                    <TextField
                      label="Cantidad"
                      value={it.cantidad}
                      onChange={(e) => setItem(i, { cantidad: e.target.value })}
                      inputMode="decimal"
                      error={Boolean(itErr.cantidad)}
                      helperText={itErr.cantidad || ' '}
                    />
                    <TextField
                      label="U.M."
                      value={it.unidadMedida}
                      onChange={(e) =>
                        setItem(i, { unidadMedida: e.target.value })
                      }
                      error={Boolean(itErr.unidadMedida)}
                      helperText={itErr.unidadMedida || ' '}
                    />
                    <TextField
                      label="Precio unitario (Bs)"
                      value={it.precio_unitario}
                      onChange={(e) =>
                        setItem(i, { precio_unitario: e.target.value })
                      }
                      inputMode="decimal"
                      error={Boolean(itErr.precio_unitario)}
                      helperText={itErr.precio_unitario || ' '}
                    />
                    <Box sx={{ minWidth: 140, alignSelf: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Total ítem
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }}>
                        Bs {money(total)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }} />
                    <Button
                      color="error"
                      variant="text"
                      onClick={() => removeItem(i)}
                      disabled={(form.items?.length ?? 0) <= MIN_ITEMS}
                    >
                      Quitar
                    </Button>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          <Stack direction="row" justifyContent="flex-end">
            <Typography sx={{ fontWeight: 700 }}>
              Total recibo: Bs {money(totalRecibo)}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          Guardar cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------- Dialogo INHABILITAR RECIBO -----------------
function DisableReciboDialog({ open, recibo, onClose }) {
  const notify = useNotify();
  const [working, setWorking] = useState(false);

  const total = useMemo(() => {
    return (recibo?.items ?? []).reduce((a, it) => {
      const t =
        Number(it.total_linea) ||
        toNum(it.cantidad) * toNum(it.precio_unitario);
      return a + (Number.isFinite(t) ? t : 0);
    }, 0);
  }, [recibo]);

  const handleDisable = async () => {
    setWorking(true);
    try {
      await deleteRecibo(recibo.id);
      notify.success('Recibo inhabilitado');
      onClose(true);
    } catch (err) {
      const msg = err?.message || err?.detail || 'No se pudo inhabilitar';
      notify.error(msg);
      onClose(false);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>Inhabilitar recibo</DialogTitle>
      <DialogContent dividers>
        {recibo ? (
          <Stack spacing={1.5}>
            <Typography>
              <b>No. recibo:</b> {recibo.nro_recibo}
            </Typography>
            <Typography>
              <b>Fecha:</b> {recibo.fecha}
            </Typography>
            <Typography>
              <b>Cliente:</b> {recibo.nombre_cliente}
            </Typography>
            <Divider />
            <Typography sx={{ fontWeight: 700 }}>Ítems</Typography>
            {(recibo.items ?? []).map((it) => (
              <Stack key={it.id} direction="row" spacing={2}>
                <Typography sx={{ minWidth: 180 }}>
                  {it.producto?.nombre ?? '—'}
                </Typography>
                <Typography>Cant: {money(it.cantidad)}</Typography>
                <Typography>U.M.: {it.unidadMedida}</Typography>
                <Typography>PU: Bs {money(it.precio_unitario)}</Typography>
                <Box sx={{ flex: 1 }} />
                <Typography sx={{ fontWeight: 700 }}>
                  Bs{' '}
                  {money(
                    it.total_linea ||
                      toNum(it.cantidad) * toNum(it.precio_unitario)
                  )}
                </Typography>
              </Stack>
            ))}
            <Divider />
            <Typography align="right" sx={{ fontWeight: 700 }}>
              Total: Bs {money(total)}
            </Typography>
          </Stack>
        ) : (
          <Typography>No se pudo cargar el recibo.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={working}>
          Cancelar
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={handleDisable}
          disabled={working}
        >
          Inhabilitar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------- Tabla principal ----------------------
export default function RecibosItemsTable() {
  const theme = useTheme();
  const notify = useNotify();
  const isDark = theme.palette.mode === 'dark';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // dialogs
  const [askEditOpen, setAskEditOpen] = useState(false);
  const [askDisableOpen, setAskDisableOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [reciboSelected, setReciboSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDatosTabla();
      const normalizeRows = (arr) =>
        (arr || []).map((r, idx) => {
          const id = r.item_id ?? r.id ?? `row-${idx}`;
          return {
            id, // id para DataGrid
            nro_recibo: r['No RECIBO'] ?? r.nro_recibo ?? '',
            detalle: r.DETALLE ?? r.detalle ?? '',
            cantidad: toNum(r.CANTIDAD ?? r.cantidad),
            um: r['U.M.'] ?? r.um ?? '',
            precio_unitario: toNum(r['PRECIO UN. (Bs)'] ?? r.precio_unitario),
            total_linea: toNum(r['TOTAL (Bs)'] ?? r.total_linea),
            // extras
            fecha: r.FECHA ?? r.fecha ?? '',
            item_id: r.item_id ?? null,
            recibo_id: r.recibo_id ?? null,
            producto_id: r.producto_id ?? null,
            cliente: r.cliente ?? null,
          };
        });
      setRows(normalizeRows(data));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.nro_recibo,
        r.detalle,
        r.um,
        r.fecha,
        r.cliente,
        r.cantidad,
        r.precio_unitario,
      ]
        .map((v) => (v == null ? '' : String(v)).toLowerCase())
        .some((s) => s.includes(q))
    );
  }, [rows, query]);

  // ---- flujo editar por nro_recibo
  const startEditByNumber = () => setAskEditOpen(true);
  const handleAskEditClose = async (nro) => {
    setAskEditOpen(false);
    if (!nro) return;
    try {
      const data = await getReciboById(nro);
      console.log('obtener recibo', data);
      setReciboSelected(data);
      setEditOpen(true);
    } catch (err) {
      const msg = err?.message || err?.detail || 'No se pudo cargar el recibo';
      notify.error(msg);
    }
  };

  // ---- flujo inhabilitar por nro_recibo
  const startDisableByNumber = () => setAskDisableOpen(true);
  const handleAskDisableClose = async (nro) => {
    setAskDisableOpen(false);
    if (!nro) return;
    try {
      const data = await getReciboById(nro);
      setReciboSelected(data);
      setDisableOpen(true);
    } catch (err) {
      const msg = err?.message || err?.detail || 'No se pudo cargar el recibo';
      notify.error(msg);
    }
  };

  // columnas SIN acciones (tal cual pediste)
  const columns = useMemo(
    () => [
      { field: 'nro_recibo', headerName: 'No RECIBO', width: 120 },
      { field: 'detalle', headerName: 'DETALLE', flex: 1, minWidth: 200 },
      {
        field: 'cantidad',
        headerName: 'CANTIDAD',
        width: 120,
        type: 'number',
        renderCell: ({ row }) =>
          (Number(row?.cantidad) || 0).toLocaleString('es-BO', {
            minimumFractionDigits: 2,
          }),
      },
      { field: 'um', headerName: 'U.M.', width: 100 },
      {
        field: 'precio_unitario',
        headerName: 'PRECIO UN. (Bs)',
        width: 160,
        type: 'number',
        renderCell: ({ row }) =>
          `Bs ${money(Number(row?.precio_unitario) || 0)}`,
      },
      {
        field: 'total_linea',
        headerName: 'TOTAL (Bs)',
        width: 160,
        type: 'number',
        renderCell: ({ row }) => {
          const c = Number(row?.cantidad) || 0;
          const u = Number(row?.precio_unitario) || 0;
          const t = Number(row?.total_linea);
          const total = Number.isFinite(t) && t > 0 ? t : c * u;
          return `Bs ${money(total)}`;
        },
      },
    ],
    []
  );

  const isDarkTheme = isDark;
  const bg = isDarkTheme ? '#1e1e1e' : '#fff';
  const text = isDarkTheme ? '#f5f5f5' : '#000';
  const border = isDarkTheme ? '#444' : '#ddd';
  const hover = isDarkTheme ? '#2a2a2a' : '#f7f7f7';

  return (
    <Paper
      variant="outlined"
      sx={{ p: 0, borderRadius: 1, overflow: 'hidden' }}
    >
      {/* Toolbar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{ p: 1.5, borderBottom: (t) => `1px solid ${t.palette.divider}` }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Recibos (ítems)
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Buscar por recibo / producto / cliente…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
              ),
              endAdornment: query ? (
                <IconButton size="small" onClick={() => setQuery('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              ) : null,
            }}
            sx={{ minWidth: 280 }}
          />
          <Button variant="contained" onClick={startEditByNumber}>
            Editar recibo
          </Button>
          <Button
            color="error"
            variant="outlined"
            onClick={startDisableByNumber}
          >
            Inhabilitar recibo
          </Button>
        </Box>
      </Stack>

      {/* Grid (mismo estilo) */}
      <Box sx={{ bgcolor: 'background.paper' }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          getRowId={(r) => r.id}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          hideFooter
          sx={{
            border: 0,
            bgcolor: bg,
            color: text,
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: bg,
              borderBottom: `1px solid ${border}`,
              borderTop: 'none',
            },
            '& .MuiDataGrid-columnHeader, & .MuiDataGrid-topContainer': {
              bgcolor: bg,
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              color: text,
              fontWeight: 600,
            },
            '& .MuiDataGrid-columnSeparator': { color: border },
            '& .MuiDataGrid-cell': { borderRight: `1px solid ${border}` },
            '& .MuiDataGrid-row': {
              borderBottom: `1px solid ${border}`,
              '&:hover': { bgcolor: hover },
            },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
              outline: 'none',
            },
            '& .MuiTablePagination-root': { bgcolor: bg, color: text },
          }}
        />
      </Box>

      {/* Diálogos */}
      <AskNroDialog
        open={askEditOpen}
        title="Editar recibo — ingresa No. de recibo"
        onClose={handleAskEditClose}
      />
      <AskNroDialog
        open={askDisableOpen}
        title="Inhabilitar recibo — ingresa No. de recibo"
        onClose={handleAskDisableClose}
      />
      <EditReciboDialog
        open={editOpen}
        recibo={reciboSelected}
        onClose={async (ok) => {
          setEditOpen(false);
          setReciboSelected(null);
          if (ok) await load();
        }}
      />
      <DisableReciboDialog
        open={disableOpen}
        recibo={reciboSelected}
        onClose={async (ok) => {
          setDisableOpen(false);
          setReciboSelected(null);
          if (ok) await load();
        }}
      />
    </Paper>
  );
}
