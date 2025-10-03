import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Dialog, IconButton, Box } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

const toPct = (v, digits = 2) =>
  `${((v ?? 0) * 100).toFixed(digits).replace('.', ',')}%`;

// “Redondea hacia arriba” a pasos de 5% y le agrega un poquito
const niceMaxPercent = (maxVal) => {
  if (!Number.isFinite(maxVal) || maxVal <= 0) return 1;
  const step = 0.05; // 5%
  return Math.ceil(maxVal / step) * step;
};

function useCumplimientoOption(rows) {
  const categorias = useMemo(() => rows.map((r) => r.mes), [rows]);

  const cer = useMemo(
    () => rows.map((r) => Number(r?.cumplMenCeramica) || 0),
    [rows]
  );
  const otros = useMemo(
    () => rows.map((r) => Number(r?.cumplOtrosIngrAcuvsAcumPres) || 0),
    [rows]
  );
  const metaArr = useMemo(
    () =>
      rows.map((r) => {
        const m = Number(String(r?.meta).replace(',', '.'));
        return Number.isFinite(m) && m > 0 ? m : 0.9; // 90% por defecto
      }),
    [rows]
  );

  const muchosMeses = categorias.length > 12;
  const rotacionX = categorias.length > 9 ? 30 : 0;

  // Opción compartida (la usamos para vista normal y para la modal)
  return useMemo(
    () => ({
      title: {
        text: 'CUMPLIMIENTO (%)',
        left: 'center',
        textStyle: { fontSize: 16 },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) =>
          params
            .map((p) => `${p.marker} ${p.seriesName}: ${toPct(p.value)}`)
            .join('<br/>'),
        confine: true,
      },
      toolbox: {
        right: 72,
        feature: {
          saveAsImage: { title: 'Guardar' },
          magicType: {
            type: ['stack', 'tiled'],
            title: { stack: 'Apilar', tiled: 'Agrupar' },
            option: {
              stack: {
                series: [
                  { label: { show: false } },
                  { label: { show: false } },
                ],
              },
              tiled: {
                series: [{ label: { show: true } }, { label: { show: true } }],
              },
            },
          },
          restore: { title: 'Restaurar' },
        },
      },
      grid: { top: 70, left: 60, right: 30, bottom: 110, containLabel: true },
      dataZoom: [
        {
          type: 'slider',
          height: 18,
          bottom: 70, // slider sobre la leyenda
          startValue: 0,
          endValue: muchosMeses ? 11 : categorias.length - 1,
        },
        { type: 'inside' },
      ],
      legend: {
        bottom: 18, // debajo del slider
        left: 'center',
        selectedMode: 'multiple',
        itemWidth: 18,
        itemHeight: 10,
        icon: 'roundRect',
      },
      xAxis: {
        type: 'category',
        data: categorias,
        axisLabel: { interval: 0, rotate: rotacionX },
      },
      yAxis: {
        type: 'value',
        min: 0,
        // 👇 Dinámico: ECharts recibe una función con {max, min}
        max: ({ max }) => Math.min(3, niceMaxPercent(max) + 0.05), // cap opcional al 300%
        axisLabel: { formatter: (val) => toPct(val, 0) },
        splitLine: { show: true },
      },
      labelLayout: (p) => {
        if (p.rect?.width < 12 || p.rect?.height < 10) return { hide: true };
        return { hideOverlap: true };
      },
      series: [
        {
          name: 'Cumpl. Mensual Cerámica',
          type: 'bar',
          data: cer,
          barMaxWidth: 28,
          itemStyle: { color: '#388e3c' },
          label: {
            show: true,
            position: 'inside',
            verticalAlign: 'middle',
            align: 'center',
            rotate: 90,
            color: '#fff',
            fontWeight: 'bold',
            formatter: ({ value }) => toPct(value, 2),
          },
          emphasis: { focus: 'series' },
        },
        {
          name: 'Cumpl. Otros Ingresos Acum. vs Acum. Presupuesto',
          type: 'bar',
          data: otros,
          barMaxWidth: 28,
          itemStyle: { color: '#1e88e5' },
          label: {
            show: true,
            position: 'inside',
            verticalAlign: 'middle',
            align: 'center',
            rotate: 90,
            color: '#fff',
            fontWeight: 'bold',
            formatter: ({ value }) => toPct(value, 2),
          },
          emphasis: { focus: 'series' },
        },
        {
          name: 'Meta',
          type: 'line',
          data: metaArr,
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#9e9e9e' },
          label: {
            show: true,
            position: 'top',
            color: '#616161',
            formatter: ({ value }) => toPct(value, 0),
          },
          tooltip: { show: false },
        },
      ],
      animationDuration: 500,
      animationDurationUpdate: 400,
    }),
    [categorias, cer, otros, metaArr, muchosMeses, rotacionX]
  );
}

export default function CumplimientoChart({ rows = [] }) {
  const option = useCumplimientoOption(rows);
  const [open, setOpen] = useState(false);

  if (!rows.length) {
    return (
      <div style={{ height: 320, display: 'grid', placeItems: 'center' }}>
        Sin datos para graficar
      </div>
    );
  }

  // Doble-clic abre la vista ampliada
  const onEvents = useMemo(
    () => ({
      dblclick: () => setOpen(true),
    }),
    []
  );

  return (
    <>
      {/* Vista normal */}
      <Box sx={{ position: 'relative' }}>
        <IconButton
          size="small"
          onClick={() => setOpen(true)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            zIndex: 2,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { bgcolor: 'background.default' },
          }}
          title="Ampliar"
        >
          <ZoomInIcon fontSize="small" />
        </IconButton>

        <ReactECharts
          option={option}
          style={{ height: 420, width: '100%', cursor: 'zoom-in' }}
          notMerge={false}
          lazyUpdate
          onEvents={onEvents}
        />
      </Box>

      {/* Modal (vista ampliada) */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <Box sx={{ p: 1 }}>
          <ReactECharts
            option={option}
            style={{ height: '80vh', width: '100%' }}
            notMerge={false}
            lazyUpdate
          />
        </Box>
      </Dialog>
    </>
  );
}
