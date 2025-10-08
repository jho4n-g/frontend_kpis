import { useState, useCallback, useEffect } from 'react';
import { Paper, Stack } from '@mui/material';

import {
  getAll,
  createObj,
  getPeriodo,
  updateObj,
  UpdateMeta,
} from '../../service/disponibilidad.js';
import {
  formatMonthYear,
  formatPercent,
  formatNumber,
} from '../../lib/convert.js';
import ReusableKpiTable from '../../components/general/SmartTable.jsx';
import DisponibilidadModal from '../../components/disponibilidadPorLinea/DisponibilidadModal.jsx';
import CambiarMentaModal from '../../components/CambiarMentaModal.jsx';
import AxisBreakBarChart from '../../components/general/AxisBreakBarChart.jsx';
import ReusablePercentChart from '../../components/general/ReusablePercentChart.jsx';

const GROUPS = [
  { id: 'horas', label: 'Nro Horas' },
  { id: 'disponibilidad', label: 'Disponibilidades' },
  { id: 'meta', label: 'Meta' },
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
    id: 'nroHorasProactivasPlanificadas',
    label: 'Proactivas Planificadas',
    format: formatNumber,
    group: 'horas',
    type: 'number',
  },
  {
    id: 'nroHorasParadasLineaB',
    label: 'Paradas Linea B',
    format: formatNumber,
    group: 'horas',
    type: 'number',
  },

  {
    id: 'nroHorasParadasLineaC',
    label: 'Paradas Linea C',
    format: formatNumber,
    group: 'horas',
    type: 'number',
  },
  {
    id: 'nroHorasParadasLineaD',
    label: 'Paradas Linea D',
    format: formatNumber,
    group: 'horas',
    type: 'number',
  },
  {
    id: 'disponibilidadLineaB',
    label: 'Linea B',
    format: formatPercent,
    group: 'disponibilidad',
    type: 'percent',
  },
  {
    id: 'disponibilidadLineaC',
    label: 'Linea C',
    format: formatPercent,
    group: 'disponibilidad',
    type: 'percent',
  },
  {
    id: 'disponibilidadLineaD',
    label: 'Linea D',
    format: formatPercent,
    group: 'disponibilidad',
    type: 'percent',
  },
  {
    id: 'meta',
    label: 'Meta',
    format: formatPercent,
    group: 'meta',
    type: 'percent',
  },
];

const PRESET_VIEWS = {
  'Nro Horas': {
    visible: [
      'periodo',
      'nroHorasProactivasPlanificadas',
      'nroHorasParadasLineaB',
      'nroHorasParadasLineaC',
      'nroHorasParadasLineaD',
    ],
  },
  Acumulados: {
    visible: [
      'periodo',
      'disponibilidadLineaB',
      'disponibilidadLineaC',
      'disponibilidadLineaD',
    ],
  },
  Todo: { visible: COLUMNS_PRODUCCION.map((c) => c.id) },
};

const seriesNroHoras = [
  {
    name: 'Proactivas Planificadas',
    key: 'nroHorasProactivasPlanificadas',
    type: 'bar',
    color: '#37833bff',
    labelInside: true,
  },
  {
    name: 'Horas Paradas Linea B',
    key: 'nroHorasParadasLineaB',
    type: 'bar',
    color: '#234c97ff',
    labelInside: true,
  },
  {
    name: 'Paradas Linea C',
    key: 'nroHorasParadasLineaC',
    type: 'bar',
    color: '#349b42ff',
    labelInside: true,
  },
  {
    name: 'Paradas Linea D',
    key: 'nroHorasParadasLineaD',
    type: 'bar',
    color: '#a3972bff',
    labelInside: true,
  },
];

const seriesDisponibilidad = [
  {
    name: 'Linea B',
    key: 'disponibilidadLineaB',
    type: 'bar',
    color: '#37833bff',
    labelInside: true,
  },
  {
    name: 'Linea C',
    key: 'disponibilidadLineaC',
    type: 'bar',
    color: '#22527cff',
    labelInside: true,
  },
  {
    name: 'Linea D',
    key: 'disponibilidadLineaD',
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

export default function DisponibilidadLiens() {
  const [data, setData] = useState([]);
  const [openMeta, setOpenMeta] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [datosGrafica, setDatosGrafica] = useState([]);
  const [datosPer, setDatosPer] = useState([]);

  const reload = useCallback(async () => {
    const resp = await getAll();
    setData(Array.isArray(resp) ? resp : (resp?.normalizados ?? []));
    setDatosGrafica(
      Array.isArray(resp) ? resp : (resp?.normalizadosDatosG ?? [])
    );
    setDatosPer(Array.isArray(resp) ? resp : (resp?.normalizadosDatosP ?? []));
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return (
    <>
      <Stack spacing={3}>
        <Paper>
          <ReusableKpiTable
            title="DISPONIBILIDAD"
            lsKeyPrefix="disponibilidad"
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
        </Paper>

        <DisponibilidadModal
          open={open}
          onClose={() => setOpen(false)}
          onSuccess={reload}
          createFn={createObj}
          updateFn={updateObj}
          getPeriodoSiguiente={getPeriodo}
          initialValues={selectedRow}
        />
        <CambiarMentaModal
          open={openMeta}
          onClose={() => setOpenMeta(false)}
          initialMeta={100}
          updateMeta={UpdateMeta}
          onSuccess={() => {
            reload(true);
          }}
        />
        <Paper>
          <AxisBreakBarChart
            title="Nro Horas"
            rows={datosGrafica}
            xKey={(r) => r.mes || formatMonthYear(r.periodo)}
            xDimName="Mes"
            series={seriesNroHoras}
          />
        </Paper>
        <Paper>
          <ReusablePercentChart
            title="DISPONIBILIDAD"
            rows={datosPer}
            xKey="mes"
            series={seriesDisponibilidad}
          />
        </Paper>
      </Stack>
    </>
  );
}
