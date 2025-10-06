import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Dialog, IconButton, Box } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

/**
 * ReusablePercentChart
 * Props:
 *  - title: string
 *  - rows: Array<any>
 *  - xKey: string | ((row) => string)   // categoría (p.ej. "mes")
 *  - series: Array<{
 *      name: string,
 *      key?: string,                     // campo del row (si no hay accessor)
 *      accessor?: (row) => number,       // si prefieres calcular el valor
 *      type?: 'bar' | 'line',            // default 'bar'
 *      color?: string,
 *      dashed?: boolean,                 // para líneas de meta
 *      labelInside?: boolean             // barras con label dentro rotado
 *    }>
 *  - defaultMeta?: number                // fallback de meta si aplica (0..1)
 *  - yMaxCap?: number                    // límite superior (default 3 => 300%)
 *  - height?: number                     // alto normal
 *  - modalHeight?: string | number       // alto en la vista ampliada
 */
export default function ReusablePercentChart({
  title = 'CUMPLIMIENTO (%)',
  rows = [],
  xKey = 'mes',
  series = [],
  defaultMeta = 0.9,
  yMaxCap = 3,
  height = 420,
  modalHeight = '80vh',
}) {
  const [open, setOpen] = useState(false);

  const toPct = (v, digits = 2) =>
    `${((v ?? 0) * 100).toFixed(digits).replace('.', ',')}%`;

  const niceMaxPercent = (maxVal) => {
    if (!Number.isFinite(maxVal) || maxVal <= 0) return 1;
    const step = 0.05; // 5%
    return Math.ceil(maxVal / step) * step;
  };

  // Helpers de acceso
  const getX = typeof xKey === 'function' ? xKey : (r) => r?.[xKey];
  const read = (row, s) => {
    if (typeof s.accessor === 'function') return Number(s.accessor(row)) || 0;
    if (s.key) {
      const raw = row?.[s.key];
      // Soporta números en string con coma decimal
      const n = Number(String(raw).replace(',', '.'));
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };

  // Categorías y data para cada serie (1 solo useMemo)
  const { categorias, seriesData, yMax } = useMemo(() => {
    const cats = rows.map(getX);
    const data = series.map((s) => rows.map((r) => read(r, s)));

    const maxAmongAll = data.reduce(
      (acc, arr) => Math.max(acc, ...(arr.length ? arr : [0])),
      0
    );
    return {
      categorias: cats,
      seriesData: data,
      yMax: Math.min(yMaxCap, niceMaxPercent(maxAmongAll) + 0.05),
    };
  }, [rows, series, xKey]); // si pasas series inline, recreará; es esperado

  const muchosMeses = categorias.length > 12;
  const rotacionX = categorias.length > 9 ? 30 : 0;

  // onEvents debe existir SIEMPRE (evita cambios en orden de hooks)
  const onEvents = useMemo(
    () => ({
      dblclick: () => setOpen(true),
    }),
    []
  );

  // Construcción de la opción de ECharts
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

      // line
      return {
        ...base,
        symbol: 'none',
        lineStyle: {
          type: s.dashed ? 'dashed' : 'solid',
          color: s.color || '#9e9e9e',
        },
        label: {
          show: true,
          position: 'top',
          color: '#616161',
          formatter: ({ value }) => toPct(value, 0),
        },
        tooltip: { show: false },
      };
    });

    return {
      title: { text: title, left: 'center', textStyle: { fontSize: 16 } },
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
        axisLabel: { formatter: (val) => toPct(val, 0) },
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

  // Fallback visual sin romper orden de hooks
  const hasRows = rows.length > 0;

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
