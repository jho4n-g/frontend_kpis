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

// --- Helpers ---
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

// 🔹 Limpia los espacios para enviar al backend
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

export default function CalidadModal({
  open,
  onClose,
  onSuccess,
  initialValues = null, // null => crear, objeto => editar
  createFn, // (payload) => Promise
  updateFn, // (id, payload) => Promise
  idKey = 'id',
  getPeriodoCalidad, // función que retorna el próximo periodo desde backend
}) {
  const isEdit = !!initialValues;
  const [saving, setSaving] = useState(false);
  const [rootError, setRootError] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [touched, setTouched] = useState({});
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const [form, setForm] = useState({
    periodo: '',
    produccionMensual: '',
    presupusto: '',
    produccionPrimeraMensual: '',
    produccionSegundaMensual: '',
    produccionTerceraMensual: '',
    produccionCascoteMensual: '',
  });

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // --- Carga inicial ---
  useEffect(() => {
    if (!open) return;
    setShowErrors(false);
    setTouched({});
    setRootError('');

    if (isEdit) {
      // 🟢 EDICIÓN
      setForm({
        periodo: toMonthInputValue(
          initialValues?.mesCalidad?.periodo || initialValues?.periodo
        ),
        produccionMensual:
          initialValues?.produccionMensual != null
            ? formatNumber(initialValues.produccionMensual)
            : '',
        presupusto:
          initialValues?.presupusto != null
            ? formatNumber(initialValues.presupusto)
            : '',
        produccionPrimeraMensual:
          initialValues?.produccionPrimeraMensual != null
            ? formatNumber(initialValues.produccionPrimeraMensual)
            : '',
        produccionSegundaMensual:
          initialValues?.produccionSegundaMensual != null
            ? formatNumber(initialValues.produccionSegundaMensual)
            : '',
        produccionTerceraMensual:
          initialValues?.produccionTerceraMensual != null
            ? formatNumber(initialValues.produccionTerceraMensual)
            : '',
        produccionCascoteMensual:
          initialValues?.produccionCascoteMensual != null
            ? formatNumber(initialValues.produccionCascoteMensual)
            : '',
      });
      return;
    }

    // 🟢 CREAR: obtener periodo desde backend
    let cancel = false;
    (async () => {
      try {
        const data = await getPeriodoCalidad?.();
        if (cancel) return;
        setForm((f) => ({
          ...f,
          periodo: toMonthInputValue(data?.periodo),
          produccionMensual: '',
          presupusto: '',
          produccionPrimeraMensual: '',
          produccionSegundaMensual: '',
          produccionTerceraMensual: '',
          produccionCascoteMensual: '',
        }));
      } catch (e) {
        console.error('❌ Error al obtener periodo:', e);
        if (!cancel) setForm((f) => ({ ...f, periodo: '' }));
      }
    })();
    return () => {
      cancel = true;
    };
  }, [open, isEdit, initialValues, getPeriodoCalidad]);

  // --- Validaciones ---
  const errors = useMemo(() => {
    const e = {};
    if (!form.periodo) e.periodo = 'Periodo es requerido';
    const fields = [
      'produccionMensual',
      'presupusto',
      'produccionPrimeraMensual',
      'produccionSegundaMensual',
      'produccionTerceraMensual',
      'produccionCascoteMensual',
    ];
    for (const k of fields) {
      const n = parseInputNumber(form[k]);
      if (n == null || n < 0) e[k] = 'Valor inválido';
    }
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  // 🔹 Formateo dinámico usando tu formatNumber()
  const onChangeNumber = (key) => (e) => {
    const value = e.target.value;
    setField(key, formatNumber(value));
  };

  const handleSave = async () => {
    setRootError('');
    if (!isValid) {
      setShowErrors(true);
      setRootError('Corrige los campos marcados.');
      return;
    }

    const payload = {
      produccionMensual: parseInputNumber(form.produccionMensual),
      presupusto: parseInputNumber(form.presupusto),
      produccionPrimeraMensual: parseInputNumber(form.produccionPrimeraMensual),
      produccionSegundaMensual: parseInputNumber(form.produccionSegundaMensual),
      produccionTerceraMensual: parseInputNumber(form.produccionTerceraMensual),
      produccionCascoteMensual: parseInputNumber(form.produccionCascoteMensual),
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
      console.error('❌ Error al guardar:', err);
      setRootError('Error al guardar. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const displayPeriodo = useMemo(() => {
    if (!form.periodo) return '';
    return formatMonthYear(form.periodo).toLowerCase(); // ej: "julio 2025"
  }, [form.periodo]);

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {isEdit ? 'Editar Registro de Calidad' : 'Registrar Calidad'}
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
              disabled
              InputProps={{ readOnly: true }}
              InputLabelProps={{ shrink: true }}
              error={!!errors.periodo}
              helperText={errors.periodo || ''}
            />
          </Grid>

          {[
            ['produccionMensual', 'Producción Mensual'],
            ['presupusto', 'Presupuesto'],
            ['produccionPrimeraMensual', 'Producción Primera Mensual'],
            ['produccionSegundaMensual', 'Producción Segunda Mensual'],
            ['produccionTerceraMensual', 'Producción Tercera Mensual'],
            ['produccionCascoteMensual', 'Producción Cascote Mensual'],
          ].map(([key, label]) => (
            <Grid item xs={12} sm={4} key={key}>
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
                    : 'Ej: 1 234.56'
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
