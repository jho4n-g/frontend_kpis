import React, { useMemo, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

// Helper: calcula cortes para los axis breaks según tus datos
function computeAxisBreaks(values) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Ejemplo simple: deja un segmento “normal” y dos cortes para saltar huecos grandes.
  // Ajusta los rangos a tu realidad (Bs.) — la idea es evitar barras “aplastadas”.
  const breaks = [];

  // Corte 1: valores medios
  if (max > 100_000) {
    breaks.push({ start: 5_000, end: 100_000, gap: '1.5%' });
  }
  // Corte 2: valores altísimos
  if (max > 3_000_000) {
    breaks.push({ start: 105_000, end: 3_100_000, gap: '1.5%' });
  }
  return breaks;
}

export default function IngresoTotalECharts({ rows }) {
  // rows: [{ mes:'abr-24', PresMen, VentMenOtrIng, venMenCer, otrIngr }, ...]

  const categories = useMemo(() => rows.map((r) => r.mes), [rows]);
  const pres = useMemo(() => rows.map((r) => r.PresMen ?? 0), [rows]);
  const venOtr = useMemo(() => rows.map((r) => r.VentMenOtrIng ?? 0), [rows]);
  const venCer = useMemo(() => rows.map((r) => r.venMenCer ?? 0), [rows]);
  const otros = useMemo(() => rows.map((r) => r.otrIngr ?? 0), [rows]);

  const allVals = useMemo(
    () => [...pres, ...venOtr, ...venCer, ...otros],
    [pres, venOtr, venCer, otros]
  );
  const breaks = useMemo(() => computeAxisBreaks(allVals), [allVals]);

  const chartRef = useRef(null);

  const option = useMemo(
    () => ({
      title: {
        text: 'INGRESO TOTAL',
        subtext: 'Haz clic en el área de corte para expandir/colapsar',
        left: 'center',
        textStyle: { fontSize: 18 },
        subtextStyle: { color: '#175ce5', fontSize: 13, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (v) => (v ?? 0).toLocaleString('es-BO'),
      },
      legend: { bottom: 0 },
      grid: { top: 70, left: 60, right: 30, bottom: 60 },
      xAxis: [{ type: 'category', data: categories }],
      yAxis: [
        {
          type: 'value',
          breaks, // 👈 cortes del eje
          breakArea: {
            itemStyle: { opacity: 1 },
            zigzagZ: 200,
          },
          axisLabel: {
            formatter: (val) => Number(val).toLocaleString('es-BO'),
          },
        },
      ],
      series: [
        {
          name: 'Presupuesto Mensual [Bs.]',
          type: 'bar',
          emphasis: { focus: 'series' },
          label: {
            show: true,
            position: 'insideBottom', // ancla abajo dentro de la barra
            verticalAlign: 'bottom', // pegado al fondo
            align: 'center', // centrado horizontalmente
            rotate: 90, // texto vertical de abajo hacia arriba
            formatter: (val) => (val.value ?? 0).toLocaleString('es-BO'),
            color: '#fff',
            fontWeight: 'bold',
          },

          data: pres,
          itemStyle: { color: '#1976d2' },
        },
        {
          name: 'Venta Mensual con otros ingresos [Bs.]',
          type: 'bar',
          emphasis: { focus: 'series' },
          data: venOtr,
          itemStyle: { color: '#d32f2f' },
        },
        {
          name: 'Venta Mensual Cerámica [Bs.]',
          type: 'bar',
          emphasis: { focus: 'series' },
          data: venCer,
          itemStyle: { color: '#388e3c' },
        },
        {
          name: 'Otros ingresos [Bs.]',
          type: 'bar',
          emphasis: { focus: 'series' },
          data: otros,
          itemStyle: { color: '#9c27b0' },
        },
      ],
    }),
    [categories, pres, venOtr, venCer, otros, breaks]
  );

  // Botón para colapsar cortes (igual que el ejemplo)
  useEffect(() => {
    const echartsInstance = chartRef.current?.getEchartsInstance?.();
    if (!echartsInstance) return;

    function updateCollapseButton(params) {
      const needReset = (params?.breaks || []).some((b) => b.isExpanded);
      echartsInstance.setOption({
        graphic: [
          {
            elements: [
              {
                type: 'rect',
                ignore: !needReset,
                name: 'collapseAxisBreakBtn',
                top: 5,
                left: 5,
                shape: { r: 3, width: 170, height: 26 },
                style: { fill: '#eee', stroke: '#999', lineWidth: 1 },
                textContent: {
                  type: 'text',
                  style: {
                    text: 'Colapsar cortes del eje',
                    fontSize: 12,
                    fontWeight: 'bold',
                  },
                },
                textConfig: { position: 'inside' },
              },
            ],
          },
        ],
      });
    }

    echartsInstance.on('axisbreakchanged', updateCollapseButton);
    echartsInstance.on('click', (params) => {
      if (params.name === 'collapseAxisBreakBtn') {
        echartsInstance.dispatchAction({
          type: 'collapseAxisBreak',
          yAxisIndex: 0,
          breaks,
        });
      }
    });

    // init state
    updateCollapseButton({ breaks: [] });

    return () => {
      echartsInstance.off('axisbreakchanged', updateCollapseButton);
      echartsInstance.off('click');
    };
  }, [breaks]);

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      style={{ height: 480, width: '100%' }}
    />
  );
}
