import React, { useEffect, useMemo, useState } from 'react';
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
  Alert,
} from '@mui/material';
import { formatNumber } from '../../lib/convert';

// ---- Helpers ----
const toMonthInputValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4}-\d{2})(?:-\d{2}.*)?$/);
    if (m) return m[1];
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};
const monthToFirstDay = (m) => (m ? `${m}-01` : null);

// numérico robusto: quita espacios, cambia coma por punto, mantiene solo dígitos y punto
const sanitizeInput = (s) =>
  String(s ?? '')
    .replace(/,/g, '.')
    .replace(/[^\d. ]+/g, '')
    .trim();
const parseInputNumber = (str) => {
  if (str == null || str === '') return null;
  const n = Number(String(str).replace(/\s+/g, ''));
  return Number.isFinite(n) ? n : null;
};
const numericKeyFilter = (e) => {
  const allowedChars = '0123456789. ';
  const ctrl = [
    'Backspace',
    'Delete',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'Tab',
    'Enter',
  ];
  if (e.ctrlKey || e.metaKey || e.altKey || ctrl.includes(e.key)) return;
  if (e.key.length === 1 && !allowedChars.includes(e.key)) e.preventDefault();
};

export default function PrecioUnitarioModal({
  open,
  onClose,
  onSuccess,
  initialValues = null, // null => crear, objeto => editar
  createFn, // (payload) => Promise
  updateFn, // (id, payload) => Promise
  idKey = 'id',
  editablePeriodo = false,
  periodoAcual,
}) {
  const isEdit = !!initialValues;

  const [saving, setSaving] = useState(false);
  const [rootError, setRootError] = useState('');

  const [showErrors, setShowErrors] = useState(false);
  const [touched, setTouched] = useState({});
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const hasErr = (k) => (showErrors || touched[k]) && !!errors[k];
  const help = (k, placeholder) => (hasErr(k) ? errors[k] : placeholder);

  const [form, setForm] = useState({
    periodo: '', // YYYY-MM
    presMen: '',
    precProm: '',
    regionCentro: '',
    regionEste: '',
    regionOeste: '',
    fabrica: '',
    exportacion: '',
  });

  useEffect(() => {
    if (!open) return;
    setShowErrors(false);
    setTouched({});
    setRootError('');
    if (isEdit) {
      setForm({
        periodo: toMonthInputValue(initialValues?.periodo),
        presMen:
          initialValues?.presMen != null
            ? formatNumber(initialValues.presMen)
            : '',
        precProm:
          initialValues?.precProm != null
            ? formatNumber(initialValues.precProm)
            : '',
        regionCentro:
          initialValues?.regionCentro != null
            ? formatNumber(initialValues.regionCentro)
            : '',
        regionEste:
          initialValues?.regionEste != null
            ? formatNumber(initialValues.regionEste)
            : '',
        regionOeste:
          initialValues?.regionOeste != null
            ? formatNumber(initialValues.regionOeste)
            : '',
        fabrica:
          initialValues?.fabrica != null
            ? formatNumber(initialValues.fabrica)
            : '',
        exportacion:
          initialValues?.exportacion != null
            ? formatNumber(initialValues.exportacion)
            : '',
      });
    } else {
      const per =
        toMonthInputValue(periodoAcual) || toMonthInputValue(new Date());
      setForm({
        periodo: per,
        presMen: '',
        precProm: '',
        regionCentro: '',
        regionEste: '',
        regionOeste: '',
        fabrica: '',
        exportacion: '',
      });
    }
  }, [open, isEdit, initialValues, periodoAcual]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Validaciones
  const errors = useMemo(() => {
    const e = {};
    if (!form.periodo && !isEdit) e.periodo = 'Periodo es requerido';
    const requiredFields = [
      ['presMen', 'Presupuesto mensual'],
      ['precProm', 'Precio promedio'],
      ['regionCentro', 'Región Centro'],
      ['regionEste', 'Región Este'],
      ['regionOeste', 'Región Oeste'],
      ['fabrica', 'Fábrica'],
      ['exportacion', 'Exportación'],
    ];
    for (const [k, label] of requiredFields) {
      const n = parseInputNumber(form[k]);
      if (!Number.isFinite(n)) e[k] = `${label} inválido`;
    }
    return e;
  }, [form, isEdit]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  // precálculo visible del cumplimiento mensual (solo lectura)
  const cumplimientoMensual = useMemo(() => {
    const pres = parseInputNumber(form.presMen);
    const prom = parseInputNumber(form.precProm);
    if (!Number.isFinite(pres) || pres <= 0 || !Number.isFinite(prom))
      return '—';
    const r = prom / pres;
    return (
      (r * 100).toLocaleString('es-BO', { maximumFractionDigits: 2 }) + '%'
    );
  }, [form.presMen, form.precProm]);

  const onChangeNumber = (key) => (e) => {
    const clean = sanitizeInput(e.target.value);
    // evitar más de un punto
    const dots = (clean.match(/\./g) || []).length;
    if (dots > 1) return;
    setField(key, clean);
  };

  const handleSave = async () => {
    setRootError('');

    if (!isValid) {
      setShowErrors(true); // ✅ fuerza a mostrar errores
      setTouched({
        presMen: true,
        precProm: true,
        regionCentro: true,
        regionEste: true,
        regionOeste: true,
        fabrica: true,
        exportacion: true,
        periodo: true,
      }); // opcional: marca todo como tocado
      setRootError('Revisa los campos marcados.');
      return;
    }

    const numbers = {
      presMen: parseInputNumber(form.presMen) ?? 0,
      precProm: parseInputNumber(form.precProm) ?? 0,
      regionCentro: parseInputNumber(form.regionCentro) ?? 0,
      regionEste: parseInputNumber(form.regionEste) ?? 0,
      regionOeste: parseInputNumber(form.regionOeste) ?? 0,
      fabrica: parseInputNumber(form.fabrica) ?? 0,
      exportacion: parseInputNumber(form.exportacion) ?? 0,
    };

    try {
      setSaving(true);
      if (isEdit && updateFn) {
        const id = initialValues?.[idKey];
        console.log(numbers);
        // ⛔️ En UPDATE no mandamos periodo (tu backend lo recalcula/protege)
        await updateFn(id, numbers);
      } else if (createFn) {
        await createFn({
          periodo: monthToFirstDay(form.periodo), // ✅ CREATE: aquí sí
          ...numbers,
        });
      } else {
        console.log('Payload (demo):', { isEdit, ...numbers });
      }
      onClose?.();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setRootError('No se pudo guardar. Intenta nuevamente.');
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
        {isEdit ? 'Editar Precio Unitario' : 'Registrar Precio Unitario'}
      </DialogTitle>
      <DialogContent dividers>
        {rootError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {rootError}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Periodo (mes/año)"
              type="month"
              fullWidth
              value={form.periodo}
              onChange={(e) => setField('periodo', e.target.value)}
              InputProps={{ readOnly: isEdit && !editablePeriodo }}
              InputLabelProps={{ shrink: true }}
              error={!!errors.periodo}
              helperText={errors.periodo || 'Ej: 2025-05'}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Presupuesto mensual"
              fullWidth
              value={formatNumber(form.presMen)}
              onChange={onChangeNumber('presMen')}
              onBlur={() => markTouched('presMen')}
              error={hasErr('presMen')}
              helperText={help('presMen', 'Ej: 12 345.67')}
              inputProps={{ inputMode: 'decimal' }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Precio promedio"
              fullWidth
              value={formatNumber(form.precProm)}
              onChange={onChangeNumber('precProm')}
              onKeyDown={numericKeyFilter}
              onBlur={() => markTouched('precProm')}
              error={hasErr('precProm')}
              helperText={help('precProm', 'Ej: 12 345.67')}
              inputProps={{ inputMode: 'decimal' }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Región Centro"
              fullWidth
              value={formatNumber(form.regionCentro)}
              onChange={onChangeNumber('regionCentro')}
              onKeyDown={numericKeyFilter}
              onBlur={() => markTouched('regionCentro')}
              error={hasErr('regionCentro')}
              helperText={help('regionCentro', 'Ej: 12 345.67')}
              inputProps={{ inputMode: 'decimal' }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Región Este"
              fullWidth
              value={formatNumber(form.regionEste)}
              onChange={onChangeNumber('regionEste')}
              onKeyDown={numericKeyFilter}
              onBlur={() => markTouched('regionEste')}
              error={hasErr('regionEste')}
              helperText={help('regionEste', 'Ej: 12 345.67')}
              inputProps={{ inputMode: 'decimal' }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Región Oeste"
              fullWidth
              value={formatNumber(form.regionOeste)}
              onChange={onChangeNumber('regionOeste')}
              onKeyDown={numericKeyFilter}
              onBlur={() => markTouched('regionOeste')}
              error={hasErr('regionOeste')}
              helperText={help('regionOeste', 'Ej: 12 345.67')}
              inputProps={{ inputMode: 'decimal' }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Fábrica"
              fullWidth
              value={formatNumber(form.fabrica)}
              onChange={onChangeNumber('fabrica')}
              onKeyDown={numericKeyFilter}
              onBlur={() => markTouched('fabrica')}
              error={hasErr('fabrica')}
              helperText={help('fabrica', 'Ej: 12 345.67')}
              inputProps={{ inputMode: 'decimal' }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Exportación"
              fullWidth
              value={formatNumber(form.exportacion)}
              onChange={onChangeNumber('exportacion')}
              onKeyDown={numericKeyFilter}
              onBlur={() => markTouched('exportacion')}
              error={hasErr('exportacion')}
              helperText={help('exportacion', 'Ej: 12 345.67')}
              inputProps={{ inputMode: 'decimal' }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Cumplimiento mensual (preview)"
              fullWidth
              value={cumplimientoMensual}
              InputProps={{ readOnly: true }}
              helperText="Se recalcula automáticamente (precProm / presMen)"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          //disabled={saving || !isValid}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
