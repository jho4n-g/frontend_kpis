import React, { useEffect, useMemo, useState } from 'react';
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

import { getAll } from '../../service/IngresoVentaTotal.js';
import {
  formatMonthYear,
  formatPercent,
  formatNumber,
} from '../../lib/convert.js';

// Util: número seguro
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// KPI card simple
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
        {typeof progress === 'number' && (
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

export default function KPIsMensuales() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]); // normalizados por periodo

  // cargar datos
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await getAll();
      const normalizados = Array.isArray(resp?.normalizados)
        ? resp.normalizados
        : [];
      setRows(normalizados);
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar KPIs.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ordenar periodos y preparar opciones
  const options = useMemo(() => {
    const arr = [...rows];
    // Intenta ordenar por fecha interpretando "periodo" como ISO/fecha
    arr.sort((a, b) => {
      const da = new Date(a?.periodo ?? 0).getTime();
      const db = new Date(b?.periodo ?? 0).getTime();
      return da - db;
    });
    return arr;
  }, [rows]);

  const latest = options[options.length - 1] ?? null;
  const [selected, setSelected] = useState(latest?.periodo ?? '');
  useEffect(() => {
    if (latest?.periodo) setSelected(latest.periodo);
  }, [latest?.periodo]);

  const row = useMemo(
    () =>
      options.find((r) => String(r?.periodo) === String(selected)) ??
      latest ??
      null,
    [options, selected, latest]
  );

  // Derivados del mes seleccionado
  const pres = num(row?.PresMen);
  const venCer = num(row?.venMenCer);
  const otros = num(row?.otrIngr);
  const totalMes = num(row?.VentMenOtrIng) || venCer + otros;
  const diffTotalVsPres = totalMes - pres;
  const cumplMesTotal = pres > 0 ? (totalMes / pres) * 100 : null;

  const acuOtros = num(row?.venAcuOtros);
  const acuCer = num(row?.venAcuCer);
  const acuPres = num(row?.acuPres);
  const acuTotal = acuOtros + acuCer;
  const cumplAcuTotal = acuPres > 0 ? (acuTotal / acuPres) * 100 : null;

  const cumplCerMes = Number(row?.cumplMenCeramica) * 100 || null;
  const cumplOtrosAcu = Number(row?.cumplOtrosIngrAcuvsAcumPres) * 100 || null;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Typography variant="h6">KPIs mensuales</Typography>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Periodo</InputLabel>
            <Select
              label="Periodo"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {options.map((r) => (
                <MenuItem key={String(r?.periodo)} value={String(r?.periodo)}>
                  {formatMonthYear(r?.periodo)}
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
              {/* Bloque Ventas Mes */}
              <Grid item xs={12} md={3}>
                <KpiCard
                  title="Presupuesto mensual"
                  value={formatNumber(pres)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KpiCard
                  title="Venta mensual Cerámica"
                  value={formatNumber(venCer)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KpiCard
                  title="Otros ingresos mensuales"
                  value={formatNumber(otros)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KpiCard
                  title="Venta mensual total"
                  value={formatNumber(totalMes)}
                  subtitle={
                    diffTotalVsPres === 0
                      ? 'En línea con presupuesto'
                      : `${diffTotalVsPres > 0 ? '+' : ''}${formatNumber(diffTotalVsPres)} vs Pres.`
                  }
                />
              </Grid>

              {/* Cumplimiento Mes */}
              <Grid item xs={12} md={4}>
                <KpiCard
                  title="Cumplimiento mensual total"
                  value={
                    cumplMesTotal == null
                      ? '—'
                      : formatPercent(cumplMesTotal / 100)
                  }
                  progress={cumplMesTotal ?? undefined}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <KpiCard
                  title="Cumpl. mensual Cerámica"
                  value={
                    cumplCerMes == null ? '—' : `${cumplCerMes.toFixed(1)}%`
                  }
                  progress={cumplCerMes ?? undefined}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <KpiCard
                  title="Cumpl. Otros Ingresos (Acum vs Pres)"
                  value={
                    cumplOtrosAcu == null ? '—' : `${cumplOtrosAcu.toFixed(1)}%`
                  }
                  progress={cumplOtrosAcu ?? undefined}
                />
              </Grid>

              {/* Acumulados */}
              <Grid item xs={12} md={3}>
                <KpiCard
                  title="Ventas acumuladas Cerámica"
                  value={formatNumber(acuCer)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KpiCard
                  title="Ventas acumuladas Otros"
                  value={formatNumber(acuOtros)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KpiCard
                  title="Presupuesto acumulado"
                  value={formatNumber(acuPres)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <KpiCard
                  title="Cumplimiento acumulado total"
                  value={
                    cumplAcuTotal == null
                      ? '—'
                      : formatPercent(cumplAcuTotal / 100)
                  }
                  progress={cumplAcuTotal ?? undefined}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Stack direction="row" alignItems="center" gap={1}>
              <Chip
                size="small"
                label={`Periodo: ${formatMonthYear(row?.periodo)}`}
              />
              {Number.isFinite(num(row?.meta)) && (
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={`Meta: ${formatPercent(num(row?.meta))}`}
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
