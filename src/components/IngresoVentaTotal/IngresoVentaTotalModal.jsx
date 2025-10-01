import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Box,
  CircularProgress,
} from '@mui/material';

function toMonthInputValue(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    // Acepta "YYYY-MM" o "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss..."
    const m = value.match(/^(\d{4}-\d{2})(?:-\d{2}.*)?$/);
    if (m) return m[1]; // "2025-05"
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear(); // usa local o UTC, aquí da igual para año/mes
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

const toNum = (v) =>
  typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v);

export default function IngresoVentaTotalModal({
  open,
  onClose,
  onSuccess,
  initialValues = null, // si viene => modo edición
  createFn, // (payload) => Promise
  updateFn, // (id, payload) => Promise
  idKey = 'id',
  periodoActual, // Date o 'YYYY-MM-01'
}) {
  const isEdit = !!initialValues;
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    periodo: '', // YYYY-MM
    PresMen: '', // números como string (los convierto al guardar)
    VentMenOtrIng: '',
    venMenCer: '',
    otrIngr: '',
  });

  useEffect(() => {
    if (!open) return;
    setErrors({});

    // Log para verificar lo que llega
    console.log('periodoActual (prop):', periodoActual);

    if (isEdit) {
      const per = toMonthInputValue(initialValues?.periodo);
      console.log('periodo (edit):', per);
      setForm({
        periodo: per || '', // <= si no se puede derivar, queda ''
        PresMen: String(initialValues?.PresMen ?? ''),
        VentMenOtrIng: String(initialValues?.VentMenOtrIng ?? ''),
        venMenCer: String(initialValues?.venMenCer ?? ''),
        otrIngr: String(initialValues?.otrIngr ?? ''),
      });
    } else {
      // Fallback: si no te pasan periodoActual, usa el mes actual
      const per =
        toMonthInputValue(periodoActual) || toMonthInputValue(new Date());
      console.log('periodo (new):', per);
      setForm({
        periodo: per,
        PresMen: '',
        VentMenOtrIng: '',
        venMenCer: '',
        otrIngr: '',
      });
    }
  }, [open, isEdit, initialValues, periodoActual]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.periodo) e.periodo = 'Requerido';
    const mustNum = (key, label) => {
      const n = toNum(form[key]);
      if (!Number.isFinite(n)) e[key] = `${label} inválido`;
    };
    mustNum('PresMen', 'Presupuesto mensual');
    mustNum('VentMenOtrIng', 'Venta mensual (otros ingresos)');
    mustNum('venMenCer', 'Venta mensual cerámica');
    mustNum('otrIngr', 'Otros ingresos');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const payload = {
      PresMen: toNum(form.PresMen),
      VentMenOtrIng: toNum(form.VentMenOtrIng),
      venMenCer: toNum(form.venMenCer),
      otrIngr: toNum(form.otrIngr),
    };
    try {
      setSaving(true);
      if (isEdit && updateFn) {
        const id = initialValues?.[idKey];
        await updateFn(id, payload);
      } else if (createFn) {
        await createFn(payload);
      } else {
        console.log('Payload (demo):', payload);
      }
      onClose?.();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setErrors((e) => ({ ...e, _root: 'No se pudo guardar' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {isEdit
          ? 'Editar Ingreso por Venta Total'
          : 'Registrar Ingreso por Venta Total'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Periodo (mes/año)"
                type="month"
                fullWidth
                value={form.periodo} // <-- controlado por estado
                InputProps={{ readOnly: true }} // si no quieres que lo cambien
                InputLabelProps={{ shrink: true }}
                error={!!errors.periodo}
                helperText={errors.periodo || 'Ej: 2025-05'}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Presupuesto mensual"
                fullWidth
                value={form.PresMen}
                onChange={(e) => setField('PresMen', e.target.value)}
                error={!!errors.PresMen}
                helperText={errors.PresMen}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Venta mensual (otros ingresos)"
                fullWidth
                value={form.VentMenOtrIng}
                onChange={(e) => setField('VentMenOtrIng', e.target.value)}
                error={!!errors.VentMenOtrIng}
                helperText={errors.VentMenOtrIng}
                inputProps={{ inputMode: 'decimal' }}
                sx={{ width: '300px' }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Venta mensual cerámica"
                fullWidth
                value={form.venMenCer}
                onChange={(e) => setField('venMenCer', e.target.value)}
                error={!!errors.venMenCer}
                helperText={errors.venMenCer}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Otros ingresos"
                fullWidth
                value={form.otrIngr}
                onChange={(e) => setField('otrIngr', e.target.value)}
                error={!!errors.otrIngr}
                helperText={errors.otrIngr}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>

            {errors._root && (
              <Grid item xs={12}>
                <Box sx={{ color: 'error.main', fontSize: 13 }}>
                  {errors._root}
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
