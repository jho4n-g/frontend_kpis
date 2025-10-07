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

// --- Helpers ---
const sanitizeInput = (s) =>
  String(s ?? '')
    .replace(/,/g, '.')
    .replace(/[^\d.]+/g, '')
    .trim();

const parseInputNumber = (str) => {
  if (!str) return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
};

const numericKeyFilter = (e) => {
  const allowed = '0123456789.';
  const ctrl = [
    'Backspace',
    'Delete',
    'ArrowLeft',
    'ArrowRight',
    'Tab',
    'Enter',
  ];
  if (ctrl.includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (!allowed.includes(e.key)) e.preventDefault();
};

// --- Componente principal ---
export default function CalidadMetaModal({
  open,
  onClose,
  onSuccess,
  updateMeta, // async (payload: { metaPrimera, metaCascote }) => void
  initialValues = {},
}) {
  const [saving, setSaving] = useState(false);
  const [rootError, setRootError] = useState('');
  const [form, setForm] = useState({ metaPrimera: '', metaCascote: '' });
  const [touched, setTouched] = useState({});
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setRootError('');
    setTouched({});
    setShowErrors(false);

    // Mostrar al usuario valores *en porcentaje* (×100)
    setForm({
      metaPrimera:
        initialValues.metaPrimera != null
          ? String(Number(initialValues.metaPrimera) * 100)
          : '',
      metaCascote:
        initialValues.metaCascote != null
          ? String(Number(initialValues.metaCascote) * 100)
          : '',
    });
  }, [open]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

  // --- Validaciones (ahora de 1 a 100) ---
  const errors = useMemo(() => {
    const e = {};
    const mp = parseInputNumber(form.metaPrimera);
    const mc = parseInputNumber(form.metaCascote);

    if (mp != null && (mp < 0 || mp > 100))
      e.metaPrimera = 'Debe estar entre 0 y 100';
    if (mc != null && (mc < 0 || mc > 100))
      e.metaCascote = 'Debe estar entre 0 y 100';
    return e;
  }, [form]);

  const hasErr = (k) => (showErrors || touched[k]) && !!errors[k];
  const help = (k, placeholder) => (hasErr(k) ? errors[k] : placeholder);
  const isValid = Object.keys(errors).length === 0;

  const handleSave = async () => {
    setRootError('');
    if (!isValid) {
      setShowErrors(true);
      setRootError('Corrige los campos marcados.');
      return;
    }

    const mp = parseInputNumber(form.metaPrimera);
    const mc = parseInputNumber(form.metaCascote);

    // Dividir entre 100 antes de enviar al backend ✅
    const payload = {
      metaPrimera: mp != null ? mp / 100 : null,
      metaCascote: mc != null ? mc / 100 : null,
    };

    try {
      setSaving(true);
      await updateMeta(payload);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error('❌ Error al guardar metas:', err);
      const backendMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Error al guardar metas.';
      setRootError(backendMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Cambiar metas de Calidad</DialogTitle>
      <DialogContent dividers>
        {rootError && (
          <Alert
            severity={rootError.includes('meta inválida') ? 'warning' : 'error'}
            sx={{ mb: 2 }}
          >
            {rootError}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Meta Primera (%)"
              fullWidth
              value={form.metaPrimera}
              onChange={(e) =>
                setField('metaPrimera', sanitizeInput(e.target.value))
              }
              onKeyDown={numericKeyFilter}
              onBlur={() => markTouched('metaPrimera')}
              error={hasErr('metaPrimera')}
              helperText={help('metaPrimera', 'Ej: 85 para 85%')}
              inputProps={{ inputMode: 'decimal' }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Meta Cascote (%)"
              fullWidth
              value={form.metaCascote}
              onChange={(e) =>
                setField('metaCascote', sanitizeInput(e.target.value))
              }
              onKeyDown={numericKeyFilter}
              onBlur={() => markTouched('metaCascote')}
              error={hasErr('metaCascote')}
              helperText={help('metaCascote', 'Ej: 5 para 5%')}
              inputProps={{ inputMode: 'decimal' }}
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
          disabled={saving || !isValid}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
