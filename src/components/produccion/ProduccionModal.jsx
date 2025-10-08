import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { formatNumber, formatMonthYear } from '../../lib/convert';

// === Helpers reutilizados ===
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

const parseInputNumber = (str) => {
  if (!str) return null;
  const n = Number(String(str).replace(/\s+/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const numericKeyFilter = (e) => {
  const allowed = '0123456789.';
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

// === MODAL PRINCIPAL ===
export default function ProduccionModal({
  open,
  onClose,
  onSuccess,
  initialValues = null,
  createFn, // POST
  updateFn, // PUT
  idKey = 'id',
  getPeriodoProduccion, // obtiene el próximo periodo
}) {
  const isEdit = !!initialValues;
  const [saving, setSaving] = useState(false);
  const [rootError, setRootError] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [touched, setTouched] = useState({});
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const [form, setForm] = useState({
    periodo: '',
    presu: '',
    producMen: '',
  });

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // === CARGA INICIAL ===
  useEffect(() => {
    if (!open) return;
    setShowErrors(false);
    setTouched({});
    setRootError('');

    if (isEdit) {
      // EDICIÓN
      setForm({
        periodo: toMonthInputValue(initialValues?.periodo),
        presu:
          initialValues?.presu != null ? formatNumber(initialValues.presu) : '',
        producMen:
          initialValues?.producMen != null
            ? formatNumber(initialValues.producMen)
            : '',
      });
      return;
    }

    // CREAR — obtiene el próximo periodo
    let cancel = false;
    (async () => {
      try {
        const data = await getPeriodoProduccion?.();
        if (cancel) return;
        setForm({
          periodo: toMonthInputValue(data?.periodo),
          presu: '',
          producMen: '',
        });
      } catch (e) {
        console.error('❌ Error al obtener periodo:', e);
        if (!cancel) setForm((f) => ({ ...f, periodo: '' }));
      }
    })();

    return () => {
      cancel = true;
    };
  }, [open, isEdit, initialValues, getPeriodoProduccion]);

  // === VALIDACIONES ===
  const errors = useMemo(() => {
    const e = {};
    if (!form.periodo) e.periodo = 'Periodo es requerido';
    const fields = ['presu', 'producMen'];
    for (const k of fields) {
      const n = parseInputNumber(form[k]);
      if (n == null || n < 0) e[k] = 'Valor inválido';
    }
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const onChangeNumber = (key) => (e) => {
    const value = e.target.value;
    setField(key, formatNumber(value));
  };

  // === GUARDAR ===
  const handleSave = async () => {
    setRootError('');
    if (!isValid) {
      setShowErrors(true);
      setRootError('Corrige los campos marcados.');
      return;
    }

    const payload = {
      presu: parseInputNumber(form.presu),
      producMen: parseInputNumber(form.producMen),
    };

    try {
      setSaving(true);
      if (isEdit && updateFn) {
        const id = initialValues?.[idKey];
        await updateFn(id, payload);
      } else if (createFn) {
        await createFn({
          periodo: monthToFirstDay(form.periodo),
          ...payload,
        });
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('❌ Error al guardar producción:', err);
      setRootError('Error al guardar. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const displayPeriodo = useMemo(() => {
    if (!form.periodo) return '';
    return formatMonthYear(form.periodo).toLowerCase();
  }, [form.periodo]);

  // === RENDER ===
  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {isEdit ? 'Editar Registro de Producción' : 'Registrar Producción'}
      </DialogTitle>

      <DialogContent dividers>
        {rootError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {rootError}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Periodo (mes/año)"
              type="month"
              fullWidth
              value={displayPeriodo}
              disabled
              InputProps={{ readOnly: true }}
              InputLabelProps={{ shrink: true }}
              error={!!errors.periodo}
              helperText={errors.periodo || ''}
            />
          </Grid>

          {[
            ['presu', 'Presupuesto'],
            ['producMen', 'Producción Mensual'],
          ].map(([key, label]) => (
            <Grid item xs={12} sm={6} key={key}>
              <TextField
                label={label}
                fullWidth
                value={form[key]}
                onChange={onChangeNumber(key)}
                onKeyDown={numericKeyFilter}
                onBlur={() => markTouched(key)}
                error={(showErrors || touched[key]) && !!errors[key]}
                helperText={
                  (showErrors || touched[key]) && errors[key]
                    ? errors[key]
                    : 'Ej: 123 456.78'
                }
                onPaste={(e) => {
                  const text = e.clipboardData.getData('text');
                  e.preventDefault();
                  setField(key, formatNumber(text));
                }}
              />
            </Grid>
          ))}
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
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
