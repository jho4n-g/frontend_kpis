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

// ---- Helpers numéricos (en tu estilo) ----
const sanitizeInput = (s) =>
  String(s ?? '')
    .replace(/,/g, '.') // coma -> punto
    .replace(/[^\d. ]+/g, '') // solo dígitos, punto y espacios
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

export default function PrecioUnitarioMetaModal({
  open,
  onClose,
  onSuccess,
  updateMeta, // (payload: { meta: number }) => Promise
  initialMeta = '', // opcional: valor sugerido a mostrar
}) {
  const [saving, setSaving] = useState(false);
  const [rootError, setRootError] = useState('');
  const [touched, setTouched] = useState({});
  const [showErrors, setShowErrors] = useState(false);

  const [form, setForm] = useState({ meta: '' });
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setRootError('');
    setTouched({});
    setShowErrors(false);
    setForm({
      meta:
        initialMeta !== '' && initialMeta != null ? String(initialMeta) : '',
    });
  }, [open, initialMeta]);

  // Validaciones: ahora exige 1..100
  const errors = useMemo(() => {
    const e = {};
    const n = parseInputNumber(form.meta);
    if (!Number.isFinite(n)) e.meta = 'Meta inválida';
    else if (n < 1 || n > 100) e.meta = 'La meta debe estar entre 1 y 100';
    return e;
  }, [form.meta]);

  const hasErr = (k) => (showErrors || touched[k]) && !!errors[k];
  const help = (k, placeholder) => (hasErr(k) ? errors[k] : placeholder);
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const onChangeMeta = (e) => {
    const clean = sanitizeInput(e.target.value);
    const dots = (clean.match(/\./g) || []).length;
    if (dots > 1) return; // evita más de un punto
    setField('meta', clean);
  };

  const handleSave = async () => {
    setRootError('');
    if (!isValid) {
      setShowErrors(true);
      markTouched('meta');
      setRootError('Revisa los campos marcados.');
      return;
    }

    // Enviar dividido entre 100
    const n = parseInputNumber(form.meta) ?? 0;
    const payload = { meta: n / 100 };

    try {
      setSaving(true);
      await updateMeta(payload);
      onClose?.();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setRootError('No se pudo guardar la meta.');
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
      <DialogTitle>Ingresar meta</DialogTitle>

      <DialogContent dividers>
        {rootError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {rootError}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Meta (1 a 100)"
              fullWidth
              value={form.meta}
              onChange={onChangeMeta}
              onKeyDown={numericKeyFilter}
              onBlur={() => markTouched('meta')}
              error={hasErr('meta')}
              helperText={help('meta', 'Ej: 75 o 75.5')}
              inputProps={{ inputMode: 'decimal' }}
              autoFocus
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
