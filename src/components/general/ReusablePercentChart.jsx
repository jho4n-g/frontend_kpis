import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Dialog, IconButton, Box } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

/**
 * 📊 ReusablePercentChart
 * Componente reutilizable para mostrar porcentajes (barras + líneas)
 *
 * Props:
 *  - title: string → título del gráfico
 *  - rows: array de objetos con los datos
 *  - xKey: string | function → campo o función para el eje X (categorías)
 *  - series: array de series [{ name, key, accessor, type, color, dashed, labelInside }]
 *  - yMaxCap: número → límite máximo del eje Y (por defecto 3 = 300%)
 *  - height: alto del gráfico principal
 *  - modalHeight: alto del gráfico ampliado en el modal
 */
export default function ReusablePercentChart({
  title = 'CUMPLIMIENTO (%)',
  rows = [],
  xKey = 'mes',
  series = [],
  yMaxCap = 3,
  height = 420,
  modalHeight = '80vh',
}) {
  const [open, setOpen] = useState(false);

  // Formatea a porcentaje
  const toPct = (v, digits = 2) =>
    `${((v ?? 0) * 100).toFixed(digits).replace('.', ',')}%`;

  // Eje Y adaptativo según valores máximos
  const { categorias, seriesData, yMax } = useMemo(() => {
    const getX = typeof xKey === 'function' ? xKey : (r) => r?.[xKey];
    const read = (row, s) => {
      if (typeof s.accessor === 'function') return Number(s.accessor(row)) || 0;
      if (s.key) {
        const raw = row?.[s.key];
        const n = Number(String(raw).replace(',', '.'));
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    };

    const cats = rows.map(getX);
    const data = series.map((s) => rows.map((r) => read(r, s)));

    const maxAmongAll = data.reduce(
      (acc, arr) => Math.max(acc, ...(arr.length ? arr : [0])),
      0
    );

    // 🔧 Escala inteligente (maneja valores muy pequeños)
    let dynamicMax;
    if (maxAmongAll <= 0.0005)
      dynamicMax = 0.001; // 0.1 %
    else if (maxAmongAll <= 0.001)
      dynamicMax = 0.002; // 0.2 %
    else if (maxAmongAll <= 0.002)
      dynamicMax = 0.004; // 0.4 %
    else if (maxAmongAll <= 0.005)
      dynamicMax = 0.008; // 0.8 %
    else if (maxAmongAll <= 0.01)
      dynamicMax = 0.015; // 1.5 %
    else if (maxAmongAll <= 0.02)
      dynamicMax = 0.03; // 3 %
    else if (maxAmongAll <= 0.05)
      dynamicMax = 0.08; // 8 %
    else if (maxAmongAll <= 0.1)
      dynamicMax = 0.15; // 15 %
    else dynamicMax = Math.min(yMaxCap, Math.ceil(maxAmongAll * 1.2 * 10) / 10);

    return { categorias: cats, seriesData: data, yMax: dynamicMax };
  }, [rows, series, xKey]);

  const muchosMeses = categorias.length > 12;
  const rotacionX = categorias.length > 9 ? 30 : 0;

  const onEvents = useMemo(() => ({ dblclick: () => setOpen(true) }), []);

  // --- Configuración del gráfico ECharts ---
  const option = useMemo(() => {
    const echartsSeries = series.map((s, idx) => {
      const base = {
        name: s.name,
        type: s.type || 'bar',
        data: seriesData[idx],
        emphasis: { focus: 'series' },
      };

      if (base.type === 'bar') {
        return {
          ...base,
          barMaxWidth: 28,
          itemStyle: s.color ? { color: s.color } : undefined,
          label: s.labelInside
            ? {
                show: true,
                position: 'inside',
                verticalAlign: 'middle',
                align: 'center',
                rotate: 90,
                color: '#fff',
                fontWeight: 'bold',
                formatter: ({ value }) => toPct(value, 2),
              }
            : undefined,
        };
      }

      // Línea (meta o tendencia)
      return {
        ...base,
        symbol: 'none',
        smooth: s.smooth ?? false,
        lineStyle: {
          type: s.dashed ? 'dashed' : 'solid',
          color: s.color || '#9e9e9e',
          width: 2,
        },
        label: {
          show: true,
          position: 'top',
          color: '#616161',
          formatter: ({ value }) => toPct(value, 2),
        },
        tooltip: { show: false },
      };
    });

    return {
      title: {
        text: title,
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' },
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
              stack: { series: series.map(() => ({ label: { show: false } })) },
              tiled: { series: series.map(() => ({ label: { show: true } })) },
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
          bottom: 70,
          startValue: 0,
          endValue: muchosMeses ? 11 : categorias.length - 1,
        },
        { type: 'inside' },
      ],
      legend: {
        bottom: 18,
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
        max: yMax,
        axisLabel: { formatter: (val) => toPct(val, 2) },
        splitLine: { show: true },
      },
      labelLayout: (p) => {
        if (p.rect?.width < 12 || p.rect?.height < 10) return { hide: true };
        return { hideOverlap: true };
      },
      series: echartsSeries,
      animationDuration: 500,
      animationDurationUpdate: 400,
    };
  }, [series, seriesData, categorias, rotacionX, muchosMeses, yMax, title]);

  const hasRows = rows.length > 0;

  // --- Render ---
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
            zIndex: 2,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { bgcolor: 'background.default' },
          }}
          title="Ampliar"
        >
          <ZoomInIcon fontSize="small" />
        </IconButton>

        {hasRows ? (
          <ReactECharts
            option={option}
            style={{ height, width: '100%', cursor: 'zoom-in' }}
            notMerge={false}
            lazyUpdate
            onEvents={onEvents}
          />
        ) : (
          <div style={{ height, display: 'grid', placeItems: 'center' }}>
            Sin datos para graficar
          </div>
        )}
      </Box>

      {/* Modal de ampliación */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <Box sx={{ p: 1 }}>
          {hasRows && (
            <ReactECharts
              option={option}
              style={{ height: modalHeight, width: '100%' }}
              notMerge={false}
              lazyUpdate
            />
          )}
        </Box>
      </Dialog>
    </>
  );
}
