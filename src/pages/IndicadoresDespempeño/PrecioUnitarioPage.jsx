import { Paper, Stack } from '@mui/material';
import {
  getAll,
  CreatePrecioUnitario,
  updatePrecioUnitario,
  ObtenerPeriodo,
  UpdateMeta,
} from '../../service/precioUnitario.js';
import {
  formatMonthYear,
  formatPercent,
  formatNumber,
} from '../../lib/convert.js';
import ReusableKpiTable from '../../components/general/SmartTable.jsx';
import { useState, useCallback, useEffect } from 'react';

import ReusablePercentChart from '../../components/general/ReusablePercentChart.jsx';
import AxisBreakBarChart from '../../components/general/AxisBreakBarChart.jsx';
import PrecioUnitarioModal from '../../components/PrecioUnitario/PrecioUnitarioModal.jsx';
import PrecioUnitarioMetaModal from '../../components/CambiarMentaModal.jsx';

const GROUPS = [
  { id: 'precios', label: 'Precios mensuales' },
  { id: 'regiones', label: 'Precios Regionales' },
  { id: 'cumpl', label: 'Cumplimiento (%)' },
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
    id: 'presMen',
    label: 'Presupuesto Mensual',
    minWidth: 80,
    format: formatNumber,
    group: 'precios',
    type: 'number',
  },
  {
    id: 'precProm',
    label: 'Precio Promedio',
    minWidth: 130,
    format: formatNumber,
    group: 'precios',
    type: 'number',
  },
  {
    id: 'regionCentro',
    label: 'Region Centro',
    minWidth: 130,
    format: formatNumber,
    group: 'regiones',
    type: 'number',
  },
  {
    id: 'regionEste',
    label: 'Region Este',
    minWidth: 120,
    format: formatNumber,
    group: 'regiones',
    type: 'number',
  },
  {
    id: 'regionOeste',
    label: 'Region Oeste',
    align: 'right',
    format: formatNumber,
    group: 'regiones',
    type: 'number',
  },
  {
    id: 'fabrica',
    label: 'Fabrica',
    minWidth: 130,
    format: formatNumber,
    group: 'regiones',
    type: 'number',
  },
  {
    id: 'exportacion',
    label: 'Meta',
    minWidth: 110,
    format: formatPercent,
    group: 'regiones',
    type: 'percent',
  },
  {
    id: 'meta',
    label: 'Cumplimiento Mensual',
    minWidth: 110,
    format: formatPercent,
    group: 'cumpl',
    type: 'percent',
  },
  {
    id: 'cumplimientoMensual',
    label: 'Cumplimiento Acumulado',
    minWidth: 110,
    format: formatPercent,
    group: 'cumpl',
    type: 'percent',
  },
];
const PRESET_VIEWS = {
  'Precios Mensuales': {
    visible: ['periodo', 'precProm', 'precProm'],
  },
  'Precios Regionales': {
    visible: [
      'periodo',
      'regionCentro',
      'regionEste',
      'regionOeste',
      'Fabrica',
    ],
  },
  'Cumpl. Mensual': {
    visible: ['periodo', 'meta', 'cumplimientoMensual'],
  },
  Todo: { visible: columns.map((c) => c.id) },
};
//Grafica
const seriesPU = [
  { name: 'Presupuesto [Bs.]', key: 'presMen', color: '#1976d2' },
  { name: 'Precio promedio [Bs.]', key: 'precProm', color: '#ef6c00' },
  { name: 'Región Centro [Bs.]', key: 'regionCentro', color: '#2e7d32' },
  { name: 'Región Este [Bs.]', key: 'regionEste', color: '#0288d1' },
  { name: 'Región Oeste [Bs.]', key: 'regionOeste', color: '#6a1b9a' },
  { name: 'Fábrica [Bs.]', key: 'fabrica', color: '#455a64' },
  { name: 'Exportación [Bs.]', key: 'exportacion', color: '#9c27b0' },
];

export default function PrecioUnitarioPage() {
  const [data, setData] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [datosGrafic, setDatosGrafic] = useState([]);
  const [openMeta, setOpenMenta] = useState(false);
  const reload = useCallback(async () => {
    const resp = await getAll();
    setData(Array.isArray(resp) ? resp : (resp?.normalizados ?? []));
    setDatosGrafic(Array.isArray(resp) ? resp : (resp?.valores ?? []));
    //console.log('Precio Unitario  page', resp.normalizados);
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return (
    <>
      <Stack spacing={3}>
        <Paper>
          <ReusableKpiTable
            title="PRECIO UNITARIO"
            lsKeyPrefix="ivt"
            groups={GROUPS}
            columns={columns}
            presetViews={PRESET_VIEWS}
            defaultPresetView="Precios Mensuales"
            data={data}
            onRegister={() => {
              setSelectedRow(null);
              setOpenModal(true);
            }}
            onEditRow={(row) => {
              setSelectedRow(row);
              setOpenModal(true);
            }}
            onChangeMeta={() => {
              setOpenMenta(true);
            }}
          />
          <PrecioUnitarioModal
            open={openModal}
            onClose={() => setOpenModal(false)}
            onSuccess={() => reload(true)}
            initialValues={selectedRow}
            getPeriodoActual={ObtenerPeriodo}
            createFn={CreatePrecioUnitario}
            updateFn={updatePrecioUnitario}
            editablePeriodo={false}
            idKey="id"
          />
          <PrecioUnitarioMetaModal
            open={openMeta}
            onClose={() => setOpenMenta(false)}
            initialMeta={100}
            updateMeta={UpdateMeta}
            onSuccess={() => {
              reload(true);
            }}
          />
        </Paper>
        <Paper>
          <AxisBreakBarChart
            title="PRECIO UNITARIO (Bs.)"
            rows={datosGrafic}
            xKey={(r) => r.mes || formatMonthYear(r.periodo)}
            xDimName="Mes"
            series={seriesPU}
          />
        </Paper>
      </Stack>
    </>
  );
}
