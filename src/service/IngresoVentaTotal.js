// services/ingresosVentasTotales.js
import { api } from './api.services';

// Recibe 1 "mes" y devuelve el objeto normalizado del ingreso, o null si no hay ingreso
function normalizarData(mes) {
  const iv = mes?.ingresoVentas;
  if (!iv) return null;
  return {
    id: Number(iv.id),
    id_mes: mes.id_mes,
    numero: mes.numero,
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

// Extrae el array de meses sin importar si el backend envía [{...}] o { mesesGestion: [...] }
function extraerMeses(data) {
  if (Array.isArray(data)) return data; // el backend ya envía el array de meses
  if (Array.isArray(data?.mesesGestion)) return data.mesesGestion; // viene dentro de un objeto
  return []; // formato desconocido
}

export const getAll = async () => {
  try {
    const response = await api.get('/ingresosVentasTotales');

    console.log('🔍 Estructura recibida:', response.data);
    const meses = extraerMeses(response.data);
    console.log('📊 Meses a procesar:', meses.length);

    // Normaliza solo los que tienen ingresoVentas
    const normalizados = meses.map(normalizarData).filter(Boolean);
    console.log('✅ Ingresos normalizados:', normalizados.length);

    return normalizados;
  } catch (error) {
    console.error('Error en getAll:', error);
    return [];
  }
};

export const CreateObje = async (payload) => {
  const objSave = await api.post('/ingresosVentasTotales', payload);
  return objSave;
};
