// src/services/recibos.service.js
import { api } from '../api.services';

/**
 * GET /api/recibos?q=...
 * Lista recibos (sin paginado) con búsqueda opcional por nro_recibo o nombre_cliente.
 */
export const getRecibos = async () => {
  try {
    const res = await api.get('/recibo');
    return res.data;
  } catch (error) {
    console.error('❌ Error al obtener recibos:', error);
    return [];
  }
};

/**
 * GET /api/recibos/:id
 * Obtiene un recibo por ID (incluye items y producto de cada item).
 */
export const getReciboById = async (id) => {
  try {
    const res = await api.get(`/recibo/${id}`);
    console.log('reicbo id', res);
    return res.data;
  } catch (error) {
    console.error('❌ Error al obtener recibo:', error);
    throw error?.response?.data || error;
  }
};

/**
 * POST /api/recibos
 * Crea un recibo con items.
 * @param {object} data - { nro_recibo, fecha(YYYY-MM-DD), nombre_cliente, items: [{producto_id, cantidad, precio_unitario, unidadMedida, total_linea}] }
 */
export const createRecibo = async (data) => {
  try {
    const res = await api.post('/recibo', data);
    return res.data;
  } catch (error) {
    console.error('❌ Error al crear recibo:', error);
    // Lanza el payload del backend para manejar notificaciones en el UI
    throw error.response?.data || error;
  }
};

/**
 * PUT /api/recibos/:id
 * Actualiza un recibo (reemplaza ítems).
 * @param {number|string} id
 * @param {object} data - { nro_recibo, fecha, nombre_cliente, items: [...] }
 */
export const updateRecibo = async (id, data) => {
  try {
    const res = await api.put(`/recibo/${id}`, data);
    return res.data;
  } catch (error) {
    console.error('❌ Error al actualizar recibo:', error);
    throw error.response?.data || error;
  }
};

/**
 * DELETE /api/recibos/:id
 * Elimina un recibo y sus ítems.
 */
export const deleteRecibo = async (id) => {
  try {
    const res = await api.delete(`/recibo/${id}`);
    return res.data; // { message: 'Recibo eliminado' }
  } catch (error) {
    console.error('❌ Error al eliminar recibo:', error);
    throw error.response?.data || error;
  }
};

// export const getDatosTabla = async (params = {}) => {
//   try {
//     // Puedes pasar filtros opcionales (por fecha o búsqueda)
//     const res = await api.get('/recibo/tabla', { params });
//     return res.data; // [{fecha, nro_recibo, detalle, cantidad, um, precio_unitario, total_linea}, ...]
//   } catch (error) {
//     console.error('❌ Error al obtener datos de la tabla:', error);
//     throw error.response?.data || error;
//   }
// };

// Lista aplanada: una fila por ítem
export const getDatosTabla = async () => {
  try {
    const res = await api.get('/recibo/tabla');
    //console.log('api', res);
    // Espera array de objetos ya aplanados:
    // [{ fecha, nro_recibo, detalle, cantidad, um, precio_unitario, total_linea, recibo_id, item_id, producto_id, cliente? }, ...]
    return Array.isArray(res.data.rows) ? res.data.rows : [];
  } catch (error) {
    console.error('❌ Error al obtener tabla:', error);
    return [];
  }
};
