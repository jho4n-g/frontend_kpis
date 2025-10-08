import { api } from './api.services.js';
import { formatMonthYear } from '../lib/convert.js';

function normalizarData(mes) {
  const iv = mes?.calidadMes;
  if (!iv) return null;

  return {
    id: Number(iv.id),
    id_mes: mes.id_mes,
    //numero: mes.numero,
    periodo: mes.periodo,

    produccionMensual: Number(iv.produccionMensual) || 0,
    presupusto: Number(iv.presupusto) || 0,
    produccionPrimeraMensual: Number(iv.produccionPrimeraMensual) || 0,
    produccionSegundaMensual: Number(iv.produccionSegundaMensual) || 0,
    produccionTerceraMensual: Number(iv.produccionTerceraMensual) || 0,

    produccionCascoteMensual: Number(iv.produccionCascoteMensual) || 0,

    primeraCalidad: Number(iv.primeraCalidad) || 0,
    segundaCalidad: Number(iv.segundaCalidad) || 0,

    terceraCalidad: Number(iv.terceraCalidad) || 0,
    cascote: Number(iv.cascote) || 0,
    produccionAcumulada: Number(iv.produccionAcumulada) || 0,
    primeraCalidadAcumulada: Number(iv.primeraCalidadAcumulada) || 0,

    cascoteCalidadAcumulado: Number(iv.cascoteCalidadAcumulado) || 0,
    primeraAcumulada: Number(iv.primeraAcumulada) || 0,
    cascoteAcumulado: Number(iv.cascoteAcumulado) || 0,

    metaPrimera: Number(iv.metaPrimera) || 0, // ✅ agrega estos
    metaCascote: Number(iv.metaCascote) || 0,
  };
}

function normalizarDesempeñoCalida(mes) {
  const iv = mes?.calidadMes;
  if (!iv) return null;

  return {
    mes: formatMonthYear(iv.periodo),
    primeraCalidad: Number(iv.primeraCalidad) || 0,
    segundaCalidad: Number(iv.segundaCalidad) || 0,
    terceraCalidad: Number(iv.terceraCalidad) || 0,
    cascote: Number(iv.cascote) || 0,
  };
}

function normalizarDesempeñoPrimeraCalida(mes) {
  const iv = mes?.calidadMes;
  if (!iv) return null;

  return {
    mes: formatMonthYear(iv.periodo),
    primeraCalidad: Number(iv.primeraCalidad) || 0,
    primeraAcumulada: Number(iv.primeraAcumulada) || 0,
    metaPrimera: Number(iv.metaPrimera) || 0,
  };
}
function normalizarDesempeñoSegundaCalida(mes) {
  const iv = mes?.calidadMes;
  if (!iv) return null;

  return {
    mes: formatMonthYear(iv.periodo),
    segundaCalidad: Number(iv.segundaCalidad) || 0,
  };
}

function normalizarDesempeñoCascote(mes) {
  const iv = mes?.calidadMes;
  if (!iv) return null;

  return {
    mes: formatMonthYear(iv.periodo),
    cascote: Number(iv.cascote) || 0,
    cascoteAcumulado: Number(iv.cascoteAcumulado) || 0,
    metaCascote: Number(iv.metaCascote) || 0,
  };
}

function extraerMeses(data) {
  if (Array.isArray(data)) return data; // el backend ya envía el array de meses
  if (Array.isArray(data?.mesesGestion)) return data.mesesGestion; // viene dentro de un objeto
  return []; // formato desconocido
}

export const getAll = async () => {
  try {
    const response = await api.get('/calidad');

    const meses = extraerMeses(response.data);
    const valoresDesempeñoCalidad = meses
      .map(normalizarDesempeñoCalida)
      .filter(Boolean);

    // Normaliza solo los que tienen ingresoVentas
    const normalizados = meses.map(normalizarData).filter(Boolean);
    const valoresDesempeñoPrimera = meses
      .map(normalizarDesempeñoPrimeraCalida)
      .filter(Boolean);
    const valoresDesempeñoSegunda = meses
      .map(normalizarDesempeñoSegundaCalida)
      .filter(Boolean);
    const valoresDesempeñoCascote = meses
      .map(normalizarDesempeñoCascote)
      .filter(Boolean);

    return {
      normalizados,
      valoresDesempeñoCalidad,
      valoresDesempeñoPrimera,
      valoresDesempeñoSegunda,
      valoresDesempeñoCascote,
    };
  } catch (error) {
    console.error('Error en getAll:', error);
    return [];
  }
};

export const updateMetaCalidad = async (payload) => {
  // payload = { metaPrimera: number, metaCascote: number }
  const { metaPrimera, metaCascote } = payload ?? {};

  try {
    const resp = await api.patch('/calidad/cambiar-meta', {
      metaPrimera,
      metaCascote,
    });
    return resp.data;
  } catch (error) {
    console.error('❌ Error en updateMetaCalidad:', error);
    throw error.response?.data || { message: 'Error al actualizar metas' };
  }
};

export const createCalidad = async (payload) => {
  try {
    const resp = await api.post('/calidad', payload);
    return resp.data;
  } catch (error) {
    console.error('❌ Error al crear calidad:', error);
    throw (
      error.response?.data || {
        message: 'Error al registrar los datos de calidad',
      }
    );
  }
};

export const updateCalidad = async (id, payload) => {
  try {
    const resp = await api.put(`/calidad/${id}`, payload);
    return resp.data;
  } catch (error) {
    console.error('❌ Error al actualizar calidad:', error);
    throw (
      error.response?.data || {
        message: 'Error al actualizar los datos de calidad',
      }
    );
  }
};

export const getPeriodoCalidad = async () => {
  try {
    const resp = await api.get('/calidad/periodo');
    return resp.data;
  } catch (error) {
    console.error('❌ Error al obtener periodo:', error);
    throw (
      error.response?.data || {
        message: 'Error al obtener el periodo actual de calidad',
      }
    );
  }
};
