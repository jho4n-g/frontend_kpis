// services/ingresosVentasTotales.js
import { api } from './api.services';
import { formatMonthYear } from '../lib/convert.js';

// Recibe 1 "mes" y devuelve el objeto normalizado del ingreso, o null si no hay ingreso
function normalizarData(mes) {
  const iv = mes?.ingresoVentas;
  if (!iv) return null;

  return {
    id: Number(iv.id),
    id_mes: mes.id_mes,
    //numero: mes.numero,
    periodo: mes.periodo,

    PresMen: Number(iv.PresMen) || 0,
    VentMenOtrIng: Number(iv.VentMenOtrIng) || 0,
    venMenCer: Number(iv.venMenCer) || 0,
    otrIngr: Number(iv.otrIngr) || 0,
    meta: Number(iv.meta) || 0,

    venAcuOtros: Number(iv.venAcuOtros) || 0,
    venAcuCer: Number(iv.venAcuCer) || 0,
    acuPres: Number(iv.acuPres) || 0,

    diffVe_OtrosvsPres: Number(iv.diffVe_OtrosvsPres) || 0,
    diffVen_CervsPres: Number(iv.diffVen_CervsPres) || 0,
    cumplMenCeramica: Number(iv.cumplMenCeramica) || 0,
    cumplOtrosIngrAcuvsAcumPres: Number(iv.cumplOtrosIngrAcuvsAcumPres) || 0,
  };
}

function normalizarValoresTabla(mes) {
  const iv = mes?.ingresoVentas;
  if (!iv) return null;

  return {
    mes: formatMonthYear(iv.periodo),
    PresMen: Number(iv.PresMen) || 0,
    VentMenOtrIng: Number(iv.VentMenOtrIng) || 0,
    venMenCer: Number(iv.venMenCer) || 0,
    otrIngr: Number(iv.otrIngr) || 0,
    meta: Number(iv.meta) || 0,
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
    const response = await api.get('/ingresosVentasTotales');

    const meses = extraerMeses(response.data);
    const valores = meses.map(normalizarValoresTabla).filter(Boolean);

    // Normaliza solo los que tienen ingresoVentas
    const normalizados = meses.map(normalizarData).filter(Boolean);

    return { normalizados, valores };
  } catch (error) {
    console.error('Error en getAll:', error);
    return [];
  }
};

export const CreateObje = async (payload) => {
  try {
    const objSave = await api.post('/ingresosVentasTotales', payload);
    return objSave;
  } catch (err) {
    console.log(err);
  }
};

export const UpdateObje = async (id, payload) => {
  // NO mandar periodo en update
  try {
    const body = {
      PresMen: Number(payload.PresMen),
      VentMenOtrIng: Number(payload.VentMenOtrIng),
      venMenCer: Number(payload.venMenCer),
      otrIngr: Number(payload.otrIngr ?? 0),
    };
    const { data } = await api.put(`/ingresosVentasTotales/${id}`, body);
    return data;
  } catch (err) {
    console.error('API error:', err.response?.data || err.message);
    throw err; // (o maneja el estado de error)
  }
};
