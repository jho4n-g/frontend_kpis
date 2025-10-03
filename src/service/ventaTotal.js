import { api } from './api.services';
import { formatMonthYear } from '../lib/convert.js';

function normalizarData(mes) {
  const iv = mes?.ventasTotalesMes;
  if (!iv) return null;

  return {
    id: Number(iv.id),
    id_mes: mes.id_mes,
    //numero: mes.numero,
    periodo: mes.periodo,

    PresMen: Number(iv.PresMen) || 0,
    VentMen: Number(iv.VentMen) || 0,
    DifVentaMenvsPreMen: Number(iv.DifVentaMenvsPreMen) || 0,
    VenAcu: Number(iv.VenAcu) || 0,
    PresAcu: Number(iv.PresAcu) || 0,

    DiffVentaAcuvsPresAcu: Number(iv.DiffVentaAcuvsPresAcu) || 0,
    meta: Number(iv.meta) || 0,
    CumMen: Number(iv.CumMen) || 0,
    CumAcu: Number(iv.CumAcu) || 0,
  };
}

function normalizarValoresTabla(mes) {
  const iv = mes?.ventasTotalesMes;
  if (!iv) return null;

  return {
    mes: formatMonthYear(iv.periodo),
    PresMen: Number(iv.PresMen) || 0,
    VentMen: Number(iv.VentMen) || 0,
  };
}

function NormalizarGraficoCumplimiento(mes) {
  const iv = mes?.ventasTotalesMes;
  if (!iv) return null;
  return {
    mes: formatMonthYear(iv.periodo),
    meta: iv.meta,
    CumMen: Number(iv.CumMen) || 0,
    CumAcu: Number(iv.CumMen) || 0,
  };
}
// Extrae el array de meses sin importar si el backend envía [{...}] o { mesesGestion: [...] }
function extraerMeses(data) {
  if (Array.isArray(data)) return data; // el backend ya envía el array de meses
  if (Array.isArray(data?.mesesGestion)) return data.mesesGestion; // viene dentro de un objeto
  return []; // formato desconocido
}
export const getAll = async () => {
  try {
    const response = await api.get('/ventasTotales');

    const meses = extraerMeses(response.data);
    const valores = meses.map(normalizarValoresTabla).filter(Boolean);

    // Normaliza solo los que tienen ingresoVentas
    const normalizados = meses.map(normalizarData).filter(Boolean);

    // console.log(normalizados);
    const graficaCumplimiento = meses
      .map(NormalizarGraficoCumplimiento)
      .filter(Boolean);
    console.log('service', valores);

    return { normalizados, graficaCumplimiento, valores };
  } catch (error) {
    console.error('Error en getAll:', error);
    return [];
  }
};

export const createObj = async (payload) => {
  try {
    const objSave = await api.post('/ventasTotales', payload);
    return objSave;
  } catch (err) {
    console.log(err);
  }
};

export const ObtenerPeriodo = async () => {
  try {
    const obj = await api.get('/ventasTotales/gestion');

    return obj.data.periodo;
  } catch (err) {
    console.log(err);
  }
};

export const UpdateObje = async (id, payload) => {
  // NO mandar periodo en update
  try {
    const body = {
      PresMen: Number(payload.PresMen),
      VentMen: Number(payload.VentMen),
    };
    const { data } = await api.put(`/ventasTotales/${id}`, body);
    return data;
  } catch (err) {
    console.error('API error:', err.response?.data || err.message);
    throw err; // (o maneja el estado de error)
  }
};
