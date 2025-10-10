// src/services/productos.service.js
import { api } from '../api.services';

// Obtener todos los productos (con búsqueda opcional)
export const getProductos = async () => {
  try {
    const res = await api.get('/producto');
    return res.data;
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    return [];
  }
};

// Obtener un producto por ID
export const getProductoById = async (id) => {
  try {
    const res = await api.get(`/producto/${id}`);
    return res.data;
  } catch (error) {
    console.error('❌ Error al obtener producto:', error);
    return null;
  }
};

// Crear un producto
export const createProducto = async (data) => {
  try {
    const res = await api.post('/producto', data);
    return res.data;
  } catch (error) {
    console.error('❌ Error al crear producto:', error);
    throw error.response?.data || error;
  }
};

// Actualizar un producto
export const updateProducto = async (id, data) => {
  try {
    const res = await api.put(`/producto/${id}`, data);
    return res.data;
  } catch (error) {
    console.error('❌ Error al actualizar producto:', error);
    throw error.response?.data || error;
  }
};

// Eliminar un producto
export const deleteProducto = async (id) => {
  try {
    const res = await api.delete(`/producto/${id}`);
    return res.data;
  } catch (error) {
    console.error('❌ Error al eliminar producto:', error);
    throw error.response?.data || error;
  }
};
