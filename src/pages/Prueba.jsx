import IngresoVentaTotalModal from '../components/IngresoVentaTotal/IngresoVentaTotalModal.jsx';
import {
  getAll,
  CreateObje,
  UpdateObje,
} from '../service/IngresoVentaTotal.js';
import {
  formatMonthYear,
  formatPercent,
  formatNumber,
} from '../lib/convert.js';
import ReusableKpiTable from '../components/Tabla/SmartTable.jsx';
import { useState, useCallback, useEffect } from 'react';
import IngresoTotalECharts from '../components/graficos/IngresoTotalECharts.jsx';
import { getPeriodo } from '../service/libs.js';
const GROUPS = [
  { id: 'mensuales', label: 'Ingresos mensuales' },
  { id: 'acumulado', label: 'Acumulado' },
  { id: 'diferencias', label: 'Diferencias' },
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
    id: 'PresMen',
    label: 'Presupuesto Mensual',
    minWidth: 100,
    align: 'right',
    format: formatNumber,
    group: 'mensuales',
    type: 'number',
  },
  {
    id: 'VentMenOtrIng',
    label: 'Venta Men. con otros Ingresos',
    minWidth: 160,
    align: 'right',
    format: formatNumber,
    group: 'mensuales',
    type: 'number',
  },
  {
    id: 'venMenCer',
    label: 'Venta Men. Cerámica',
    minWidth: 150,
    align: 'right',
    format: formatNumber,
    group: 'mensuales',
    type: 'number',
  },
  {
    id: 'otrIngr',
    label: 'Otros Ingresos',
    minWidth: 120,
    align: 'right',
    format: formatNumber,
    group: 'mensuales',
    type: 'number',
  },
  {
    id: 'venAcuOtros',
    label: 'Venta Acumulado Otros',
    minWidth: 160,
    align: 'right',
    format: formatNumber,
    group: 'acumulado',
    type: 'number',
  },
  {
    id: 'venAcuCer',
    label: 'Venta Acum. Cerámica',
    minWidth: 160,
    align: 'right',
    format: formatNumber,
    group: 'acumulado',
    type: 'number',
  },
  {
    id: 'acuPres',
    label: 'Acum. Presupuesto',
    minWidth: 140,
    align: 'right',
    format: formatNumber,
    group: 'acumulado',
    type: 'number',
  },
  {
    id: 'diffVe_OtrosvsPres',
    label: 'Diff Ventas otros vs Presupuesto',
    minWidth: 180,
    align: 'right',
    format: formatNumber,
    group: 'diferencias',
    type: 'number',
  },
  {
    id: 'diffVen_CervsPres',
    label: 'Diff Venta cerámica vs Presupuesto',
    minWidth: 180,
    align: 'right',
    format: formatNumber,
    group: 'diferencias',
    type: 'number',
  },
  {
    id: 'meta',
    label: 'Meta',
    minWidth: 80,
    align: 'right',
    format: formatPercent,
    group: 'cumpl',
    type: 'percent',
  },
  {
    id: 'cumplMenCeramica',
    label: 'Cumpl. Mensual Cerámica',
    minWidth: 170,
    align: 'right',
    format: formatPercent,
    group: 'cumpl',
    type: 'percent',
  },
  {
    id: 'cumplOtrosIngrAcuvsAcumPres',
    label: 'Cumpl. Otros Ingresos Acum. vs Acum. Presupuesto',
    minWidth: 220,
    align: 'right',
    format: formatPercent,
    group: 'cumpl',
    type: 'percent',
  },
];

const PRESET_VIEWS = {
  'KPIs mensuales': {
    visible: [
      'periodo',
      'PresMen',
      'VentMenOtrIng',
      'venMenCer',
      'otrIngr',
      'cumplMenCeramica',
    ],
  },
  Acumulado: {
    visible: [
      'periodo',
      'venAcuOtros',
      'venAcuCer',
      'acuPres',
      'cumplOtrosIngrAcuvsAcumPres',
    ],
  },
  Diferencias: {
    visible: ['periodo', 'diffVe_OtrosvsPres', 'diffVen_CervsPres', 'meta'],
  },
  Todo: { visible: columns.map((c) => c.id) },
};

export default function IngresoVentasTotalesPage() {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [datosGrafic, setDatosGrafic] = useState([]);
  const reload = useCallback(async () => {
    const resp = await getAll();
    setData(Array.isArray(resp) ? resp : (resp?.normalizados ?? []));
    setDatosGrafic(Array.isArray(resp) ? resp : (resp?.valores ?? []));
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return (
    <>
      <ReusableKpiTable
        title="INGRESO POR VENTA TOTALES"
        lsKeyPrefix="ivt"
        groups={GROUPS}
        columns={columns}
        presetViews={PRESET_VIEWS}
        data={data}
        onRegister={() => {
          setSelectedRow(null);
          setOpen(true);
        }}
        onEditRow={(row) => {
          setSelectedRow(row);
          setOpen(true);
        }}
      />
      <IngresoVentaTotalModal
        open={open}
        onClose={() => setOpen(false)}
        initialValues={selectedRow}
        onSuccess={async () => {
          setOpen(false);
          await reload();
        }}
        createFn={CreateObje}
        updateFn={UpdateObje}
        periodoActual={getPeriodo}
      />
      {datosGrafic.length > 0 && <IngresoTotalECharts rows={datosGrafic} />}
    </>
  );
}
