import { Routes, BrowserRouter, Route, Navigate } from 'react-router';
import HomePage from './pages/HomePage';
import UtilidaPage from './pages/UtilidadPage';
import VentasTotalesPage from './pages/VentasTotalesPage';
import IngresoVentasTotales from './pages/IngresoVentasTotales';
import Ingreso from './copy/IngresoVentasTotales';
import PrecioUnitarioPage from './pages/PrecioUnitarioPage';
import KPIsMensuales from './components/IngresoVentaTotal/KPIsMensuales';
import Prueba from './pages/Prueba';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />}>
          <Route index element={<Navigate to="/utilidad" replace />} />
          <Route path="utilidad" element={<UtilidaPage />} />
          <Route path="ventasTotales" element={<VentasTotalesPage />} />
          <Route
            path="ingresoVentasTotales"
            element={<IngresoVentasTotales />}
          />
          <Route path="ingresoVentasTotales/kpis" element={<KPIsMensuales />} />
          <Route path="precioUnitario" element={<PrecioUnitarioPage />} />
          <Route path="ingreso" element={<Ingreso />} />
          <Route path="prueba" element={<Prueba />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
