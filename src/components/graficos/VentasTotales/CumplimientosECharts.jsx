import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

// helpers
const toPct = (v, digits = 2) =>
  `${((Number(v) || 0) * 100).toFixed(digits).replace('.', ',')}%`;

const niceMaxPercent = (maxVal) => {
  const v = Number(maxVal) || 1;
  const step = 0.05; // 5%
  return Math.ceil(v / step) * step;
};

export default function CumplimientosECharts({ rows = [], height = 420 }) {
  // arrays por serie, respetando tu shape
  const categorias = useMemo(
    () => rows.map((r) => String(r.mes ?? '')),
    [rows]
  );
  console.log(rows);
  const meta = useMemo(
    () =>
      rows.map((r) => {
        const m = Number(String(r?.meta ?? '').replace(',', '.'));
        return Number.isFinite(m) ? m : 1; // default 100%
      }),
    [rows]
  );

  const cumMen = useMemo(() => rows.map((r) => Number(r?.CumMen) || 0), [rows]);

  const cumAcu = useMemo(() => rows.map((r) => Number(r?.CumAcu) || 0), [rows]);

  if (!rows.length) {
    return (
      <div style={{ height, display: 'grid', placeItems: 'center' }}>
        Sin datos para graficar
      </div>
    );
  }

  const maxVal = Math.max(...meta, ...cumMen, ...cumAcu, 1);
  const yMax = niceMaxPercent(maxVal) + 0.05; // +5% margen
  const manyMonths = categorias.length > 12;
  const rotX = categorias.length > 9 ? 30 : 0;

  const option = {
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
    },
    grid: { top: 60, left: 56, right: 24, bottom: 110, containLabel: true },
    dataZoom: [
      {
        type: 'slider',
        height: 16,
        bottom: 70, // slider sobre la leyenda
        startValue: 0,
        endValue: manyMonths ? 11 : categorias.length - 1,
      },
      { type: 'inside' },
    ],
    legend: {
      bottom: 18, // leyenda debajo del slider
      left: 'center',
      itemWidth: 18,
      itemHeight: 10,
      icon: 'roundRect',
    },
    xAxis: {
      type: 'category',
      data: categorias,
      axisLabel: { rotate: rotX, interval: 0 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      axisLabel: { formatter: (val) => toPct(val, 0) },
      splitLine: { show: true },
    },
    // Oculta etiquetas si la barra es chica o hay solape
    labelLayout: (p) => {
      if (p.rect?.width < 12 || p.rect?.height < 10) return { hide: true };
      return { hideOverlap: true };
    },
    series: [
      {
        name: 'Cumpl. Mensual',
        type: 'bar',
        data: cumMen,
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
      },
      {
        name: 'Cumpl. Acumulado',
        type: 'bar',
        data: cumAcu,
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
      },
      {
        name: 'Meta',
        type: 'line',
        data: meta,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { type: 'dashed', color: '#9e9e9e' },
        itemStyle: { color: '#5c6bc0' },
        label: {
          show: true,
          position: 'top',
          color: '#616161',
          formatter: ({ value }) => toPct(value, 0),
        },
        tooltip: { show: true },
      },
    ],
    animationDuration: 400,
    animationDurationUpdate: 300,
  };

  return <ReactECharts option={option} style={{ height, width: '100%' }} />;
}
