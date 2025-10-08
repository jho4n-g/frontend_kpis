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
import { formatNumber, formatMonthYear } from '../../lib/convert';

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

// numérico robusto
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
  const allowed = '0123456789. ';
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
  if (e.key.length === 1 && !allowed.includes(e.key)) e.preventDefault();
};

export default function PrecioUnitarioModal({
  open,
  onClose,
  onSuccess,
  initialValues = null, // null => crear, objeto => editar
  createFn, // (payload) => Promise
  updateFn, // (id, payload) => Promise
  idKey = 'id',
  // editablePeriodo = false,   // <- ya no lo usamos; el periodo es NO editable siempre
  getPeriodoActual, // <- RENOMBRADO (antes "periodoAcual"): () => Promise<'YYYY-MM'|'YYYY-MM-DD'|Date|string>
}) {
  const isEdit = !!initialValues;

  const [saving, setSaving] = useState(false);
  const [rootError, setRootError] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [touched, setTouched] = useState({});
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const [form, setForm] = useState({
    periodo: '', // YYYY-MM (controlado y NO editable en UI)
    presMen: '',
    precProm: '',
    regionCentro: '',
    regionEste: '',
    regionOeste: '',
    fabrica: '',
    exportacion: '',
  });

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Carga/Inicialización del formulario
  useEffect(() => {
    if (!open) return;
    setShowErrors(false);
    setTouched({});
    setRootError('');

    if (isEdit) {
      // En edición: mostramos el periodo pero NO editable
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
      return;
    }

    // En crear: obtenemos el periodo actual por servicio y lo fijamos (NO editable)
    let cancel = false;
    (async () => {
      try {
        const per = (await getPeriodoActual?.()) ?? '';
        if (cancel) return;
        setForm((f) => ({
          ...f,
          periodo: toMonthInputValue(per),
          presMen: '',
          precProm: '',
          regionCentro: '',
          regionEste: '',
          regionOeste: '',
          fabrica: '',
          exportacion: '',
        }));
      } catch {
        if (!cancel) {
          setForm((f) => ({ ...f, periodo: '' }));
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [open, isEdit, initialValues, getPeriodoActual]);

  // Validaciones
  const errors = useMemo(() => {
    const e = {};
    if (!form.periodo) e.periodo = 'Periodo es requerido';
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
  }, [form]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  // Preview del cumplimiento mensual (solo lectura)
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
    const dots = (clean.match(/\./g) || []).length;
    if (dots > 1) return;
    setField(key, clean);
  };

  const handleSave = async () => {
    setRootError('');
    if (!isValid) {
      setShowErrors(true);
      setTouched({
        presMen: true,
        precProm: true,
        regionCentro: true,
        regionEste: true,
        regionOeste: true,
        fabrica: true,
        exportacion: true,
        periodo: true,
      });
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
        // ⛔️ En UPDATE NO mandamos periodo
        await updateFn(id, numbers);
      } else if (createFn) {
        await createFn({
          periodo: monthToFirstDay(form.periodo), // ✅ en CREATE sí mandamos el periodo
          ...numbers,
        });
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

  const displayPeriodo = React.useMemo(() => {
    if (!form.periodo) return '';
    // Si tu formatMonthYear ya devuelve "Mayo 2025", lo pasamos a minúsculas:
    return formatMonthYear(form.periodo).toLowerCase(); // → "mayo 2025"
  }, [form.periodo]);

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
              value={displayPeriodo}
              // 🔒 NO editable en ningún caso
              disabled
              InputProps={{ readOnly: true }}
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
              error={(showErrors || touched.presMen) && !!errors.presMen}
              helperText={
                showErrors || touched.presMen ? errors.presMen : 'Ej: 12 345.67'
              }
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
              error={(showErrors || touched.precProm) && !!errors.precProm}
              helperText={
                showErrors || touched.precProm
                  ? errors.precProm
                  : 'Ej: 12 345.67'
              }
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
              error={
                (showErrors || touched.regionCentro) && !!errors.regionCentro
              }
              helperText={
                showErrors || touched.regionCentro
                  ? errors.regionCentro
                  : 'Ej: 12 345.67'
              }
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
              error={(showErrors || touched.regionEste) && !!errors.regionEste}
              helperText={
                showErrors || touched.regionEste
                  ? errors.regionEste
                  : 'Ej: 12 345.67'
              }
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
              error={
                (showErrors || touched.regionOeste) && !!errors.regionOeste
              }
              helperText={
                showErrors || touched.regionOeste
                  ? errors.regionOeste
                  : 'Ej: 12 345.67'
              }
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
              error={(showErrors || touched.fabrica) && !!errors.fabrica}
              helperText={
                showErrors || touched.fabrica ? errors.fabrica : 'Ej: 12 345.67'
              }
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
              error={
                (showErrors || touched.exportacion) && !!errors.exportacion
              }
              helperText={
                showErrors || touched.exportacion
                  ? errors.exportacion
                  : 'Ej: 12 345.67'
              }
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
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
