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

const formatPeriodo = (value) => {
  if (!value) return value;

  // Separar año y mes
  const parts = value.split('-');
  if (parts.length === 2) {
    const año = parts[0];
    const mes = parts[1];

    // Capitalizar solo la primera letra del mes
    const mesCapitalizado =
      mes.charAt(0).toUpperCase() + mes.slice(1).toLowerCase();

    return `${año}-${mesCapitalizado}`;
  }

  return value;
};
/** Convierte Date | 'YYYY-MM' | 'YYYY-MM-DD...' a 'YYYY-MM' */
function toMonthInputValue(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    // acepta 'YYYY-MM' o 'YYYY-MM-DD' y devuelve 'YYYY-MM'
    const m = value.match(/^(\d{4}-\d{2})/);
    if (m) return m[1];
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Parsea string visual a Number (quita espacios) */
function parseInputNumber(str) {
  if (str == null || str === '') return null;
  const cleaned = String(str).replace(/\s+/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** YYYY-MM -> YYYY-MM-01 */
function monthToFirstDay(monthStr) {
  if (!monthStr) return null;
  return `${monthStr}-01`;
}

/** Validación numérica */
function validateNumberField(
  label,
  raw,
  { required = true, min = 0, max = 1e14 } = {}
) {
  if ((raw == null || raw === '') && required) return `${label} es requerido`;
  const n = parseInputNumber(raw);
  if (n == null) return `${label} inválido`;
  if (n < min) return `${label} no puede ser menor a ${min}`;
  if (n > max) return `${label} es demasiado grande`;
  return null;
}

/** Filtro de teclas: incluye Enter para no bloquear el submit */
function numericKeyFilter(e) {
  const allowedChars = '0123456789. ';
  const ctrlKeys = [
    'Backspace',
    'Delete',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'Tab',
    'Enter',
  ];
  if (e.ctrlKey || e.metaKey || e.altKey || ctrlKeys.includes(e.key)) return;
  if (e.key.length === 1 && !allowedChars.includes(e.key)) e.preventDefault();
}

/** Limpia: dígitos, punto y espacio; convierte coma->punto; evita múltiples puntos */
function sanitizeInput(str) {
  const s = String(str)
    .replace(/,/g, '.')
    .replace(/[^0-9. ]+/g, '');
  const parts = s.split('.');
  if (parts.length <= 2) return s;
  return `${parts[0]}.${parts.slice(1).join('')}`;
}

export default function IngresoVentaTotalModal({
  open,
  onClose,
  onSuccess,
  initialValues = null, // objeto => edición, null => crear
  createFn, // (payload) => Promise
  updateFn, // (id, payload) => Promise
  idKey = 'id',
  periodoActual, // Date | 'YYYY-MM' | 'YYYY-MM-01'
  editablePeriodo = false,
}) {
  const isEdit = !!initialValues;
  const [saving, setSaving] = useState(false);
  const [rootError, setRootError] = useState('');

  const [showErrors, setShowErrors] = useState(false);
  const [touched, setTouched] = useState({});

  const [form, setForm] = useState({
    periodo: '', // 'YYYY-MM'
    PresMen: '', // string visual con espacios/punto
    VentMenOtrIng: '',
    venMenCer: '',
    otrIngr: '',
  });

  useEffect(() => {
    if (!open) return;
    setRootError('');
    setShowErrors(false);
    setTouched({});

    if (isEdit) {
      const p = initialValues?.periodo ?? new Date();
      //console.log('editar', p);
      setForm({
        periodo: toMonthInputValue(p), // <-- siempre 'YYYY-MM'
        // periodoLabel: toMonthLabel(p), // si lo necesitas para mostrar
        PresMen:
          initialValues?.PresMen != null
            ? formatNumber(initialValues.PresMen)
            : '',
        VentMenOtrIng:
          initialValues?.VentMenOtrIng != null
            ? formatNumber(initialValues.VentMenOtrIng)
            : '',
        venMenCer:
          initialValues?.venMenCer != null
            ? formatNumber(initialValues.venMenCer)
            : '',
        otrIngr:
          initialValues?.otrIngr != null
            ? formatNumber(initialValues.otrIngr)
            : '',
      });
      return; // evita ejecutar también la rama async
    }

    let cancel = false;
    (async () => {
      try {
        const p = await periodoActual(); // Date o 'YYYY-MM'
        if (cancel) return;
        setForm({
          periodo: toMonthInputValue(p), // <-- 'YYYY-MM'
          // periodoLabel: toMonthLabel(p ?? new Date()),
          PresMen: '',
          VentMenOtrIng: '',
          venMenCer: '',
          otrIngr: '',
        });
      } catch (e) {
        if (!cancel) {
          console.error('periodoActual falló:', e);
          setForm({
            periodo: monthToFirstDay(new Date()),
            PresMen: '',
            VentMenOtrIng: '',
            venMenCer: '',
            otrIngr: '',
          });
        }
      }
    })();

    return () => {
      cancel = true;
    };
  }, [open, isEdit, initialValues, periodoActual]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const fieldErrors = useMemo(() => {
    const fe = {};
    if (!form.periodo) fe.periodo = 'Periodo es requerido';
    fe.PresMen = validateNumberField('Presupuesto mensual', form.PresMen);
    fe.VentMenOtrIng = validateNumberField(
      'Venta mensual (otros ingresos)',
      form.VentMenOtrIng
    );
    fe.venMenCer = validateNumberField(
      'Venta mensual cerámica',
      form.venMenCer
    );
    fe.otrIngr = validateNumberField('Otros ingresos', form.otrIngr, {
      required: false,
      min: 0,
    });
    return fe;
  }, [form]);

  const isValid = useMemo(() => {
    if (!form.periodo) return false;
    return Object.values(fieldErrors).every((e) => !e);
  }, [fieldErrors, form.periodo]);

  const onEnterSubmit = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const onChangeNumber = (key) => (e) => {
    const sanitized = sanitizeInput(e.target.value);
    setField(key, sanitized);
  };

  const showErr = (key) => (showErrors || touched[key]) && !!fieldErrors[key];
  const helpText = (key, placeholder) =>
    showErr(key) ? fieldErrors[key] : placeholder;

  const handleSave = async () => {
    setRootError('');
    setShowErrors(true);
    if (!isValid) return;

    const numbers = {
      PresMen: parseInputNumber(form.PresMen) ?? 0,
      VentMenOtrIng: parseInputNumber(form.VentMenOtrIng) ?? 0,
      venMenCer: parseInputNumber(form.venMenCer) ?? 0,
      otrIngr: parseInputNumber(form.otrIngr) ?? 0,
    };

    try {
      setSaving(true);
      if (isEdit && updateFn) {
        const id = initialValues?.[idKey];
        // ⛔️ UPDATE: no enviar periodo
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
      setRootError(
        'No se pudo guardar. Verifica los datos e intenta nuevamente.'
      );
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

      <DialogContent dividers onKeyDown={onEnterSubmit}>
        <Box sx={{ mt: 1 }}>
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
                onBlur={() => markTouched('periodo')}
                InputProps={{ readOnly: !editablePeriodo }}
                InputLabelProps={{ shrink: true }}
                error={showErr('periodo')}
                //helperText={helpText('periodo', 'Ej: 2025-05')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Presupuesto mensual"
                fullWidth
                value={formatNumber(form.PresMen)}
                onChange={onChangeNumber('PresMen')}
                onKeyDown={numericKeyFilter}
                onBlur={() => markTouched('PresMen')}
                error={showErr('PresMen')}
                helperText={helpText('PresMen', 'Ej: 17 513 771.00')}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Venta mensual (otros ingresos)"
                fullWidth
                value={formatNumber(form.VentMenOtrIng)}
                onChange={onChangeNumber('VentMenOtrIng')}
                onKeyDown={numericKeyFilter}
                onBlur={() => markTouched('VentMenOtrIng')}
                error={showErr('VentMenOtrIng')}
                helperText={helpText('VentMenOtrIng', 'Ej: 17 822 897.85')}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Venta mensual cerámica"
                fullWidth
                value={formatNumber(form.venMenCer)}
                onChange={onChangeNumber('venMenCer')}
                onKeyDown={numericKeyFilter}
                onBlur={() => markTouched('venMenCer')}
                error={showErr('venMenCer')}
                helperText={helpText('venMenCer', 'Ej: 16 970 748.83')}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Otros ingresos"
                fullWidth
                value={formatNumber(form.otrIngr)}
                onChange={onChangeNumber('otrIngr')}
                onKeyDown={numericKeyFilter}
                onBlur={() => markTouched('otrIngr')}
                error={showErr('otrIngr')}
                helperText={helpText('otrIngr', 'Opcional')}
                inputProps={{ inputMode: 'decimal' }}
              />
            </Grid>
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
          disabled={saving || (showErrors && !isValid)} // opcional: evita reintentos inválidos
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
