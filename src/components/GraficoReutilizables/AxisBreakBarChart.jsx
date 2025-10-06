import React, { useMemo, useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Box, IconButton, Dialog, DialogContent } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

/** Default money formatter (Bolivia) */
const defaultToMoney = (v) =>
  (v ?? 0).toLocaleString('es-BO', { maximumFractionDigits: 2 });

/**
 * Default axis-breaks calculator.
 * Creates two breaks when values are far apart to avoid tiny bars.
 */
function defaultComputeAxisBreaks(values) {
  const arr = (values || []).filter((n) => Number.isFinite(n));
  if (!arr.length) return [];
  const max = Math.max(...arr);
  const breaks = [];
  if (max > 100_000) breaks.push({ start: 5_000, end: 100_000, gap: '1.5%' });
  if (max > 3_000_000)
    breaks.push({ start: 105_000, end: 3_100_000, gap: '1.5%' });
  return breaks;
}

/** Helper to read numeric values supporting comma decimals */
const readNumber = (raw) => {
  const n = Number(String(raw ?? 0).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

/** Factory for a bar/line series that reads from dataset dimensions via `encode`. */
const mkSeries = ({
  id,
  name,
  dim,
  color,
  type = 'bar',
  labelInside = true,
  stack,
}) => {
  const base = {
    id,
    name,
    type,
    encode: { x: '__X__', y: dim },
    itemStyle: color ? { color } : undefined,
    emphasis: { focus: 'series' },
    universalTransition: true,
    stack,
  };

  if (type === 'bar') {
    return {
      ...base,
      barMaxWidth: 28,
      label: labelInside
        ? {
            show: true,
            position: 'inside',
            align: 'center',
            verticalAlign: 'middle',
            rotate: 90,
            color: '#fff',
            fontWeight: 'bold',
            formatter: ({ value }) => defaultToMoney(value?.[dim]),
          }
        : undefined,
    };
  }

  // line
  return {
    ...base,
    symbol: 'none',
    lineStyle: { type: 'solid' },
    label: {
      show: true,
      position: 'top',
      color: '#616161',
      formatter: ({ value }) => defaultToMoney(value?.[dim]),
    },
  };
};

/**
 * AxisBreakBarChart (Reusable)
 *
 * Props:
 *  - title: string
 *  - rows: Array<any>
 *  - xKey: string | ((row)=>string)
 *  - xDimName?: string (default 'Mes')
 *  - series: Array<{
 *      id?: string,
 *      name: string,
 *      key?: string,
 *      accessor?: (row)=>number,
 *      color?: string,
 *      type?: 'bar' | 'line',
 *      labelInside?: boolean,
 *      stack?: string,                   // optional stack id for bars
 *      dim?: string                      // optional dataset dimension name
 *    }>
 *  - valueFormatter?: (number)=>string   // tooltip & axis formatter
 *  - computeBreaks?: (values:number[])=>AxisBreak[]
 *  - height?: number
 *  - modalHeight?: number|string
 *  - legendBottom?: number               // px
 *  - enableCollapseButton?: boolean      // show/hide collapse axis-break button
 */
export default function AxisBreakBarChart({
  title = 'GRÁFICO (Bs.)',
  rows = [],
  xKey = 'mes',
  xDimName = 'Mes',
  series = [],
  valueFormatter = defaultToMoney,
  computeBreaks = defaultComputeAxisBreaks,
  height = 480,
  modalHeight = '72vh',
  legendBottom = 0,
  enableCollapseButton = true,
}) {
  const [open, setOpen] = useState(false);
  const chartRef = useRef(null);
  const lastStackedRef = useRef(null);

  const getX = typeof xKey === 'function' ? xKey : (r) => r?.[xKey];

  // Build dataset with dynamic dimensions: [__X__, ...seriesDims]
  const { dataset, categorias, allValues, seriesDefs } = useMemo(() => {
    const dims = [
      '__X__',
      ...series.map((s, i) => s.dim || s.key || `dim_${i}`),
    ];

    const src = rows.map((r) => {
      const rowObj = { __X__: getX(r) };
      series.forEach((s, i) => {
        const dim = s.dim || s.key || `dim_${i}`;
        const val =
          typeof s.accessor === 'function'
            ? s.accessor(r)
            : readNumber(r?.[s.key]);
        rowObj[dim] = Number.isFinite(val) ? Number(val) : 0;
      });
      return rowObj;
    });

    const cats = src.map((d) => d.__X__);
    const vals = src.flatMap((d) =>
      series.map((s, i) => readNumber(d[s.dim || s.key || `dim_${i}`]))
    );

    // Series definitions with ensured ids and dims
    const sdefs = series.map((s, i) => ({
      ...s,
      id: s.id || `s_${i}`,
      dim: s.dim || s.key || `dim_${i}`,
    }));

    return {
      dataset: { dimensions: dims, source: src },
      categorias: cats,
      allValues: vals,
      seriesDefs: sdefs,
    };
  }, [rows, series, xKey]);

  const breaks = useMemo(
    () => computeBreaks(allValues),
    [allValues, computeBreaks]
  );

  const muchosMeses = categorias.length > 12;
  const rotacionX = categorias.length > 9 ? 30 : 0;

  // Build series options from defs
  const seriesOptions = useMemo(
    () =>
      seriesDefs.map((s) =>
        mkSeries({
          id: s.id,
          name: s.name,
          dim: s.dim,
          color: s.color,
          type: s.type,
          labelInside: s.labelInside,
          stack: s.stack,
        })
      ),
    [seriesDefs]
  );

  const option = useMemo(
    () => ({
      aria: { enabled: true },
      title: {
        text: title,
        left: 'center',
        textStyle: { fontSize: 18 },
      },
      dataset,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: valueFormatter,
        order: 'valueDesc',
      },
      legend: { bottom: legendBottom },
      toolbox: {
        right: 84,
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
          axisLabel: { formatter: (val) => valueFormatter(val) },
          minorTick: { show: true },
          minorSplitLine: { show: false },
        },
      ],
      labelLayout: (p) => {
        if (p.rect?.width < 12 || p.rect?.height < 10) return { hide: true };
        return { hideOverlap: true };
      },
      series: seriesOptions,
      animationDuration: 400,
      animationDurationUpdate: 200,
    }),
    [
      title,
      dataset,
      valueFormatter,
      legendBottom,
      muchosMeses,
      categorias.length,
      rotacionX,
      breaks,
      seriesOptions,
    ]
  );
  const getInst = () => {
    const inst = chartRef.current?.getEchartsInstance?.();
    return inst && !inst.isDisposed?.() ? inst : null;
  };
  // Hide labels when stacking is enabled (avoid clutter) — keeps hooks order fixed
  useEffect(() => {
    const applyLabelVisibility = () => {
      const ec = getInst();
      if (!ec) return;
      const opt = ec.getOption?.();
      if (!opt) return;
      const sers = Array.isArray(opt.series) ? opt.series : [];
      const isStacked = sers.some((s) => !!s.stack);
      if (isStacked !== lastStackedRef.current) {
        lastStackedRef.current = isStacked;
        const updates = seriesDefs.map((s) => ({
          id: s.id,
          label: { show: !isStacked && s.type !== 'line' && s.labelInside },
        }));
        ec.setOption(
          { series: updates },
          { notMerge: false, lazyUpdate: true }
        );
      }
    };

    const ec0 = getInst();
    if (!ec0) return;
    ec0.on('finished', applyLabelVisibility);
    applyLabelVisibility();
    return () => {
      const ec = getInst();
      if (ec) ec.off('finished', applyLabelVisibility);
    };
  }, [seriesDefs]);

  // Collapse-axis-break button logic
  useEffect(() => {
    if (!enableCollapseButton) return;

    const updateCollapseButton = (params) => {
      const ec = getInst();
      if (!ec) return;
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
    };
    const onClick = (p) => {
      if (p.componentType === 'graphic' && p.name === 'collapseAxisBreakBtn') {
        const ec = getInst();
        if (!ec) return;
        ec.dispatchAction({ type: 'collapseAxisBreak', yAxisIndex: 0, breaks });
      }
    };

    const ec0 = getInst();
    if (!ec0) return;
    ec0.on('axisbreakchanged', updateCollapseButton);
    ec0.on('click', onClick);
    updateCollapseButton({ breaks: [] });

    return () => {
      const ec = getInst();
      if (ec) {
        ec.off('axisbreakchanged', updateCollapseButton);
        ec.off('click', onClick);
      }
    };
  }, [breaks, enableCollapseButton]);

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
            zIndex: 5,
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
            ref={chartRef}
            option={option}
            style={{ height, width: '100%' }}
            notMerge={false}
            lazyUpdate
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
        fullWidth
        maxWidth="xl"
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 1 }}>
            {hasRows && (
              <ReactECharts
                option={option}
                style={{ height: modalHeight, width: '100%' }}
                notMerge={false}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * ---- Example usage (remove if you only want the component) ----
 *
 * import { formatMonthYear } from "../../lib/convert";
 * const seriesPU = [
 *   { name: "Presupuesto [Bs.]", key: "presMen", color: "#1976d2" },
 *   { name: "Precio promedio [Bs.]", key: "precProm", color: "#ef6c00" },
 *   { name: "Región Centro [Bs.]", key: "regionCentro", color: "#2e7d32" },
 *   { name: "Región Este [Bs.]", key: "regionEste", color: "#0288d1" },
 *   { name: "Región Oeste [Bs.]", key: "regionOeste", color: "#6a1b9a" },
 *   { name: "Fábrica [Bs.]", key: "fabrica", color: "#455a64" },
 *   { name: "Exportación [Bs.]", key: "exportacion", color: "#9c27b0" },
 * ];
 *
 * <AxisBreakBarChart
 *   title="PRECIO UNITARIO (Bs.)"
 *   rows={rows}
 *   xKey={(r) => r.mes || formatMonthYear(r.periodo)}
 *   xDimName="Mes"
 *   series={seriesPU}
 * />
 */
