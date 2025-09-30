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

import { formatNumber } from '../../lib/convert';

// --- utils ---
const toNum = (v) =>
  typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v);
const normalizePercent01 = (v) => {
  const n = toNum(v);
  if (!Number.isFinite(n)) return null;
  return n > 1 ? n / 100 : n; // 90 -> 0.9
};
const toMonthInputValue = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d)) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`; // para <input type="month">
};
const toISODateFromMonth = (monthStr) => (monthStr ? `${monthStr}-01` : null);

// --- Modal (crea / edita) ---
export default function UtilityUpsertModal({
  open,
  onClose,
  onSuccess,
  initialValues = null, // si viene => modo edición
  createFn, // (payload) => Promise
  updateFn, // (id, payload) => Promise
  idKey = 'id', // clave del id en initialValues ('id' o '_id')
}) {
  const isEdit = !!initialValues;
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    periodo: '', // YYYY-MM
    mensualidad_mensual: '',
    meta_mensual: '',
    utilidades_acumuladas: '',
    meta_acumulada: '',
    meta: '', // 0-1 o 0-100
    cumplimento_mensual: '', // OJO: usar la misma key que tu API
    cumplimiento_acumulado: '', // 0-1 o 0-100
  });

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (initialValues) {
      // Prefill desde el registro existente
      setForm({
        periodo: toMonthInputValue(initialValues.periodo),
        mensualidad_mensual: initialValues.mensualidad_mensual ?? '',
        meta_mensual: initialValues.meta_mensual ?? '',
        utilidades_acumuladas: initialValues.utilidades_acumuladas ?? '',
        meta_acumulada: initialValues.meta_acumulada ?? '',
        meta: initialValues.meta ?? '',
        // acepta ambos nombres por si tu API cambia el typo
        cumplimento_mensual:
          initialValues.cumplimento_mensual ??
          initialValues.cumplimiento_mensual ??
          '',
        cumplimiento_acumulado: initialValues.cumplimiento_acumulado ?? '',
      });
    } else {
      setForm({
        periodo: '',
        mensualidad_mensual: '',
        meta_mensual: '',
        utilidades_acumuladas: '',
        meta_acumulada: '',
        meta: '',
        cumplimento_mensual: '',
        cumplimiento_acumulado: '',
      });
    }
  }, [open, initialValues]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.periodo) e.periodo = 'Requerido';

    const reqNum = (val, key, label) => {
      const n = toNum(val);
      if (!Number.isFinite(n)) e[key] = `${label} inválido`;
    };
    reqNum(form.mensualidad_mensual, 'mensualidad_mensual', 'Mensualidad');
    reqNum(form.meta_mensual, 'meta_mensual', 'Meta mensual');
    reqNum(
      form.utilidades_acumuladas,
      'utilidades_acumuladas',
      'Utilidades acumuladas'
    );
    reqNum(form.meta_acumulada, 'meta_acumulada', 'Meta acumulada');

    const pMeta = normalizePercent01(form.meta);
    if (pMeta == null || pMeta < 0 || pMeta > 1)
      e.meta = 'Meta debe ser 0–1 o 0–100';

    const pCM = normalizePercent01(form.cumplimento_mensual);
    if (pCM == null || pCM < 0 || pCM > 1)
      e.cumplimento_mensual = 'Cumpl. mensual 0–1 o 0–100';

    const pCA = normalizePercent01(form.cumplimiento_acumulado);
    if (pCA == null || pCA < 0 || pCA > 1)
      e.cumplimiento_acumulado = 'Cumpl. acumulado 0–1 o 0–100';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    // payload normalizado para tu API
    const payload = {
      periodo: toISODateFromMonth(form.periodo),
      mensualidad_mensual: toNum(form.mensualidad_mensual),
      meta_mensual: toNum(form.meta_mensual),
      utilidades_acumuladas: toNum(form.utilidades_acumuladas),
      meta_acumulada: toNum(form.meta_acumulada),
      meta: normalizePercent01(form.meta),
      cumplimento_mensual: normalizePercent01(form.cumplimento_mensual),
      cumplimiento_acumulado: normalizePercent01(form.cumplimiento_acumulado),
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
        {isEdit ? 'Editar Utilidad' : 'Registrar Utilidad'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Periodo (mes/año)"
                type="month"
                fullWidth
                value={form.periodo}
                onChange={(e) => setField('periodo', e.target.value)}
                error={!!errors.periodo}
                helperText={errors.periodo || 'Ej: 2025-05'}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Mensualidad"
                type="text"
                fullWidth
                value={formatNumber(form.mensualidad_mensual)}
                onChange={(e) => {
                  let raw = e.target.value.replace(/\s/g, '').replace(',', '.'); // permite coma -> punto
                  raw = raw.replace(/[^0-9.]/g, ''); // solo números y punto
                  const dots = (raw.match(/\./g) || []).length;
                  if (dots > 1) return; // evita 2 puntos
                  if (raw.startsWith('.')) raw = '0' + raw; // ".5" -> "0.5"
                  setField('mensualidad_mensual', raw);
                }}
                onBlur={() => {
                  // opcional: al salir, normaliza "123." -> "123" y quita ceros innecesarios
                  const s = String(form.mensualidad_mensual ?? '').replace(
                    /\s/g,
                    ''
                  );
                  if (s === '' || s === '.')
                    return setField('mensualidad_mensual', '');
                  const n = Number(s);
                  if (Number.isFinite(n))
                    setField('mensualidad_mensual', String(n));
                }}
                error={!!errors.mensualidad_mensual}
                helperText={errors.mensualidad_mensual}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Meta mensual"
                fullWidth
                value={form.meta_mensual}
                onChange={(e) => setField('meta_mensual', e.target.value)}
                error={!!errors.meta_mensual}
                helperText={errors.meta_mensual}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Utilidades acumuladas"
                fullWidth
                value={form.utilidades_acumuladas}
                onChange={(e) =>
                  setField('utilidades_acumuladas', e.target.value)
                }
                error={!!errors.utilidades_acumuladas}
                helperText={errors.utilidades_acumuladas}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Meta acumulada"
                fullWidth
                value={form.meta_acumulada}
                onChange={(e) => setField('meta_acumulada', e.target.value)}
                error={!!errors.meta_acumulada}
                helperText={errors.meta_acumulada}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Meta (%)"
                fullWidth
                value={form.meta}
                onChange={(e) => setField('meta', e.target.value)}
                error={!!errors.meta}
                helperText={errors.meta || 'Ingresa 90 o 0.9'}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Cumpl. mensual (%)"
                fullWidth
                value={form.cumplimento_mensual}
                onChange={(e) =>
                  setField('cumplimento_mensual', e.target.value)
                }
                error={!!errors.cumplimento_mensual}
                helperText={errors.cumplimento_mensual || 'Ingresa 50 o 0.5'}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Cumpl. acumulado (%)"
                fullWidth
                value={form.cumplimiento_acumulado}
                onChange={(e) =>
                  setField('cumplimiento_acumulado', e.target.value)
                }
                error={!!errors.cumplimiento_acumulado}
                helperText={errors.cumplimiento_acumulado || 'Ingresa 70 o 0.7'}
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
