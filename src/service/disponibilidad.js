import { api } from './api.services.js';
import { formatMonthYear } from '../lib/convert.js';

function normalizarData(mes) {
  const iv = mes?.disponibilidadMes;
  if (!iv) return null;

  return {
    id: Number(iv.id),
    id_mes: mes.id_mes,
    //numero: mes.numero,
    periodo: mes.periodo,

    nroHorasProactivasPlanificadas:
      Number(iv.nroHorasProactivasPlanificadas) || 0,
    nroHorasParadasLineaB: Number(iv.nroHorasParadasLineaB) || 0,
    nroHorasParadasLineaC: Number(iv.nroHorasParadasLineaC) || 0,
    nroHorasParadasLineaD: Number(iv.nroHorasParadasLineaD) || 0,
    disponibilidadLineaB: Number(iv.disponibilidadLineaB) || 0,
    disponibilidadLineaC: Number(iv.disponibilidadLineaC) || 0,
    disponibilidadLineaD: Number(iv.disponibilidadLineaD) || 0,
    meta: Number(iv.meta) || 0,
  };
}
function normalizarDataPercent(mes) {
  const iv = mes?.disponibilidadMes;
  if (!iv) return null;

  return {
    mes: formatMonthYear(iv.periodo),
    disponibilidadLineaB: Number(iv.disponibilidadLineaB) || 0,
    disponibilidadLineaC: Number(iv.disponibilidadLineaC) || 0,
    disponibilidadLineaD: Number(iv.disponibilidadLineaD) || 0,
    meta: Number(iv.meta) || 0,
  };
}

function normalizarDataGrafica(mes) {
  const iv = mes?.disponibilidadMes;
  if (!iv) return null;

  return {
    mes: formatMonthYear(iv.periodo),

    nroHorasProactivasPlanificadas:
      Number(iv.nroHorasProactivasPlanificadas) || 0,
    nroHorasParadasLineaB: Number(iv.nroHorasParadasLineaB) || 0,
    nroHorasParadasLineaC: Number(iv.nroHorasParadasLineaC) || 0,
    nroHorasParadasLineaD: Number(iv.nroHorasParadasLineaD) || 0,
  };
}

function extraerMeses(data) {
  if (Array.isArray(data)) return data; // el backend ya envía el array de meses
  if (Array.isArray(data?.mesesGestion)) return data.mesesGestion; // viene dentro de un objeto
  return []; // formato desconocido
}

export const getAll = async () => {
  try {
    const response = await api.get('/disponibilidad');

    const meses = extraerMeses(response.data);

    // Normaliza solo los que tienen ingresoVentas
    const normalizados = meses.map(normalizarData).filter(Boolean);
    const normalizadosDatosG = meses.map(normalizarDataGrafica).filter(Boolean);
    const normalizadosDatosP = meses.map(normalizarDataPercent).filter(Boolean);

    return {
      normalizados,
      normalizadosDatosG,
      normalizadosDatosP,
    };
  } catch (error) {
    console.error('Error en getAll:', error);
    return [];
  }
};

export const createObj = async (payload) => {
  const { data } = await api.post('/disponibilidad', payload);
  return data;
};

export const updateObj = async (id, payload) => {
  const { data } = await api.put(`/disponibilidad/${id}`, payload);
  return data;
};

export const getPeriodo = async () => {
  const { data } = await api.get('/disponibilidad/periodo');
  return data;
};

export const UpdateMeta = async (meta) => {
  try {
    // Normaliza input
    const metaValue = typeof meta === 'object' ? meta.meta : meta;
    const parsed = Number(metaValue);

    // Validación
    if (metaValue == null || metaValue === '') {
      throw new Error('El valor de meta es requerido.');
    }
    if (Number.isNaN(parsed)) {
      throw new Error('El valor de meta no es un número válido.');
    }
    if (parsed < 0) {
      throw new Error('El valor de meta no puede ser negativo.');
    }

    // Enviar request
    const res = await api.patch('/disponibilidad/', { meta: parsed });

    // Validar respuesta esperada
    if (!res || !res.data) {
      throw new Error('Respuesta inesperada del servidor.');
    }

    return res.data; // devuelve lo que el backend manda (ej. { ok: true, affected: n })
  } catch (err) {
    console.error('Error en UpdateMeta:', err);
    // Propaga el error para que el front lo maneje (ej. mostrar snackbar/alert)
    throw err;
  }
};
