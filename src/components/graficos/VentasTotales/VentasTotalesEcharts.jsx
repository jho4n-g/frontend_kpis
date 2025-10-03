import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Box, IconButton, Dialog, DialogContent } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

// --- helpers ---
const toMoney = (v) =>
  (Number(v) || 0).toLocaleString('es-BO', { maximumFractionDigits: 2 });

export default function VentasTotalesECharts({ rows = [], height = 420 }) {
  const [open, setOpen] = useState(false);

  // ⬇️ Mapea exactamente el shape que nos mandas
  const dataset = useMemo(
    () =>
      rows.map((r) => ({
        Mes: String(r?.mes ?? ''),
        Presupuesto: Number(r?.PresMen) || 0,
        Ventas: Number(r?.VentMen) || 0,
      })),
    [rows]
  );

  if (!dataset.length) {
    return (
      <div style={{ height, display: 'grid', placeItems: 'center' }}>
        Sin datos para graficar
      </div>
    );
  }

  const manyMonths = dataset.length > 12;
  const rotX = dataset.length > 9 ? 30 : 0;

  const option = {
    aria: { enabled: true },
    title: {
      text: 'VENTAS TOTALES',
      left: 'center',
      top: 6,
      textStyle: { fontSize: 18 },
    },
    dataset: {
      dimensions: ['Mes', 'Presupuesto', 'Ventas'],
      source: dataset,
    },
    legend: { bottom: 0 },
    toolbox: {
      right: 10,
      top: 8,
      feature: {
        saveAsImage: { title: 'Guardar' },
        restore: { title: 'Restaurar' },
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: toMoney,
    },
    grid: { top: 56, left: 56, right: 24, bottom: 64, containLabel: true },
    dataZoom: [
      {
        type: 'slider',
        height: 16,
        bottom: 36,
        startValue: 0,
        endValue: manyMonths ? 11 : dataset.length - 1,
      },
      { type: 'inside' },
    ],
    xAxis: {
      type: 'category',
      axisLabel: { rotate: rotX, interval: 0, margin: 12 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (val) => toMoney(val) },
      splitLine: { show: true },
    },
    // Oculta etiquetas si la barra es muy chica
    labelLayout: (p) => {
      if (p.rect?.width < 12 || p.rect?.height < 10) return { hide: true };
      return { hideOverlap: true };
    },
    series: [
      {
        name: 'Presupuesto Mensual [Bs.]',
        type: 'bar',
        encode: { x: 'Mes', y: 'Presupuesto' },
        barMaxWidth: 28,
        itemStyle: { color: '#1976d2' },
        label: {
          show: true,
          position: 'inside',
          rotate: 90,
          color: '#fff',
          fontWeight: 'bold',
          formatter: ({ value }) => toMoney(value?.Presupuesto),
        },
      },
      {
        name: 'Venta Mensual [Bs.]',
        type: 'bar',
        encode: { x: 'Mes', y: 'Ventas' },
        barMaxWidth: 28,
        itemStyle: { color: '#d32f2f' },
        label: {
          show: true,
          position: 'inside',
          rotate: 90,
          color: '#fff',
          fontWeight: 'bold',
          formatter: ({ value }) => toMoney(value?.Ventas),
        },
      },
    ],
    animationDuration: 400,
    animationDurationUpdate: 250,
  };

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <IconButton
          size="small"
          onClick={() => setOpen(true)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            zIndex: 5,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { bgcolor: 'background.default' },
          }}
          title="Ampliar"
        >
          <ZoomInIcon fontSize="small" />
        </IconButton>

        <ReactECharts option={option} style={{ height, width: '100%' }} />
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xl"
      >
        <DialogContent sx={{ p: 1 }}>
          <ReactECharts
            option={option}
            style={{ height: '72vh', width: '100%' }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
