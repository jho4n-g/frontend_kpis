import { api } from './api.services';
import { formatMonthYear } from '../lib/convert.js';
const toNum = (v) => {
  if (v === '' || v == null) return null;
  if (typeof v === 'string') {
    v = v.replace(/\s+/g, '').replace(',', '.'); // "12 345,67" -> "12345.67"
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function normalizarData(mes) {
  const iv = mes?.precioUnitarioMes;
  if (!iv) return null;

  return {
    id: Number(iv.id),
    id_mes: mes.id_mes,
    //numero: mes.numero,
    periodo: iv.periodo,
    presMen: Number(iv.presMen) || 0,
    precProm: Number(iv.precProm) || 0,
    regionCentro: Number(iv.regionCentro) || 0,
    regionEste: Number(iv.regionEste) || 0,
    regionOeste: Number(iv.regionOeste) || 0,
    fabrica: Number(iv.fabrica) || 0,

    exportacion: Number(iv.exportacion) || 0,
    meta: Number(iv.meta) || 0,
    cumplimientoMensual: Number(iv.cumplimientoMensual) || 0,
  };
}

function normalizarDataTabla(mes) {
  const iv = mes?.precioUnitarioMes;
  if (!iv) return null;

  return {
    periodo: mes.periodo,
    precProm: Number(iv.precProm) || 0,
    regionCentro: Number(iv.regionCentro) || 0,
    regionEste: Number(iv.regionEste) || 0,
    regionOeste: Number(iv.regionOeste) || 0,
    fabrica: Number(iv.fabrica) || 0,

    exportacion: Number(iv.exportacion) || 0,

    presMen: Number(iv.presMen) || 0,
  };
}

function extraerMeses(data) {
  if (Array.isArray(data)) return data; // el backend ya envía el array de meses
  if (Array.isArray(data?.mesesGestion)) return data.mesesGestion; // viene dentro de un objeto
  return []; // formato desconocido
}

export const getAll = async () => {
  try {
    const response = await api.get('/precioUnitario');
    //console.log('response', response);

    const meses = extraerMeses(response.data);
    const valores = meses.map(normalizarDataTabla).filter(Boolean);
    //console.log(valores);

    // Normaliza solo los que tienen ingresoVentas
    const normalizados = meses.map(normalizarData).filter(Boolean);
    // console.log('api', normalizados);
    //console.log('Precio Unitario', valores);
    // // console.log(normalizados);
    // const graficaCumplimiento = meses
    //   .map(NormalizarGraficoCumplimiento)
    //   .filter(Boolean);
    // console.log('service', valores);
    //console.log('Despues de formater', valores);

    return { normalizados, valores };
  } catch (error) {
    console.error('Error en getAll:', error);
    return [];
  }
};

export const ObtenerPeriodo = async () => {
  try {
    const obj = await api.get('/precioUnitario/periodo');

    return obj.data.periodo;
  } catch (err) {
    console.log(err);
  }
};

export const updatePrecioUnitario = async (id, payload) => {
  try {
    // Campos válidos para actualizar en PrecioUnitario:
    const updatable = [
      'presMen',
      'precProm',
      'regionCentro',
      'regionEste',
      'regionOeste',
      'fabrica',
      'exportacion',
    ];

    const body = {};
    for (const k of updatable) {
      if (payload[k] !== undefined) {
        const n = toNum(payload[k]);
        if (n != null) body[k] = n;
      }
    }

    if (Object.keys(body).length === 0) {
      throw new Error('No hay cambios válidos para actualizar.');
    }

    const { data } = await api.put(`/precioUnitario/${id}`, body);
    return data;
  } catch (err) {
    console.error('API error:', err.response?.data || err.message);
    throw err;
  }
};

export const CreatePrecioUnitario = async (payload) => {
  try {
    // Campos que acepta el backend en CREATE (periodo/mes los resuelve el servidor)
    const fields = [
      'presMen',
      'precProm',
      'regionCentro',
      'regionEste',
      'regionOeste',
      'fabrica',
      'exportacion',
    ];

    const body = {};
    for (const k of fields) {
      const n = toNum(payload[k]);
      if (n == null) {
        throw new Error(`Campo requerido inválido: ${k}`);
      }
      body[k] = n; // incluye 0 como válido
    }

    const { data } = await api.post('/precioUnitario', body);
    return data;
  } catch (err) {
    console.error('API error:', err.response?.data || err.message);
    throw err;
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
    const res = await api.post('/precioUnitario/meta', { meta: parsed });

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
