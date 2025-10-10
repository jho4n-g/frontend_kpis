import { Routes, BrowserRouter, Route, Navigate } from 'react-router';
import HomePage from './pages/HomePage';
import UtilidaPage from './pages/UtilidadPage';
import VentasTotalesPage from './pages/VentasTotalesPage';
//import IngresoVentasTotales from './pages/IngresoVentasTotales';
import Ingreso from './copy/IngresoVentasTotales';
import KPIsMensuales from './components/IngresoVentaTotal/KPIsMensuales';
//import IngresoVentasTotalesPage from './pages/IngresoVentasTotalesPage';
//Indicadores
import PrecioUnitarioDosPage from './pages/IndicadoresDespempeño/PrecioUnitarioPage';
import IngresoVentasTotalesPage from './pages/IndicadoresDespempeño/IngresoVentasTotalesPage';
import CalidadPage from './pages/IndicadoresDespempeño/CalidadPage';
import Produccion from './pages/IndicadoresDespempeño/produccion';
import LoginPage from './pages/Login/LoginPage';
import VisibleColumnsBasicExample from './pages/experimento/VisibleColumnsBasicExample';
import DisponibilidadLiens from './pages/IndicadoresDespempeño/DisponibilidadLineas';
import GeneResiduoSolidosPage from './pages/IndicadoresDespempeño/GeneracionResiduoSolidos/GeneResiduoSolidosPage';

function App() {
  return (
    <Routes>
      {/* Layout SIN path */}
      <Route element={<HomePage />}>
        <Route index element={<Navigate to="utilidad" replace />} />
        <Route path="utilidad" element={<UtilidaPage />} />
        <Route path="ventasTotales" element={<VentasTotalesPage />} />
        <Route path="ingresoVentasTotales/kpis" element={<KPIsMensuales />} />
        <Route path="ingreso" element={<Ingreso />} />
        <Route path="precioUnitarioDos" element={<PrecioUnitarioDosPage />} />
        <Route
          path="ingresoVentasTotales"
          element={<IngresoVentasTotalesPage />}
        />
        <Route path="calidad" element={<CalidadPage />} />
        <Route path="produccion" element={<Produccion />} />
        <Route path="visible" element={<VisibleColumnsBasicExample />} />
        <Route path="disponibilidad" element={<DisponibilidadLiens />} />
        <Route path="geneResiduoSolidos" element={<GeneResiduoSolidosPage />} />
      </Route>

      {/* Rutas fuera del layout */}
      <Route path="login" element={<LoginPage />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
export default App;
