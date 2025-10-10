import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
} from '@mui/material';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PrintIcon from '@mui/icons-material/Print';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ConfirmDialog from '../../../components/general/ConfirmDialog.jsx';
import { useNotify } from '../../../ui/NotificationsProvider.jsx';

// Servicios de productos
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
} from '../../../service/generacionResiduo/producto.service.js';

// Servicios de recibo
import { createRecibo } from '../../../service/generacionResiduo/recibos.service.js';

// ————————————————————————————————————————————————
// Utilidades simples
const brandGreen = '#006633';

const toNum = (v) => {
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(/\s+/g, '').replace(/,/g, '.'));
  return Number.isFinite(n) ? n : 0;
};
const money = (n) =>
  (toNum(n) || 0).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const todayStr = new Date().toISOString().slice(0, 10);

const makeEmptyRow = (idx) => ({
  item: idx + 1,
  descripcion: '', // nombre del producto mostrado/seleccionado
  cantidad: '',
  um: 'kg',
  pu: '',
});

const baseFilter = createFilterOptions();

// ——— Dialogo para crear/editar producto (solo nombre) ———
function ProductoDialog({ open, initial, onClose }) {
  const notify = useNotify();
  const isEdit = Boolean(initial?.id);
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    if (!open) return;
    setNombre(initial?.nombre ?? initial?.prefill ?? '');
  }, [open, initial]);

  const handleSubmit = async () => {
    const nombreTrim = (nombre || '').trim();
    if (!nombreTrim) return;
    try {
      if (isEdit) {
        await updateProducto(initial.id, { nombre: nombreTrim });
        notify.success('Residuo editado');
      } else {
        await createProducto({ nombre: nombreTrim });
        notify.success('Residuo registrado');
      }
      onClose({ success: true, nombre: nombreTrim, id: initial?.id });
    } catch (err) {
      const msg =
        err?.message ||
        err?.detail ||
        err?.errors?.join(', ') ||
        'Error al guardar';
      notify.error(msg);
      onClose({ success: false, error: msg });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose({ success: false })}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{isEdit ? 'Editar Residuo' : 'Nuevo Residuo'}</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Nombre del producto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          fullWidth
          autoFocus
          inputProps={{ maxLength: 120 }}
          helperText="Máx. 120 caracteres"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose({ success: false })}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {isEdit ? 'Guardar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ——— Diálogo de confirmación de registro ———
function ConfirmRegistrarReciboDialog({
  open,
  onClose,
  payloadPreview, // { nro_recibo, fecha, nombre_cliente, observaciones?, items: [...] , total }
}) {
  const {
    nro_recibo,
    fecha,
    nombre_cliente,
    observaciones,
    items = [],
    total = 0,
  } = payloadPreview || {};

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>Confirmar registro del recibo</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Cabecera
            </Typography>
            <Box
              sx={{
                mt: 1,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
              }}
            >
              <Box>
                <Typography>
                  <strong>Nro Recibo:</strong> {nro_recibo || '—'}
                </Typography>
                <Typography>
                  <strong>Fecha:</strong> {fecha || '—'}
                </Typography>
              </Box>
              <Box>
                <Typography>
                  <strong>Cliente:</strong> {nombre_cliente || '—'}
                </Typography>
                <Typography>
                  <strong>Observaciones:</strong> {observaciones || '—'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Detalle
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell>U.M.</TableCell>
                  <TableCell align="right">P.U. (Bs)</TableCell>
                  <TableCell align="right">Total (Bs)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Sin ítems válidos
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((it, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{it.producto_nombre || '—'}</TableCell>
                      <TableCell align="right">{money(it.cantidad)}</TableCell>
                      <TableCell>{it.unidadMedida}</TableCell>
                      <TableCell align="right">
                        {money(it.precio_unitario)}
                      </TableCell>
                      <TableCell align="right">
                        {money(it.total_linea)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5} align="right" sx={{ fontWeight: 700 }}>
                    TOTAL Bs.
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {money(total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancelar</Button>
        <Button variant="contained" onClick={() => onClose(true)}>
          Registrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ————————————————————————————————————————————————
export default function ReciboCompraResiduos() {
  const notify = useNotify();
  const [noRecibo, setNoRecibo] = useState(1198);
  const [fecha, setFecha] = useState(todayStr);
  const [cliente, setCliente] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [confirm, setConfirm] = useState({ open: false, row: null });
  const [rows, setRows] = useState(
    Array.from({ length: 7 }, (_, i) => makeEmptyRow(i))
  );

  // Productos del backend
  const [productos, setProductos] = useState([]); // [{id, nombre}]
  const [loadingProductos, setLoadingProductos] = useState(false);

  // Dialogo de producto
  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [prodDialogInitial, setProdDialogInitial] = useState(null); // { id?, nombre? , prefill? }
  const [rowToUpdateDesc, setRowToUpdateDesc] = useState(null); // índice de fila para setear descripcion tras crear

  // Confirmar registro
  const [confirmRegistrarOpen, setConfirmRegistrarOpen] = useState(false);
  const [payloadPreview, setPayloadPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadProductos = useCallback(async () => {
    setLoadingProductos(true);
    try {
      const data = await getProductos('');
      setProductos(Array.isArray(data) ? data : []);
    } finally {
      setLoadingProductos(false);
    }
  }, []);

  useEffect(() => {
    loadProductos();
  }, [loadProductos]);

  const lineTotal = (r) => toNum(r.cantidad) * toNum(r.pu);
  const total = useMemo(
    () => rows.reduce((acc, r) => acc + lineTotal(r), 0),
    [rows]
  );

  const handleRowChange = (i, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const handleNuevo = () => {
    setNoRecibo((n) => (Number.isFinite(Number(n)) ? Number(n) + 1 : 1));
    setFecha(todayStr);
    setCliente('');
    setObservaciones('');
    setRows(Array.from({ length: 7 }, (_, i) => makeEmptyRow(i)));
  };

  // Handlers CRUD desde el Autocomplete
  const openCreateProducto = (prefill, rowIndex) => {
    setProdDialogInitial({ prefill });
    setRowToUpdateDesc(rowIndex);
    setProdDialogOpen(true);
  };

  const openEditProducto = (producto) => {
    setProdDialogInitial({ id: producto.id, nombre: producto.nombre });
    setRowToUpdateDesc(null);
    setProdDialogOpen(true);
  };

  const handleProductoDialogClose = async ({ success, nombre, error }) => {
    setProdDialogOpen(false);
    if (!success) {
      if (error) {
        const msg =
          error?.message ||
          error?.detail ||
          error?.errors?.join(', ') ||
          'Error al registrar residuo';
        console.error(error);
        notify.error(msg);
      }
      return;
    }
    await loadProductos();
    // Si se abrió desde “Añadir …” en una fila, pone la nueva descripcion
    if (rowToUpdateDesc != null && nombre) {
      handleRowChange(rowToUpdateDesc, 'descripcion', nombre);
      setRowToUpdateDesc(null);
    }
  };

  const handleDeleteProducto = async (producto) => {
    setConfirm({
      open: true,
      row: producto,
      title: 'Eliminar producto',
      subtitle: `¿Seguro que deseas eliminar "${producto.nombre}"?`,
    });
  };

  const handleCloseConfirm = async (ok) => {
    const row = confirm.row;
    setConfirm({ open: false, row: null, title: '', subtitle: '' });
    if (!ok || !row) return;
    try {
      await deleteProducto(row.id);
      await loadProductos();
      notify.success('Residuo eliminado correctamente');
    } catch (e) {
      const msg = e?.message || e?.detail || 'No se pudo eliminar';
      notify.error(msg);
      console.error(msg);
    }
  };

  // ——— Preparar payload y abrir confirmación de registro ———
  const buildPayload = () => {
    // Mapea filas a ítems válidos con producto_id; ignora filas sin producto válido
    const items = rows
      .map((r) => {
        const nombre = String(r.descripcion ?? '').trim();
        if (!nombre) return null;

        const prod = productos.find(
          (p) => String(p.nombre).toLowerCase() === nombre.toLowerCase()
        );
        if (!prod) return null; // -> si quieres forzar creación, abres el dialogo aquí en vez de ignorar

        const cantidad = toNum(r.cantidad);
        const precio_unitario = toNum(r.pu);
        if (cantidad <= 0) return null;

        const total_linea = +(cantidad * precio_unitario).toFixed(2);
        return {
          producto_id: prod.id,
          producto_nombre: prod.nombre, // solo para preview
          cantidad,
          precio_unitario,
          unidadMedida: r.um || 'kg',
          total_linea,
        };
      })
      .filter(Boolean);

    const totalPreview = items.reduce((a, b) => a + b.total_linea, 0);

    return {
      nro_recibo: String(noRecibo ?? '').trim(),
      fecha: String(fecha ?? '').slice(0, 10),
      nombre_cliente: String(cliente ?? '').trim(),
      observaciones: String(observaciones ?? '').trim(),
      items,
      total: +totalPreview.toFixed(2),
    };
  };

  const validateBeforeConfirm = (preview) => {
    const errors = [];
    if (!preview.nro_recibo) errors.push('El Nro de recibo es obligatorio');
    if (!preview.fecha) errors.push('La fecha es obligatoria');
    if (!preview.nombre_cliente)
      errors.push('El nombre del cliente es obligatorio');
    if (preview.items.length === 0) {
      errors.push(
        'Debe haber al menos un ítem válido con producto, cantidad y precio'
      );
    }
    return errors;
  };

  const handleOpenConfirmRegistrar = () => {
    const preview = buildPayload();
    const errs = validateBeforeConfirm(preview);
    if (errs.length) {
      notify.error(errs[0]);
      return;
    }
    setPayloadPreview(preview);
    setConfirmRegistrarOpen(true);
  };

  const handleConfirmRegistrarClose = async (ok) => {
    setConfirmRegistrarOpen(false);
    if (!ok) return;

    // Enviar al backend
    try {
      setSaving(true);
      const data = {
        nro_recibo: payloadPreview.nro_recibo,
        fecha: payloadPreview.fecha,
        nombre_cliente: payloadPreview.nombre_cliente,
        items: payloadPreview.items.map((it) => ({
          producto_id: it.producto_id,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          unidadMedida: it.unidadMedida,
          total_linea: it.total_linea,
        })),
      };
      await createRecibo(data);
      notify.success('Recibo registrado');
      handleNuevo();
    } catch (err) {
      const msg =
        err?.detail ||
        (Array.isArray(err?.errors) ? err.errors.join(', ') : err?.message) ||
        'Error al registrar el recibo';
      notify.error(msg);
    } finally {
      setSaving(false);
      setPayloadPreview(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        {/* Encabezado */}
        <Typography variant="h5" align="center" sx={{ fontWeight: 700, mb: 2 }}>
          RECIBO DE COMPRA DE RESIDUOS
        </Typography>

        <Grid container spacing={4} alignItems="stretch">
          {/* Banda NOMBRE DEL CLIENTE */}
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '240px 1fr' },
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  bgcolor: brandGreen,
                  color: 'white',
                  px: 2,
                  py: 1.1,
                  fontWeight: 100,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                NOMBRE DEL CLIENTE
              </Box>
              <Box sx={{ p: 1, width: 400 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Nombre completo"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                />
              </Box>
            </Box>
          </Grid>

          {/* Caja No Recibo / Fecha */}
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    No RECIBO
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    size="small"
                    fullWidth
                    value={noRecibo}
                    onChange={(e) => setNoRecibo(e.target.value)}
                    inputProps={{ inputMode: 'numeric' }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    FECHA
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    type="date"
                    size="small"
                    fullWidth
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Tabla */}
          <Grid item xs={12}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        bgcolor: brandGreen,
                        color: 'white',
                        fontWeight: 700,
                        borderColor: '#e0e0e0',
                        width: 70,
                      }}
                    >
                      ITEM
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: brandGreen,
                        color: 'white',
                        fontWeight: 700,
                        borderColor: '#e0e0e0',
                        width: '25%',
                        minWidth: 220,
                      }}
                    >
                      DESCRIPCIÓN
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: brandGreen,
                        color: 'white',
                        fontWeight: 700,
                        borderColor: '#e0e0e0',
                        width: 110,
                      }}
                    >
                      CANTIDAD
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: brandGreen,
                        color: 'white',
                        fontWeight: 700,
                        borderColor: '#e0e0e0',
                        width: 100,
                      }}
                    >
                      U.M.
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: brandGreen,
                        color: 'white',
                        fontWeight: 700,
                        borderColor: '#e0e0e0',
                        width: 130,
                      }}
                    >
                      P.U. (Bs)
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: brandGreen,
                        color: 'white',
                        fontWeight: 700,
                        borderColor: '#e0e0e0',
                        width: 140,
                      }}
                    >
                      TOTAL (Bs)
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell width={70}>{r.item}</TableCell>
                      <TableCell>
                        <Autocomplete
                          loading={loadingProductos}
                          size="small"
                          options={productos}
                          value={r.descripcion || ''}
                          // Al cambiar selección
                          onChange={(event, newValue) => {
                            if (typeof newValue === 'string') {
                              // Texto libre
                              handleRowChange(i, 'descripcion', newValue);
                            } else if (newValue && newValue.inputValue) {
                              // Opción "Añadir ..."
                              const label = newValue.inputValue.trim();
                              if (label) {
                                openCreateProducto(label, i);
                              }
                            } else if (newValue && newValue.nombre) {
                              // Seleccionó un producto existente
                              handleRowChange(
                                i,
                                'descripcion',
                                newValue.nombre
                              );
                            } else {
                              handleRowChange(i, 'descripcion', '');
                            }
                          }}
                          // Al escribir en el input
                          onInputChange={(event, newInput) => {
                            handleRowChange(i, 'descripcion', newInput || '');
                          }}
                          selectOnFocus
                          clearOnBlur
                          handleHomeEndKeys
                          // Agrega "Añadir ..." si no existe
                          filterOptions={(options, params) => {
                            const filtered = baseFilter(options, params);
                            const { inputValue } = params;
                            const exists = options.some(
                              (opt) =>
                                String(opt?.nombre ?? '').toLowerCase() ===
                                String(inputValue ?? '').toLowerCase()
                            );
                            if (inputValue && !exists) {
                              filtered.push({
                                inputValue,
                                nombre: `Añadir "${inputValue}"`,
                                __add__: true,
                              });
                            }
                            return filtered;
                          }}
                          getOptionLabel={(option) => {
                            if (typeof option === 'string') return option;
                            if (option.inputValue) return option.inputValue;
                            return option?.nombre || '';
                          }}
                          renderOption={(props, option) => {
                            const isAdd = option.__add__ || option.inputValue;
                            const label =
                              option?.nombre || option.inputValue || '';
                            return (
                              <li
                                {...props}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 8,
                                }}
                              >
                                <span>{label}</span>
                                {/* Acciones para opciones existentes */}
                                {!isAdd && option?.id && (
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditProducto(option);
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProducto(option);
                                      }}
                                    >
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                )}
                                {/* Acción para añadir nuevo */}
                                {isAdd && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openCreateProducto(option.inputValue, i);
                                    }}
                                    sx={{ color: 'primary.main' }}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </li>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="standard"
                              placeholder="Detalle del residuo / producto"
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell width={140}>
                        <TextField
                          size="small"
                          variant="standard"
                          fullWidth
                          value={r.cantidad}
                          onChange={(e) =>
                            handleRowChange(i, 'cantidad', e.target.value)
                          }
                          inputProps={{ inputMode: 'decimal' }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                &nbsp;
                              </InputAdornment>
                            ),
                          }}
                        />
                      </TableCell>
                      <TableCell width={120}>
                        <TextField
                          select
                          size="small"
                          variant="standard"
                          fullWidth
                          value={r.um}
                          onChange={(e) =>
                            handleRowChange(i, 'um', e.target.value)
                          }
                        >
                          {['kg', 'unidad', 'm', 'litro'].map((o) => (
                            <MenuItem key={o} value={o}>
                              {o}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell width={160}>
                        <TextField
                          size="small"
                          variant="standard"
                          fullWidth
                          value={r.pu}
                          onChange={(e) =>
                            handleRowChange(i, 'pu', e.target.value)
                          }
                          inputProps={{ inputMode: 'decimal' }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                Bs
                              </InputAdornment>
                            ),
                          }}
                        />
                      </TableCell>
                      <TableCell width={160} sx={{ fontWeight: 700 }}>
                        Bs {money(lineTotal(r))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>

                <TableFooter>
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="right"
                      sx={{ fontWeight: 700 }}
                    >
                      TOTAL Bs.
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Bs {money(total)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </Grid>

          {/* Observaciones + acciones */}
          <Grid item xs={12} md={8}>
            <Stack spacing={1}>
              <TextField
                label="Observaciones"
                multiline
                minRows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
              <Typography variant="caption" color="text.secondary">
                El comprador es responsable de la disposición final de la compra
                a COBOCE – Cerámica.
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack spacing={1.5} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleNuevo}
                >
                  NUEVO RECIBO
                </Button>
                <Button
                  color="success"
                  variant="contained"
                  disabled={saving}
                  onClick={handleOpenConfirmRegistrar}
                >
                  REGISTRAR
                </Button>
              </Stack>
            </Stack>
          </Grid>

          {/* Firmas */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    pt: 1,
                    borderTop: '2px solid',
                    borderColor: 'divider',
                    textAlign: 'center',
                  }}
                >
                  Firma del comprador
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    pt: 1,
                    borderTop: '2px solid',
                    borderColor: 'divider',
                    textAlign: 'center',
                  }}
                >
                  Firma del vendedor
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Dialogo Crear/Editar Producto */}
      <ProductoDialog
        open={prodDialogOpen}
        initial={prodDialogInitial}
        onClose={handleProductoDialogClose}
      />
      {/* Confirmación eliminar producto (catálogo) */}
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        subtitle={confirm.subtitle}
        onClose={handleCloseConfirm} // recibe true/false
      />
      {/* Confirmación registrar recibo con resumen */}
      <ConfirmRegistrarReciboDialog
        open={confirmRegistrarOpen}
        onClose={handleConfirmRegistrarClose}
        payloadPreview={payloadPreview}
      />
    </Container>
  );
}
