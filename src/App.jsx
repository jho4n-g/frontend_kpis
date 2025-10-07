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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />}>
          <Route index element={<Navigate to="/utilidad" replace />} />
          <Route path="utilidad" element={<UtilidaPage />} />
          <Route path="ventasTotales" element={<VentasTotalesPage />} />
          <Route path="ingresoVentasTotales/kpis" element={<KPIsMensuales />} />
          <Route path="ingreso" element={<Ingreso />} />
          {/* Indicadores de desempeño */}
          <Route path="precioUnitarioDos" element={<PrecioUnitarioDosPage />} />
          <Route
            path="ingresoVentasTotales"
            element={<IngresoVentasTotalesPage />}
          />
          <Route path="calidad" element={<CalidadPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
