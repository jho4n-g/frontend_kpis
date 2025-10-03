import React, { useMemo, useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

// --- Helpers ---
const toMoney = (v) =>
  (v ?? 0).toLocaleString('es-BO', { maximumFractionDigits: 2 });

function computeAxisBreaks(values) {
  const arr = (values || []).filter((n) => Number.isFinite(n));
  if (!arr.length) return [];
  const max = Math.max(...arr);
  const breaks = [];
  if (max > 100_000) breaks.push({ start: 5_000, end: 100_000, gap: '1.5%' });
  if (max > 3_000_000)
    breaks.push({ start: 105_000, end: 3_100_000, gap: '1.5%' });
  return breaks;
}

// Series factory con etiqueta vertical centrada y 'id' estable
const mkSeries = (id, name, dim, color, labelExtra = {}) => ({
  id,
  name,
  type: 'bar',
  encode: { x: 'Mes', y: dim },
  barMaxWidth: 28,
  itemStyle: { color },
  label: {
    show: true, // on/off se controla en runtime (stack vs group)
    position: 'inside',
    align: 'center',
    verticalAlign: 'middle',
    rotate: 90,
    color: '#fff',
    fontWeight: 'bold',
    formatter: ({ value }) => toMoney(value?.[dim]),
    ...labelExtra, // extras por serie (p.ej. fondo p/ “Otros ingresos”)
  },
  universalTransition: true,
  emphasis: { focus: 'series' },
});

export default function IngresoTotalECharts({ rows = [], height = 480 }) {
  const [open, setOpen] = useState(false);

  const dataset = useMemo(
    () =>
      rows.map((r) => ({
        Mes: r.mes,
        Presupuesto: r.PresMen ?? 0,
        VentaOtros: r.VentMenOtrIng ?? 0,
        VentaCeramica: r.venMenCer ?? 0,
        OtrosIngresos: r.otrIngr ?? 0,
      })),
    [rows]
  );

  if (!rows?.length) {
    return (
      <div style={{ height: 320, display: 'grid', placeItems: 'center' }}>
        Sin datos para graficar
      </div>
    );
  }

  const categorias = useMemo(() => dataset.map((d) => d.Mes), [dataset]);
  const allVals = useMemo(
    () =>
      dataset.flatMap((d) => [
        d.Presupuesto,
        d.VentaOtros,
        d.VentaCeramica,
        d.OtrosIngresos,
      ]),
    [dataset]
  );
  const breaks = useMemo(() => computeAxisBreaks(allVals), [allVals]);

  const muchosMeses = categorias.length > 12;
  const rotacionX = categorias.length > 9 ? 30 : 0;

  // ids de series para parches rápidos
  const seriesIds = ['sPres', 'sVO', 'sVC', 'sOI'];
  const offLabels = seriesIds.map((id) => ({ id, label: { show: false } }));
  const onLabels = seriesIds.map((id) => ({ id, label: { show: true } }));

  const option = useMemo(
    () => ({
      aria: { enabled: true },
      title: {
        text: 'INGRESO TOTAL',
        subtext: 'Haz clic en el botón para colapsar cortes del eje',
        left: 'center',
        textStyle: { fontSize: 18 },
        subtextStyle: { color: '#175ce5', fontSize: 13, fontWeight: 'bold' },
      },
      dataset: {
        dimensions: [
          'Mes',
          'Presupuesto',
          'VentaOtros',
          'VentaCeramica',
          'OtrosIngresos',
        ],
        source: dataset,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: toMoney,
        order: 'valueDesc',
      },
      legend: { bottom: 0 },
      toolbox: {
        right: 84, // 👈 corrido para no chocar con el botón de zoom
        top: 8,
        itemGap: 14,
        feature: {
          saveAsImage: { title: 'Guardar' },
          restore: { title: 'Restaurar' },
        },
      },
      grid: { top: 70, left: 60, right: 30, bottom: 76, containLabel: true },
      dataZoom: [
        {
          type: 'slider',
          height: 18,
          bottom: 40,
          startValue: 0,
          endValue: muchosMeses ? 11 : categorias.length - 1,
        },
        { type: 'inside' },
      ],
      xAxis: [
        {
          type: 'category',
          axisLabel: { rotate: rotacionX, interval: 0, margin: 12 },
        },
      ],
      yAxis: [
        {
          type: 'value',
          breaks,
          breakArea: { itemStyle: { opacity: 1 }, zigzagZ: 200 },
          axisLabel: { formatter: (val) => toMoney(val) },
          minorTick: { show: true },
          minorSplitLine: { show: false },
        },
      ],
      // ✅ Etiqueta fuera de la barra cuando es muy chica
      labelLayout: (p) => {
        const GAP = 14; // separación extra por encima de la barra
        // Para "Otros ingresos": fuera, centrada y VERTICAL
        if (p.seriesId === 'sOI') {
          const cx = p.rect.x + p.rect.width / 2;
          const top = p.rect.y;
          const halfLabelW = (p.labelRect?.width ?? 12) / 2; // al rotar 90°, la "altura" efectiva ≈ width

          return {
            x: cx,
            y: Math.max(top - GAP - halfLabelW, 2), // más arriba de la barra
            align: 'center',
            verticalAlign: 'middle',
            rotation: Math.PI / 2, // ← vertical (en radianes para labelLayout)
            hide: false,
          };
        }

        // Resto de series: dentro; oculta si es muy chica o se solapa
        if (p.rect?.width < 12 || p.rect?.height < 10) return { hide: true };
        return { hideOverlap: true };
      },

      series: [
        mkSeries(
          'sPres',
          'Presupuesto Mensual [Bs.]',
          'Presupuesto',
          '#1976d2'
        ),
        mkSeries(
          'sVO',
          'Venta Mensual con otros ingresos [Bs.]',
          'VentaOtros',
          '#d32f2f'
        ),
        mkSeries(
          'sVC',
          'Venta Mensual Cerámica [Bs.]',
          'VentaCeramica',
          '#388e3c'
        ),
        mkSeries('sOI', 'Otros ingresos [Bs.]', 'OtrosIngresos', '#9c27b0', {
          position: 'top', // ancla arriba (labelLayout igual lo reposiciona)
          distance: 60, // separación base
          rotate: 90, // ← vertical en la opción de la serie
          backgroundColor: '#9c27b0',
          padding: [1, 3],
          borderRadius: 2,
          barMinHeight: 2,
        }),
      ],
      animationDuration: 400,
      animationDurationUpdate: 200,
    }),
    [dataset, categorias.length, muchosMeses, rotacionX, breaks]
  );

  const chartRef = useRef(null);
  const lastStackedRef = useRef(null);

  // Fuerza on/off de labels al cambiar entre "Apilar" y "Agrupar"
  useEffect(() => {
    const ec = chartRef.current?.getEchartsInstance?.();
    if (!ec) return;

    const applyLabelVisibility = () => {
      const opt = ec.getOption();
      const sers = Array.isArray(opt.series) ? opt.series : [];
      const isStacked = sers.some((s) => !!s.stack);
      if (isStacked !== lastStackedRef.current) {
        lastStackedRef.current = isStacked;
        ec.setOption(
          { series: isStacked ? offLabels : onLabels },
          { notMerge: false, lazyUpdate: true }
        );
      }
    };

    ec.on('finished', applyLabelVisibility);
    applyLabelVisibility();

    return () => ec.off('finished', applyLabelVisibility);
  }, [offLabels, onLabels]);

  // Botón para colapsar cortes del eje
  useEffect(() => {
    const ec = chartRef.current?.getEchartsInstance?.();
    if (!ec) return;

    function updateCollapseButton(params) {
      const needReset = (params?.breaks || []).some((b) => b.isExpanded);
      ec.setOption({
        graphic: [
          {
            elements: [
              {
                type: 'rect',
                ignore: !needReset,
                name: 'collapseAxisBreakBtn',
                top: 5,
                left: 5,
                shape: { r: 3, width: 190, height: 26 },
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

    const onAxisBreakChanged = (p) => updateCollapseButton(p);
    const onClick = (p) => {
      if (p.componentType === 'graphic' && p.name === 'collapseAxisBreakBtn') {
        ec.dispatchAction({ type: 'collapseAxisBreak', yAxisIndex: 0, breaks });
      }
    };

    ec.on('axisbreakchanged', onAxisBreakChanged);
    ec.on('click', onClick);
    updateCollapseButton({ breaks: [] });

    return () => {
      ec.off('axisbreakchanged', onAxisBreakChanged);
      ec.off('click', onClick);
    };
  }, [breaks]);

  // --- UI: contenedor + botón de zoom + modal grande ---
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

        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height, width: '100%' }}
          notMerge={false}
          lazyUpdate
        />
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xl"
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 1 }}>
            <ReactECharts
              option={option}
              style={{ height: '72vh', width: '100%' }}
              notMerge={false}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
