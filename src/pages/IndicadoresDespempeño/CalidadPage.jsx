import { useState, useCallback, useEffect } from 'react';
import { Paper, Stack } from '@mui/material';

import {
  getAll,
  updateMetaCalidad,
  createCalidad,
  updateCalidad,
  getPeriodoCalidad,
} from '../../service/calidad';
import {
  formatMonthYear,
  formatPercent,
  formatNumber,
} from '../../lib/convert.js';
import ReusableKpiTable from '../../components/general/SmartTable.jsx';
import CalidadMetaModal from '../../components/calidad/CalidadMetaModal.jsx';
import CalidadModal from '../../components/calidad/CalidadModal.jsx';
import AxisBreakBarChart from '../../components/general/AxisBreakBarChart.jsx';
import ReusablePercentChart from '../../components/general/ReusablePercentChart.jsx';
const GROUPS = [
  { id: 'producMen', label: 'Producciones mensuales' },
  { id: 'acumulados', label: 'Acumulados' },
];

const columns = [
  {
    id: 'periodo',
    label: 'Periodo',
    minWidth: 80,
    format: formatMonthYear,
    group: null,
    type: 'date',
  },
  {
    id: 'produccionMensual',
    label: 'Produccion Mensual',
    minWidth: 80,
    format: formatNumber,
    group: 'producMen',
    type: 'number',
  },
  {
    id: 'presupusto',
    label: 'Presupusto',
    minWidth: 130,
    format: formatNumber,
    group: 'producMen',
    type: 'number',
  },
  {
    id: 'produccionPrimeraMensual',
    label: 'Produccion Primera Mensual',
    minWidth: 130,
    format: formatNumber,
    group: 'producMen',
    type: 'number',
  },
  {
    id: 'produccionSegundaMensual',
    label: 'Produccion Segunda Mensual',
    minWidth: 120,
    format: formatNumber,
    group: 'producMen',
    type: 'number',
  },
  {
    id: 'produccionTerceraMensual',
    label: 'Produccion Tercera Mensual',
    align: 'right',
    format: formatNumber,
    group: 'producMen',
    type: 'number',
  },
  {
    id: 'produccionCascoteMensual',
    label: 'Produccion Cascote Mensual',
    align: 'right',
    format: formatNumber,
    group: 'producMen',
    type: 'number',
  },
  {
    id: 'primeraCalidad',
    label: 'Primera Calidad',
    minWidth: 110,
    format: formatPercent,
    group: 'producMen',
    type: 'number',
  },
  {
    id: 'segundaCalidad',
    label: 'Segunda Calidad',
    minWidth: 110,
    format: formatPercent,
    group: 'producMen',
    type: 'number',
  },
  {
    id: 'terceraCalidad',
    label: 'Tercera Calidad',
    minWidth: 110,
    format: formatPercent,
    group: 'producMen',
    type: 'number',
  },
  {
    id: 'cascote',
    label: 'Cascote',
    minWidth: 110,
    format: formatPercent,
    group: 'producMen',
    type: 'number',
  },
  {
    id: 'produccionAcumulada',
    label: 'Produccion Acumulada',
    minWidth: 110,
    format: formatNumber,
    group: 'acumulados',
    type: 'number',
  },
  {
    id: 'primeraCalidadAcumulada',
    label: 'Primera Calidad Acumulada',
    minWidth: 110,
    format: formatNumber,
    group: 'acumulados',
    type: 'number',
  },
  {
    id: 'cascoteCalidadAcumulado',
    label: 'Cascote Calidad Acumulado',
    minWidth: 110,
    format: formatNumber,
    group: 'acumulados',
    type: 'number',
  },
  {
    id: 'primeraAcumulada',
    label: 'Primera Acumulada',
    minWidth: 110,
    format: formatPercent,
    group: 'acumulados',
    type: 'number',
  },
  {
    id: 'cascoteAcumulado',
    label: 'Cascote Acumulado',
    minWidth: 110,
    format: formatPercent,
    group: 'acumulados',
    type: 'number',
  },
  {
    id: 'metaPrimera',
    label: 'Meta Primera %',
    minWidth: 110,
    format: formatPercent,
    group: 'producMen',
    type: 'percent',
  },
  {
    id: 'metaCascote',
    label: 'Meta Cascote %',
    minWidth: 110,
    format: formatPercent,
    group: 'producMen',
    type: 'percent',
  },
];
const PRESET_VIEWS = {
  'Producciones Mensuales': {
    visible: [
      'periodo',
      'produccionMensual',
      'presupusto',
      'produccionPrimeraMensual',
      'produccionSegundaMensual',
      'produccionTerceraMensual',
      'produccionCascoteMensual',
      'primeraCalidad',
      'segundaCalidad',
      'terceraCalidad',
      'cascote',
    ],
  },
  Acumulados: {
    visible: [
      'periodo',
      'produccionAcumulada',
      'primeraCalidadAcumulada',
      'cascoteCalidadAcumulado',
      'primeraAcumulada',
      'cascoteAcumulado',
    ],
  },
  Metas: {
    visible: ['metaPrimera', 'metaCascote'],
  },
  Todo: { visible: columns.map((c) => c.id) },
};

// const seriesCalidad = [
//   { name: 'Primera Calidad [Bs.]', key: 'primeraCalidad', color: '#1976d2' },
//   { name: 'Segunda Calidad[Bs.]', key: 'segundaCalidad', color: '#ef6c00' },
//   { name: 'Tercera Calidad [Bs.]', key: 'terceraCalidad', color: '#2e7d32' },
// ];

const seriesCalidad = [
  {
    name: 'Primera Calidad %',
    key: 'primeraCalidad',
    type: 'bar',
    color: '#37833bff',
    labelInside: true,
  },
  {
    name: 'Segunda Calidad %',
    key: 'segundaCalidad',
    type: 'bar',
    color: '#22527cff',
    labelInside: true,
  },
  {
    name: 'Tercera Calidad  %',
    key: 'terceraCalidad',
    type: 'bar',
    color: '#22527cff',
    labelInside: true,
  },
  {
    name: 'Meta',
    type: 'line',
    dashed: true,
    color: '#994444ff',
    // lee meta con coma o aplica 0.9 por defecto
    accessor: (r) => {
      const m = Number(String(r?.meta).replace(',', '.'));
      return Number.isFinite(m) && m > 0 ? m : 0.9;
    },
  },
];

const seriesPrimera = [
  {
    name: 'Primera Calidad %',
    key: 'primeraCalidad',
    type: 'bar',
    color: '#37833bff',
    labelInside: true,
  },
  {
    name: 'Primera Acumulado %',
    key: 'primeraAcumulada',
    type: 'bar',
    color: '#22527cff',
    labelInside: true,
  },
  // 🟢 Línea que representa la tendencia (misma data de primeraAcumulada)
  {
    name: 'Tendencia Acumulado',
    type: 'line',
    color: '#22527cff',
    smooth: true, // curva suave
    symbol: 'circle',
    showSymbol: false,
    lineStyle: {
      width: 2,
      opacity: 0.8,
    },
    // usa directamente el valor de la barra “primeraAcumulada”
    accessor: (r) => Number(r?.primeraAcumulada ?? 0),
  },
  // 🔴 Línea de meta (usando metaPrimera)
  {
    name: 'Meta',
    type: 'line',
    dashed: true,
    color: '#994444ff',
    lineStyle: {
      type: 'dashed',
      width: 2,
    },
    symbol: 'none',
    accessor: (r) => {
      const m = Number(String(r?.metaPrimera).replace(',', '.'));
      return Number.isFinite(m) && m > 0 ? m : 0.9;
    },
  },
];

const seriesSegunda = [
  {
    name: 'Segunda Calidad %',
    key: 'segundaCalidad',
    type: 'bar',
    color: '#22527cff',
    labelInside: true,
  },
];
const seriesCascote = [
  {
    name: 'Cascote %',
    key: 'cascote',
    type: 'bar',
    color: '#2f7f32',
    labelInside: true,
  },
  {
    name: 'Cascote Acumulado %',
    key: 'cascoteAcumulado',
    type: 'bar',
    color: '#244b86',
    labelInside: true,
  },
  // 🟢 Línea que representa la tendencia (misma data de primeraAcumulada)
  {
    name: 'Tendencia Acumulado',
    type: 'line',
    color: '#244b86',
    smooth: true,
    lineStyle: { width: 2 },
  },
  // 🔴 Línea de meta (usando metaPrimera)
  {
    name: 'Meta',
    type: 'line',
    dashed: true,
    color: '#994444ff',
    lineStyle: { type: 'dashed', width: 2 },
    accessor: (r) => {
      const m = Number(String(r?.metaCascote).replace(',', '.'));
      // Si ya viene como 0.01 (1%) => OK
      // Si viene como 1.2 (120%) => convertir a 0.012
      if (!Number.isFinite(m) || m <= 0) return 0.012;
      return m > 1 ? m / 100 : m;
    },
  },
];

export default function CalidadPage() {
  //siempre tiene que tener llaves
  const [data, setData] = useState([]);
  const [openMeta, setOpenMeta] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [desempeñoCalidad, setDesempeñoCalidad] = useState([]);
  const [datePrimera, setDataPrimera] = useState([]);
  const [dateSegunda, setDataSegunda] = useState([]);
  const [dateCascote, setDataCascote] = useState([]);

  const reload = useCallback(async () => {
    const resp = await getAll();
    setData(Array.isArray(resp) ? resp : (resp?.normalizados ?? []));
    setDesempeñoCalidad(
      Array.isArray(resp) ? resp : (resp?.valoresDesempeñoCalidad ?? [])
    );
    setDataPrimera(
      Array.isArray(resp) ? resp : (resp?.valoresDesempeñoPrimera ?? [])
    );
    setDataSegunda(
      Array.isArray(resp) ? resp : (resp?.valoresDesempeñoSegunda ?? [])
    );
    setDataCascote(
      Array.isArray(resp) ? resp : (resp?.valoresDesempeñoCascote ?? [])
    );
    //console.log('SSSS', resp.valoresDesempeñoCascote);
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return (
    <>
      <Stack spacing={3}>
        <Paper>
          <ReusableKpiTable
            title="CALIDAD"
            lsKeyPrefix="calidad"
            groups={GROUPS}
            columns={columns}
            presetViews={PRESET_VIEWS}
            data={data}
            onChangeMeta={() => setOpenMeta(true)}
            onRegister={() => {
              setSelectedRow(null);
              setOpen(true);
            }}
            onEditRow={(row) => {
              setSelectedRow(row);
              setOpen(true);
            }}
          />
        </Paper>
        <CalidadMetaModal
          open={openMeta}
          onClose={() => setOpenMeta(false)}
          onSuccess={reload}
          updateMeta={updateMetaCalidad}
        />
        <CalidadModal
          key={selectedRow ? selectedRow.id : 'new'}
          open={open}
          onClose={() => setOpen(false)}
          onSuccess={reload}
          createFn={createCalidad}
          updateFn={updateCalidad}
          getPeriodoCalidad={getPeriodoCalidad}
          initialValues={selectedRow}
        />

        {/* <Paper>
          <AxisBreakBarChart
            title="DESEMPEÑO DE CALIDAD"
            rows={desempeñoCalidad}
            xKey={(r) => r.mes || formatMonthYear(r.periodo)}
            xDimName="Mes"
            series={seriesCalidad}
          />
        </Paper> */}
        <Paper>
          <ReusablePercentChart
            title="DESEMPEÑO DE LA CALIDAD (%)"
            rows={desempeñoCalidad}
            xKey="mes"
            series={seriesCalidad}
          />
        </Paper>
        <Paper>
          <ReusablePercentChart
            title="DESEMPEÑO DE PPRIMEA (%)"
            rows={datePrimera}
            xKey="mes"
            series={seriesPrimera}
          />
        </Paper>
        <Paper>
          <ReusablePercentChart
            title="DESEMPEÑO DE  SEGUNDA (%)"
            rows={dateSegunda}
            xKey="mes"
            series={seriesSegunda}
          />
        </Paper>
        <Paper>
          <ReusablePercentChart
            title="DESEMPEÑO DE  CASCOTE (%)"
            rows={dateCascote}
            xKey="mes"
            series={seriesCascote}
          />
        </Paper>
      </Stack>
    </>
  );
}
