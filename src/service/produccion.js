import { api } from './api.services.js';
import { formatMonthYear } from '../lib/convert.js';

function normalizarData(mes) {
  const iv = mes?.produccionMes;
  if (!iv) return null;

  return {
    id: Number(iv.id),
    id_mes: mes.id_mes,
    //numero: mes.numero,
    periodo: mes.periodo,

    presu: Number(iv.presu) || 0,
    producMen: Number(iv.producMen) || 0,
    producAcu: Number(iv.producAcu) || 0,
    metaAcuPresu: Number(iv.metaAcuPresu) || 0,
    meta: Number(iv.meta) || 0,
    difProducAcuvsPresAcu: Number(iv.difProducAcuvsPresAcu) || 0,

    cumplMen: Number(iv.cumplMen) || 0,
    cumpAcuPres: Number(iv.cumpAcuPres) || 0,
  };
}

function normalizarDatosGrafica(mes) {
  const iv = mes?.produccionMes;
  if (!iv) return null;

  return {
    id: Number(iv.id),
    mes: formatMonthYear(iv.periodo),
    segundaCalidad: Number(iv.segundaCalidad) || 0,
    periodo: mes.periodo,
    presu: Number(iv.presu) || 0,
    producMen: Number(iv.producMen) || 0,
    producAcu: Number(iv.producAcu) || 0,
    metaAcuPresu: Number(iv.metaAcuPresu) || 0,
  };
}
function normalizarCumpGrafica(mes) {
  const iv = mes?.produccionMes;
  if (!iv) return null;

  return {
    id: Number(iv.id),
    mes: formatMonthYear(iv.periodo),
    segundaCalidad: Number(iv.segundaCalidad) || 0,
    periodo: mes.periodo,
    cumplMen: Number(iv.cumplMen) || 0,
    cumpAcuPres: Number(iv.cumpAcuPres) || 0,
  };
}

function extraerMeses(data) {
  if (Array.isArray(data)) return data; // el backend ya envía el array de meses
  if (Array.isArray(data?.mesesGestion)) return data.mesesGestion; // viene dentro de un objeto
  return []; // formato desconocido
}

export const getAll = async () => {
  try {
    const response = await api.get('/produccion');

    const meses = extraerMeses(response.data);

    // Normaliza solo los que tienen ingresoVentas
    const normalizados = meses.map(normalizarData).filter(Boolean);
    const datosProduccion = meses.map(normalizarDatosGrafica).filter(Boolean);
    const datosCumpli = meses.map(normalizarCumpGrafica).filter(Boolean);

    return {
      normalizados,
      datosProduccion,
      datosCumpli,
    };
  } catch (error) {
    console.error('Error en getAll:', error);
    return [];
  }
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
    const res = await api.patch('/produccion/cambiar-meta', { meta: parsed });

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

export const createProduccion = async (payload) => {
  const { data } = await api.post('/produccion', payload);
  return data;
};

// 🔹 Actualizar producción existente
export const updateProduccion = async (id, payload) => {
  const { data } = await api.put(`/produccion/${id}`, payload);
  return data;
};

export const getPeriodoProduccion = async () => {
  const { data } = await api.get('/produccion/periodo');
  return data;
};
