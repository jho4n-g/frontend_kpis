import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Grid,
  Divider,
  LinearProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

// ===== Helpers =====
const defaultFormatNumber = (v) =>
  (v ?? 0).toLocaleString('es-BO', { maximumFractionDigits: 2 });
const defaultFormatPercent = (v) =>
  typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '—';
const defaultFormatMonthYear = (value) => {
  if (!value) return '—';
  const s = String(value);
  // Soporta 'YYYY-MM' o date-like
  const m = s.match(/^(\d{4})-(\d{2})/);
  const d = m ? new Date(`${m[1]}-${m[2]}-01`) : new Date(value);
  if (Number.isNaN(d.getTime())) return s;
  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  return `${meses[d.getMonth()]} ${d.getFullYear()}`;
};
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const toDate = (value) => {
  if (!value) return new Date(0);
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})/);
  return m ? new Date(`${m[1]}-${m[2]}-01`) : new Date(value);
};

// ===== KPI card =====
function KpiCard({ title, value, subtitle, progress }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {typeof progress === 'number' && Number.isFinite(progress) && (
          <Stack spacing={0.5}>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, progress))}
            />
            <Typography variant="caption" color="text.secondary">
              {progress.toFixed(1)}%
            </Typography>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

/**
 * ReusableMonthlyKPIs
 *
 * Props:
 * - title?: string
 * - data?: any[]                                 // filas ya normalizadas
 * - services?: { getAll: () => Promise<any> }    // alternativa para cargar datos
 * - fieldMap?: {                                  // mapea tus llaves reales
 *     periodo: string,            // 'periodo'
 *     presMen: string,            // 'PresMen'
 *     venMenCer: string,          // 'venMenCer'
 *     otrIngr: string,            // 'otrIngr'
 *     ventMenTotal?: string,      // 'VentMenOtrIng' (opcional; si no existe, se calcula cer + otros)
 *     venAcuCer: string,          // 'venAcuCer'
 *     venAcuOtros: string,        // 'venAcuOtros'
 *     acuPres: string,            // 'acuPres'
 *     cumplMenCeramica?: string,  // 'cumplMenCeramica' (0-1)
 *     cumplOtrosAcuVsPres?: string, // 'cumplOtrosIngrAcuvsAcumPres' (0-1)
 *     meta?: string,              // 'meta' (0-1)
 *   }
 * - labels?: { ... }                              // textos de tarjetas
 * - initialPeriod?: string                        // seleccionar un periodo por defecto
 * - onPeriodChange?: (periodo: string) => void
 * - hidden?: { [key in keyof DefaultCards]?: boolean } // ocultar tarjetas por clave
 * - formatters?: {
 *     formatNumber?: (n) => string,
 *     formatPercent?: (fraction0to1) => string,
 *     formatMonthYear?: (v) => string,
 *   }
 */
export default function ReusableMonthlyKPIs({
  title = 'KPIs mensuales',
  data,
  services,
  fieldMap = {
    periodo: 'periodo',
    presMen: 'PresMen',
    venMenCer: 'venMenCer',
    otrIngr: 'otrIngr',
    ventMenTotal: 'VentMenOtrIng',
    venAcuCer: 'venAcuCer',
    venAcuOtros: 'venAcuOtros',
    acuPres: 'acuPres',
    cumplMenCeramica: 'cumplMenCeramica',
    cumplOtrosAcuVsPres: 'cumplOtrosIngrAcuvsAcumPres',
    meta: 'meta',
  },
  labels = {
    presupuestoMensual: 'Presupuesto mensual',
    ventaMensualCeramica: 'Venta mensual Cerámica',
    otrosIngresosMensuales: 'Otros ingresos mensuales',
    ventaMensualTotal: 'Venta mensual total',
    cumplMensualTotal: 'Cumplimiento mensual total',
    cumplMensualCeramica: 'Cumpl. mensual Cerámica',
    cumplOtrosAcuVsPres: 'Cumpl. Otros Ingresos (Acum vs Pres)',
    ventasAcuCeramica: 'Ventas acumuladas Cerámica',
    ventasAcuOtros: 'Ventas acumuladas Otros',
    presupuestoAcumulado: 'Presupuesto acumulado',
    cumplAcuTotal: 'Cumplimiento acumulado total',
    meta: 'Meta',
    periodo: 'Periodo',
  },
  initialPeriod,
  onPeriodChange,
  hidden = {}, // e.g. { ventaMensualCeramica: true }
  formatters = {},
}) {
  const formatNumber = formatters.formatNumber || defaultFormatNumber;
  const formatPercent = formatters.formatPercent || defaultFormatPercent;
  const formatMonthYear = formatters.formatMonthYear || defaultFormatMonthYear;

  // ----- carga -----
  const [loading, setLoading] = useState(
    !Array.isArray(data) && !!services?.getAll
  );
  const [error, setError] = useState(null);
  const [rows, setRows] = useState(() => (Array.isArray(data) ? data : []));

  const load = useCallback(async () => {
    if (!services?.getAll) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await services.getAll();
      const list = Array.isArray(resp?.normalizados)
        ? resp.normalizados
        : Array.isArray(resp)
          ? resp
          : [];
      setRows(list);
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar KPIs.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [services?.getAll]);

  useEffect(() => {
    if (!Array.isArray(data) && services?.getAll) {
      load();
    }
  }, [data, load, services?.getAll]);

  useEffect(() => {
    if (Array.isArray(data)) setRows(data);
  }, [data]);

  // ----- ordenar y opciones de periodo -----
  const options = useMemo(() => {
    const arr = Array.isArray(rows) ? [...rows] : [];
    arr.sort(
      (a, b) =>
        toDate(a?.[fieldMap.periodo]).getTime() -
        toDate(b?.[fieldMap.periodo]).getTime()
    );
    return arr;
  }, [rows, fieldMap.periodo]);

  const latest = options[options.length - 1] ?? null;

  const [selected, setSelected] = useState(() => {
    if (initialPeriod) return String(initialPeriod);
    if (latest?.[fieldMap.periodo]) return String(latest[fieldMap.periodo]);
    return '';
  });

  useEffect(() => {
    // si no hay initialPeriod, selecciona el último automáticamente
    if (!initialPeriod && latest?.[fieldMap.periodo]) {
      setSelected(String(latest[fieldMap.periodo]));
    }
  }, [initialPeriod, latest, fieldMap.periodo]);

  useEffect(() => {
    if (onPeriodChange) onPeriodChange(selected);
  }, [selected, onPeriodChange]);

  const row = useMemo(
    () =>
      options.find((r) => String(r?.[fieldMap.periodo]) === String(selected)) ??
      latest ??
      null,
    [options, selected, latest, fieldMap.periodo]
  );

  // ----- obtener valores por campo -----
  const v = (k, fallback = 0) => num(row?.[fieldMap[k]] ?? fallback);

  // ----- derivados -----
  const pres = v('presMen');
  const venCer = v('venMenCer');
  const otros = v('otrIngr');

  const totalMes =
    fieldMap.ventMenTotal && row?.[fieldMap.ventMenTotal] != null
      ? num(row[fieldMap.ventMenTotal])
      : venCer + otros;

  const diffTotalVsPres = totalMes - pres;
  const cumplMesTotalPct = pres > 0 ? (totalMes / pres) * 100 : null;

  const acuOtros = v('venAcuOtros');
  const acuCer = v('venAcuCer');
  const acuPres = v('acuPres');
  const acuTotal = acuOtros + acuCer;
  const cumplAcuTotalPct = acuPres > 0 ? (acuTotal / acuPres) * 100 : null;

  // fracciones 0-1 para formatPercent; progresos necesitan 0-100
  const cumplCerMesFrac =
    row?.[fieldMap.cumplMenCeramica] != null
      ? Number(row[fieldMap.cumplMenCeramica])
      : null;
  const cumplOtrosAcuFrac =
    row?.[fieldMap.cumplOtrosAcuVsPres] != null
      ? Number(row[fieldMap.cumplOtrosAcuVsPres])
      : null;

  // meta opcional (fracción 0-1)
  const metaFrac =
    row?.[fieldMap.meta] != null ? Number(row[fieldMap.meta]) : null;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Typography variant="h6">{title}</Typography>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>{labels.periodo}</InputLabel>
            <Select
              label={labels.periodo}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {options.map((r) => (
                <MenuItem
                  key={String(r?.[fieldMap.periodo])}
                  value={String(r?.[fieldMap.periodo])}
                >
                  {formatMonthYear(r?.[fieldMap.periodo])}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {loading && (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <LinearProgress />
          </Box>
        )}
        {error && <Typography color="error">{error}</Typography>}

        {!loading && !error && row && (
          <>
            <Grid container spacing={2}>
              {!hidden.presupuestoMensual && (
                <Grid item xs={12} md={3}>
                  <KpiCard
                    title={labels.presupuestoMensual}
                    value={formatNumber(pres)}
                  />
                </Grid>
              )}
              {!hidden.ventaMensualCeramica && (
                <Grid item xs={12} md={3}>
                  <KpiCard
                    title={labels.ventaMensualCeramica}
                    value={formatNumber(venCer)}
                  />
                </Grid>
              )}
              {!hidden.otrosIngresosMensuales && (
                <Grid item xs={12} md={3}>
                  <KpiCard
                    title={labels.otrosIngresosMensuales}
                    value={formatNumber(otros)}
                  />
                </Grid>
              )}
              {!hidden.ventaMensualTotal && (
                <Grid item xs={12} md={3}>
                  <KpiCard
                    title={labels.ventaMensualTotal}
                    value={formatNumber(totalMes)}
                    subtitle={
                      diffTotalVsPres === 0
                        ? 'En línea con presupuesto'
                        : `${diffTotalVsPres > 0 ? '+' : ''}${formatNumber(diffTotalVsPres)} vs Pres.`
                    }
                  />
                </Grid>
              )}

              {!hidden.cumplMensualTotal && (
                <Grid item xs={12} md={4}>
                  <KpiCard
                    title={labels.cumplMensualTotal}
                    value={
                      cumplMesTotalPct == null
                        ? '—'
                        : formatPercent(cumplMesTotalPct / 100)
                    }
                    progress={cumplMesTotalPct ?? undefined}
                  />
                </Grid>
              )}
              {!hidden.cumplMensualCeramica && (
                <Grid item xs={12} md={4}>
                  <KpiCard
                    title={labels.cumplMensualCeramica}
                    value={
                      cumplCerMesFrac == null
                        ? '—'
                        : `${(cumplCerMesFrac * 100).toFixed(1)}%`
                    }
                    progress={
                      cumplCerMesFrac != null
                        ? cumplCerMesFrac * 100
                        : undefined
                    }
                  />
                </Grid>
              )}
              {!hidden.cumplOtrosAcuVsPres && (
                <Grid item xs={12} md={4}>
                  <KpiCard
                    title={labels.cumplOtrosAcuVsPres}
                    value={
                      cumplOtrosAcuFrac == null
                        ? '—'
                        : `${(cumplOtrosAcuFrac * 100).toFixed(1)}%`
                    }
                    progress={
                      cumplOtrosAcuFrac != null
                        ? cumplOtrosAcuFrac * 100
                        : undefined
                    }
                  />
                </Grid>
              )}

              {!hidden.ventasAcuCeramica && (
                <Grid item xs={12} md={3}>
                  <KpiCard
                    title={labels.ventasAcuCeramica}
                    value={formatNumber(acuCer)}
                  />
                </Grid>
              )}
              {!hidden.ventasAcuOtros && (
                <Grid item xs={12} md={3}>
                  <KpiCard
                    title={labels.ventasAcuOtros}
                    value={formatNumber(acuOtros)}
                  />
                </Grid>
              )}
              {!hidden.presupuestoAcumulado && (
                <Grid item xs={12} md={3}>
                  <KpiCard
                    title={labels.presupuestoAcumulado}
                    value={formatNumber(acuPres)}
                  />
                </Grid>
              )}
              {!hidden.cumplAcuTotal && (
                <Grid item xs={12} md={3}>
                  <KpiCard
                    title={labels.cumplAcuTotal}
                    value={
                      cumplAcuTotalPct == null
                        ? '—'
                        : formatPercent(cumplAcuTotalPct / 100)
                    }
                    progress={cumplAcuTotalPct ?? undefined}
                  />
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Stack direction="row" alignItems="center" gap={1}>
              <Chip
                size="small"
                label={`${labels.periodo}: ${formatMonthYear(row?.[fieldMap.periodo])}`}
              />
              {metaFrac != null && Number.isFinite(metaFrac) && (
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={`${labels.meta}: ${formatPercent(metaFrac)}`}
                />
              )}
            </Stack>
          </>
        )}

        {!loading && !error && !row && (
          <Typography color="text.secondary">
            No hay datos para mostrar.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
