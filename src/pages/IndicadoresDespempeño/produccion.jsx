import { useState, useCallback, useEffect } from 'react';
import { Paper, Stack } from '@mui/material';

import {
  getAll,
  UpdateMeta,
  createProduccion,
  getPeriodoProduccion,
  updateProduccion,
} from '../../service/produccion.js';
import {
  formatMonthYear,
  formatPercent,
  formatNumber,
} from '../../lib/convert.js';
import ReusableKpiTable from '../../components/general/SmartTable.jsx';
import PrecioUnitarioMetaModal from '../../components/CambiarMentaModal.jsx';
import ProduccionModal from '../../components/produccion/ProduccionModal.jsx';
import AxisBreakBarChart from '../../components/general/AxisBreakBarChart.jsx';
import ReusablePercentChart from '../../components/general/ReusablePercentChart.jsx';

const GROUPS = [
  { id: 'producMen', label: 'Producciones mensuales' },
  { id: 'acumulados', label: 'Acumulados' },
  { id: 'metas', label: 'Metas' },
];

const COLUMNS_PRODUCCION = [
  {
    id: 'periodo',
    label: 'Periodo',
    minWidth: 80,
    format: formatMonthYear,
    group: null,
    type: 'date',
  },
  {
    id: 'presu',
    label: 'Presupuesto',
    format: formatNumber,
    group: 'producMen',
    type: 'number',
  },
  {
    id: 'producMen',
    label: 'Producción Mensual',
    format: formatNumber,
    group: 'producMen',
    type: 'number',
  },

  {
    id: 'producAcu',
    label: 'Producción Acumulada',
    format: formatNumber,
    group: 'acumulados',
    type: 'number',
  },
  {
    id: 'difProducAcuvsPresAcu',
    label: 'Diferencia Produccion Acumulada vs Presupuesto Acumulado',
    format: formatNumber,
    group: 'acumulados',
    type: 'number',
  },
  {
    id: 'meta',
    label: 'Meta',
    format: formatPercent,
    group: 'metas',
    type: 'percent',
  },
  {
    id: 'cumplMen',
    label: 'Cumplimiento Mensual',
    format: formatPercent,
    group: 'producMen',
    type: 'percent',
  },
  {
    id: 'cumpAcuPres',
    label: 'Cumplimiento Acumulado',
    format: formatPercent,
    group: 'acumulados',
    type: 'percent',
  },
];
const PRESET_VIEWS = {
  'Producciones Mensuales': {
    visible: ['periodo', 'presu', 'producMen'],
  },
  Acumulados: {
    visible: [
      'periodo',
      'producAcu',
      'metaAcuPresu',
      'difProducAcuvsPresAcu',
      'meta',
      'cumplMen',
      'cumpAcuPres',
    ],
  },
  Todo: { visible: COLUMNS_PRODUCCION.map((c) => c.id) },
};

const series = [
  {
    name: 'Presupuesto',
    key: 'presu',
    type: 'bar',
    color: '#37833bff',
    labelInside: true,
  },
  {
    name: 'Produccion Mensual',
    key: 'producMen',
    type: 'bar',
    color: '#22527cff',
    labelInside: true,
  },
  {
    name: 'Produccion Acumulada',
    key: 'producAcu',
    type: 'bar',
    color: '#22527cff',
    labelInside: true,
  },
  {
    name: 'Meta Acumulada Presupuesto',
    key: 'metaAcuPresu',
    type: 'bar',
    color: '#22527cff',
    labelInside: true,
  },
];

const seriesCumpli = [
  {
    name: 'Cumplimiento Mensual',
    key: 'cumplMen',
    type: 'bar',
    color: '#37833bff',
    labelInside: true,
  },
  {
    name: 'Cumplimiento Acumulado Presupuesto',
    key: 'cumpAcuPres',
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

export default function Produccion() {
  const [data, setData] = useState([]);
  const [openMeta, setOpenMeta] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [datosPro, setDatosGrafica] = useState([]);
  const [datosCump, setDatosCum] = useState([]);

  const reload = useCallback(async () => {
    const resp = await getAll();
    setData(Array.isArray(resp) ? resp : (resp?.normalizados ?? []));
    setDatosGrafica(Array.isArray(resp) ? resp : (resp?.datosProduccion ?? []));
    setDatosGrafica(Array.isArray(resp) ? resp : (resp?.datosProduccion ?? []));
    setDatosCum(Array.isArray(resp) ? resp : (resp?.datosCumpli ?? []));
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
            columns={COLUMNS_PRODUCCION}
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
          <ProduccionModal
            open={open}
            onClose={() => setOpen(false)}
            onSuccess={() => console.log('✅ Guardado correctamente')}
            initialValues={selectedRow}
            createFn={createProduccion}
            updateFn={updateProduccion}
            getPeriodoProduccion={getPeriodoProduccion}
          />

          <PrecioUnitarioMetaModal
            open={openMeta}
            onClose={() => setOpenMeta(false)}
            initialMeta={100}
            updateMeta={UpdateMeta}
            onSuccess={() => {
              reload();
            }}
          />
        </Paper>

        <Paper>
          <AxisBreakBarChart
            title="DESEMPEÑO DE CALIDAD"
            rows={datosPro}
            xKey={(r) => r.mes || formatMonthYear(r.periodo)}
            xDimName="Mes"
            series={series}
          />
        </Paper>
        <Paper>
          <ReusablePercentChart
            title="DESEMPEÑO DE PPRIMEA (%)"
            rows={datosCump}
            xKey="mes"
            series={seriesCumpli}
          />
        </Paper>
      </Stack>
    </>
  );
}
