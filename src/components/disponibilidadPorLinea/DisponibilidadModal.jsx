import React from 'react';
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
  Typography,
} from '@mui/material';
import { formatMonthYear } from '../../lib/convert.js';

// ===== Constantes / helpers =====
const HORAS_MES = 696;

// Acepta Date | 'YYYY-MM' | 'YYYY-MM-DD' | string y devuelve 'YYYY-MM'
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

// Sanitiza para **enteros** (horas)
const sanitizeInt = (s) => String(s ?? '').replace(/[^\d]/g, '');
const parseIntSafe = (str) => {
  if (str == null || str === '') return null;
  const n = Number.parseInt(String(str).trim(), 10);
  return Number.isFinite(n) ? n : null;
};
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Teclado: solo dígitos y teclas de control
const integerKeyFilter = (e) => {
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
  if (!/^\d$/.test(e.key)) e.preventDefault();
};

// ===== Componente =====
export default function DisponibilidadModal({
  open,
  onClose,
  onSuccess,
  initialValues = null, // null => crear, objeto => editar
  createFn, // (payload) => Promise
  updateFn, // (id, payload) => Promise
  idKey = 'id',
  getPeriodoSiguiente, // () => Promise<'YYYY-MM'|'YYYY-MM-DD'|Date|string>
}) {
  const isEdit = !!initialValues;

  const [saving, setSaving] = React.useState(false);
  const [rootError, setRootError] = React.useState('');
  const [showErrors, setShowErrors] = React.useState(false);
  const [touched, setTouched] = React.useState({});
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const [form, setForm] = React.useState({
    periodo: '', // YYYY-MM solo para mostrar (texto, no editable)
    nroHorasProactivasPlanificadas: '',
    nroHorasParadasLineaB: '',
    nroHorasParadasLineaC: '',
    nroHorasParadasLineaD: '',
  });

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Carga/Inicialización del formulario
  React.useEffect(() => {
    if (!open) return;
    setShowErrors(false);
    setTouched({});
    setRootError('');

    // Edición: usa el periodo del registro (mostramos solo)
    if (isEdit) {
      setForm({
        periodo: toMonthInputValue(initialValues?.periodo),
        nroEstasProactivasPlanificadas: undefined, // para evitar typos
        nroHorasProactivasPlanificadas:
          initialValues?.nroHorasProactivasPlanificadas != null
            ? String(initialValues.nroHorasProactivasPlanificadas)
            : '',
        nroHorasParadasLineaB:
          initialValues?.nroHorasParadasLineaB != null
            ? String(initialValues.nroHorasParadasLineaB)
            : '',
        nroHorasParadasLineaC:
          initialValues?.nroHorasParadasLineaC != null
            ? String(initialValues.nroHorasParadasLineaC)
            : '',
        nroHorasParadasLineaD:
          initialValues?.nroHorasParadasLineaD != null
            ? String(initialValues.nroHorasParadasLineaD)
            : '',
      });
      return;
    }

    // Crear: obtiene el periodo siguiente (no editable, solo mostrar)
    let cancel = false;
    (async () => {
      try {
        const per = (await getPeriodoSiguiente?.()) ?? '';
        console.log('modal disponi', per);
        if (cancel) return;
        setForm((f) => ({
          ...f,
          periodo: toMonthInputValue(per.periodo),
          nroHorasProactivasPlanificadas: '',
          nroHorasParadasLineaB: '',
          nroHorasParadasLineaC: '',
          nroHorasParadasLineaD: '',
        }));
      } catch {
        if (!cancel) setForm((f) => ({ ...f, periodo: '' }));
      }
    })();
    return () => {
      cancel = true;
    };
  }, [open, isEdit, initialValues, getPeriodoSiguiente]);

  // ===== Validaciones (horas 0..696 enteras) =====
  const errors = React.useMemo(() => {
    const e = {};
    if (!form.periodo) e.periodo = 'Periodo no disponible';
    const req = [
      ['nroHorasProactivasPlanificadas', 'Horas proactivas planificadas'],
      ['nroHorasParadasLineaB', 'Horas de paradas Línea B'],
      ['nroHorasParadasLineaC', 'Horas de paradas Línea C'],
      ['nroHorasParadasLineaD', 'Horas de paradas Línea D'],
    ];
    for (const [k, label] of req) {
      const n = parseIntSafe(form[k]);
      if (!Number.isFinite(n)) e[k] = `${label} inválidas (usa enteros)`;
      else if (n < 0 || n > HORAS_MES)
        e[k] = `${label} deben estar entre 0 y ${HORAS_MES}`;
    }
    return e;
  }, [form]);

  const isValid = React.useMemo(
    () => Object.keys(errors).length === 0,
    [errors]
  );

  // Handlers de cambio (enteros)
  const onChangeInt = (key) => (e) => {
    const clean = sanitizeInt(e.target.value);
    setField(key, clean);
  };

  const handleSave = async () => {
    setRootError('');
    if (!isValid) {
      setShowErrors(true);
      setTouched({
        nroHorasProactivasPlanificadas: true,
        nroHorasParadasLineaB: true,
        nroHorasParadasLineaC: true,
        nroHorasParadasLineaD: true,
        periodo: true,
      });
      setRootError('Revisa los campos marcados.');
      return;
    }

    // Solo enviamos las 4 horas (enteros)
    const payload = {
      nroHorasProactivasPlanificadas: clamp(
        parseIntSafe(form.nroHorasProactivasPlanificadas) ?? 0,
        0,
        HORAS_MES
      ),
      nroHorasParadasLineaB: clamp(
        parseIntSafe(form.nroHorasParadasLineaB) ?? 0,
        0,
        HORAS_MES
      ),
      nroHorasParadasLineaC: clamp(
        parseIntSafe(form.nroHorasParadasLineaC) ?? 0,
        0,
        HORAS_MES
      ),
      nroHorasParadasLineaD: clamp(
        parseIntSafe(form.nroHorasParadasLineaD) ?? 0,
        0,
        HORAS_MES
      ),
    };

    try {
      setSaving(true);
      if (isEdit && updateFn) {
        const id = initialValues?.[idKey];
        await updateFn(id, payload); // UPDATE: sin periodo
      } else if (createFn) {
        await createFn(payload); // CREATE: sin periodo (lo decide backend)
      }
      onClose?.();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setRootError(err?.message || 'No se pudo guardar. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  // Texto a mostrar del periodo: "Mayo 2025"
  const periodoTexto = React.useMemo(() => {
    if (!form.periodo) return '—';
    // formatMonthYear ya formatea "YYYY-MM" → "Mayo 2025" (según tu helper)
    return formatMonthYear(form.periodo);
  }, [form.periodo]);

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {isEdit ? 'Editar Disponibilidad' : 'Registrar Disponibilidad'}
      </DialogTitle>

      <DialogContent dividers>
        {rootError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {rootError}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Periodo como TEXTO (no editable) */}
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                p: 1.5,
                border: '1px solid',
                borderColor: errors.periodo ? 'error.main' : 'divider',
                borderRadius: 1,
                bgcolor: 'background.default',
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', minWidth: 140 }}
              >
                Periodo
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {periodoTexto}
              </Typography>
            </Box>
            {showErrors && errors.periodo && (
              <Typography variant="caption" color="error">
                {errors.periodo}
              </Typography>
            )}
          </Grid>

          {/* Campos de HORAS (enteros) */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Horas proactivas planificadas"
              fullWidth
              value={form.nroHorasProactivasPlanificadas}
              onChange={onChangeInt('nroHorasProactivasPlanificadas')}
              onKeyDown={integerKeyFilter}
              onBlur={() => markTouched('nroHorasProactivasPlanificadas')}
              error={
                (showErrors || touched.nroHorasProactivasPlanificadas) &&
                !!errors.nroHorasProactivasPlanificadas
              }
              helperText={
                showErrors || touched.nroHorasProactivasPlanificadas
                  ? errors.nroHorasProactivasPlanificadas
                  : `Entero 0–${HORAS_MES}`
              }
              inputProps={{ inputMode: 'numeric' }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Paradas Línea B (horas)"
              fullWidth
              value={form.nroHorasParadasLineaB}
              onChange={onChangeInt('nroHorasParadasLineaB')}
              onKeyDown={integerKeyFilter}
              onBlur={() => markTouched('nroHorasParadasLineaB')}
              error={
                (showErrors || touched.nroHorasParadasLineaB) &&
                !!errors.nroHorasParadasLineaB
              }
              helperText={
                showErrors || touched.nroHorasParadasLineaB
                  ? errors.nroHorasParadasLineaB
                  : `Entero 0–${HORAS_MES}`
              }
              inputProps={{ inputMode: 'numeric' }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Paradas Línea C (horas)"
              fullWidth
              value={form.nroHorasParadasLineaC}
              onChange={onChangeInt('nroHorasParadasLineaC')}
              onKeyDown={integerKeyFilter}
              onBlur={() => markTouched('nroHorasParadasLineaC')}
              error={
                (showErrors || touched.nroHorasParadasLineaC) &&
                !!errors.nroHorasParadasLineaC
              }
              helperText={
                showErrors || touched.nroHorasParadasLineaC
                  ? errors.nroHorasParadasLineaC
                  : `Entero 0–${HORAS_MES}`
              }
              inputProps={{ inputMode: 'numeric' }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Paradas Línea D (horas)"
              fullWidth
              value={form.nroHorasParadasLineaD}
              onChange={onChangeInt('nroHorasParadasLineaD')}
              onKeyDown={integerKeyFilter}
              onBlur={() => markTouched('nroHorasParadasLineaD')}
              error={
                (showErrors || touched.nroHorasParadasLineaD) &&
                !!errors.nroHorasParadasLineaD
              }
              helperText={
                showErrors || touched.nroHorasParadasLineaD
                  ? errors.nroHorasParadasLineaD
                  : `Entero 0–${HORAS_MES}`
              }
              inputProps={{ inputMode: 'numeric' }}
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
