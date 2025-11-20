import { useState, useEffect } from 'react'

import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { ListClienteComponent } from './components/ListClienteComponent'
import { ClienteComponent } from './components/ClienteComponent'
import { HeaderComponents } from './components/HeaderComponents'
import { FooterComponents } from './components/FooterComponents'

import { BrowserRouter, Route, Routes, useLocation, Router } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

import { ListTipoComponent } from './components/ListTipoComponent'
import { TipoComponent } from './components/TipoComponent'
import { ListProductoComponent } from './components/ListProductoComponent'
import { ProductoComponent } from './components/ProductoComponent'
import { ListPuestoComponent } from './components/ListPuestoComponent'
import { PuestoComponent } from './components/PuestoComponent'
import { ListEmpleadoComponent } from './components/ListEmpleadoComponent'
import { EmpleadoComponent } from './components/EmpleadoComponent'
import { ListMesaComponent } from './components/ListMesaComponent'
import { MesaComponent } from './components/MesaComponent'
import { ListVentaComponent } from './components/ListVentaComponent'
import { ListClienteVenta } from './components/ListClienteVenta'
import { ListProductoVentaComponent } from './components/ListProductoVentaComponent'
import { CarritoComprasComponent } from './components/CarritoComprasComponent'
import { AtenderReservarComponent } from './components/AtenderReservarComponent'
import { DetalleVentaComponent } from './components/DetalleVentaComponent '
import { ListReservasComponent } from './components/ListReservasComponent'
import { ReservarComponent } from './components/ReservarComponent'
import { IndiceComponent } from './components/IndiceComponent'
import { NavbarUsuarioComponent } from './components/NavbarUsuarioComponent'
import { LoginComponent } from './components/LoginComponent'
import { RegistroComponent } from './components/RegistroComponent'

import { ProtectedRoute } from './components/ProtectedRoute'

import { EmpleadoComponentEditar } from './components/EmpleadoComponentEditar'

import { ListClienteCajeroComponent } from './components/cajero/ListClienteCajeroComponent'
import { CajeroClienteComponent } from './components/cajero/CajeroClienteComponent'


// Para el Mesero
import { MeseroVentasComponent } from './components/mesero/MeseroVentasComponent'


// Para el cliente
import { ReservarClienteComponent } from './components/cliente/ReservarClienteComponent'
import { ListReservaClientComponent } from './components/cliente/ListReservaClientComponent'
import { ListVentaHClienteComponent } from './components/cliente/ListVentaHClienteComponent'

import { ListProductosGeneral } from './components/cliente/ListProductosGeneral'

import { DetalleVentaClienteComponent } from './components/cliente/DetalleVentaClienteComponent'

import { MeseroProductoVenta } from './components/mesero/MeseroProductoVenta'

import { MeseroCarritoCompra } from './components/mesero/MeseroCarritoCompra'

import { PerfilEmpleadoComponent } from './components/perfil/PerfilEmpleadoComponent'

import { PerfilClienteComponent } from './components/perfil/PerfilClienteComponent'

const LayoutWrapper = ({ children }) => {
  // 1. Usamos useLocation para obtener la ruta actual
  const location = useLocation();

  // 2. Definimos las rutas donde NO queremos que aparezca el layout completo
  // ¡CORREGIDO! Incluye '/registro'
  const fullScreenPaths = ['/login', '/registro'];

  // 3. Verificamos si la ruta actual está en la lista de rutas a pantalla completa
  const isFullScreen = fullScreenPaths.includes(location.pathname);

  // 4. Hook para inyectar el script de Font Awesome dinámicamente (se mantiene)
  useEffect(() => {
    if (!document.getElementById('font-awesome-script')) {
      const script = document.createElement('script');
      script.src = "https://kit.fontawesome.com/13c51e858e.js";
      script.crossOrigin = "anonymous";
      script.id = 'font-awesome-script';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <>
      {!isFullScreen && (
        <>
          <NavbarUsuarioComponent />
          <HeaderComponents />
        </>
      )}

      {/* Contenido de la Ruta (Routes) */}
      {children}

      {/* Renderizado Condicional del Footer */}
      {!isFullScreen && (
        <FooterComponents />
      )}
    </>
  );
};


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <LayoutWrapper>
            <Routes>

              {/* Publicas */}
              <Route path='/login' element={<LoginComponent></LoginComponent>}></Route>
              <Route path='/registro' element={<RegistroComponent></RegistroComponent>}></Route>

              
              <Route path='/' element={<IndiceComponent></IndiceComponent>}></Route>

              <Route path='/publica/productos' element={<ListProductosGeneral></ListProductosGeneral>}></Route>

              {/* Clientes */}
              <Route path='/cliente/lista/:flag'
                element={
                  <ProtectedRoute allowedRoles="Administrador, Supervisor, Cajero">
                    <ListClienteComponent></ListClienteComponent>
                  </ProtectedRoute>
                }>
              </Route>

              <Route path='/cliente/crear' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor, Cajero">
                  <ClienteComponent></ClienteComponent>
                </ProtectedRoute>
              }>
              </Route>

              <Route path='/cliente/edita/:id' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor">
                  <ClienteComponent></ClienteComponent>
                </ProtectedRoute>
              }></Route>


              {/* Tipos */}

              <Route path='/tipo/lista' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor">
                  <ListTipoComponent></ListTipoComponent>
                </ProtectedRoute>
              }></Route>

              <Route path='/tipo/crear' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor">
                  <TipoComponent></TipoComponent>
                </ProtectedRoute>
              }></Route>

              <Route path='/tipo/edita/:id' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor">
                  <TipoComponent></TipoComponent>
                </ProtectedRoute>
              }></Route>

              {/* Productos */}

              <Route path='/producto/lista' element={<ListProductoComponent></ListProductoComponent>}></Route>

              <Route path='/producto/crear' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor">
                  <ProductoComponent></ProductoComponent>
                </ProtectedRoute>
              }></Route>


              <Route path='/producto/edita/:id' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor">
                  <ProductoComponent></ProductoComponent>
                </ProtectedRoute>
              }></Route>

              {/* Tercer microservicio */}
              {/* Puesto */}
              <Route path='/puesto/lista' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor">
                  <ListPuestoComponent></ListPuestoComponent>
                </ProtectedRoute>
              }></Route>

              <Route path='/puesto/crear' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor">
                  <PuestoComponent></PuestoComponent>
                </ProtectedRoute>
              }></Route>

              <Route path='/puesto/edita/:id' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor">
                  <PuestoComponent></PuestoComponent>
                </ProtectedRoute>
              }></Route>

              {/* Empleado */}
              <Route path='/empleado/lista/:flag/:idreserva/:idcliente' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor, Cajero">
                  <ListEmpleadoComponent></ListEmpleadoComponent>
                </ProtectedRoute>
              }></Route>


              <Route path='/empleado/lista/:flag/:idreserva?/:idcliente?' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor, Cajero">
                  <ListEmpleadoComponent></ListEmpleadoComponent>
                </ProtectedRoute>
              }></Route>

              <Route path='/empleado/crear' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor">
                  <EmpleadoComponent></EmpleadoComponent>
                </ProtectedRoute>
              }></Route>

              <Route path='/empleado/edita/:id' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor">
                  <EmpleadoComponent></EmpleadoComponent>
                </ProtectedRoute>
              }></Route>

              <Route path='/empleado/editar/:id' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor">
                  <EmpleadoComponentEditar></EmpleadoComponentEditar>
                </ProtectedRoute>
              }></Route>


              {/* Mesa */}
              <Route path='/mesa/lista' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor">
                  <ListMesaComponent></ListMesaComponent>
                </ProtectedRoute>
              }></Route>

              <Route path='/mesa/crear' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor">
                  <MesaComponent></MesaComponent>
                </ProtectedRoute>
              }></Route>

              <Route path='/mesa/edita/:id' element={
                <ProtectedRoute allowedRoles="Administrador, Supervisor">
                  <MesaComponent></MesaComponent>
                </ProtectedRoute>
              }></Route>

              {/* Ventas */}

              <Route path='/venta/lista' element={
                <ProtectedRoute allowedRoles="Administrador, Cajero">
                  <ListVentaComponent></ListVentaComponent>
                </ProtectedRoute>
              }></Route>

              <Route path='/venta/seleccionar-cliente' element={
                <ProtectedRoute allowedRoles="Administrador, Cajero">

                  <ListClienteVenta></ListClienteVenta>

                </ProtectedRoute>
              }></Route>

              <Route path='/venta/productos/:idcliente/:flag/:idreserva/:idempleado' element={
                <ProtectedRoute allowedRoles="Administrador, Cajero">
                  <ListProductoVentaComponent></ListProductoVentaComponent>
                </ProtectedRoute>
              }></Route>

              <Route path='/venta/carrito/:idcliente/:flag/:idreserva/:idempleado' element={
                <ProtectedRoute allowedRoles="Administrador, Cajero">
                  <CarritoComprasComponent></CarritoComprasComponent>
                </ProtectedRoute>
              }></Route>

              <Route path='/venta/atender/:idcliente/:idventa' element={
                <ProtectedRoute allowedRoles="Administrador, Cajero">
                  <AtenderReservarComponent></AtenderReservarComponent>
                </ProtectedRoute>
              }></Route>

              <Route path="/venta/detalle/:tipo/:id" element={
                <ProtectedRoute allowedRoles="Administrador, Cajero, Mesero">
                  <DetalleVentaComponent></DetalleVentaComponent>
                </ProtectedRoute>
              }></Route>

              {/* Reservaciones */}
              <Route path='/reserva/lista/:estatusFlag' element={
                <ProtectedRoute allowedRoles="Administrador, Cajero, Mesero, Cliente">
                  <ListReservasComponent></ListReservasComponent>
                </ProtectedRoute>

              }></Route>

              <Route path='/reserva/nueva/:idcliente' element={
                <ProtectedRoute allowedRoles="Cliente, Administrador">
                  <ReservarComponent></ReservarComponent>
                </ProtectedRoute>

              }></Route>

              <Route path='/reserva/editar/:idReserva' element={
                <ProtectedRoute allowedRoles="Administrador, Cajero, Cliente">
                  <ReservarComponent></ReservarComponent>
                </ProtectedRoute>

              }></Route>


              {/* SOLO PARA CAJERO LOS ESPECIALES */}
              <Route path='/cliente/cajero/lista' element={
                <ProtectedRoute allowedRoles="Cajero">
                  <ListClienteCajeroComponent></ListClienteCajeroComponent>
                </ProtectedRoute>

              }></Route>

              <Route path='/cliente/cajero/crear' element={
                <ProtectedRoute allowedRoles="Cajero">
                  <CajeroClienteComponent></CajeroClienteComponent>
                </ProtectedRoute>

              }></Route>

              {/* El mesero */}
              <Route path='/ventas/mesero/lista' element={
                <ProtectedRoute allowedRoles="Mesero">
                  <MeseroVentasComponent></MeseroVentasComponent>
                </ProtectedRoute>

              }></Route>

              <Route path='/mesero/editarventa/:idVenta' element={
                <ProtectedRoute allowedRoles="Mesero">
                  <MeseroProductoVenta></MeseroProductoVenta>
                </ProtectedRoute>

              }></Route>              

              <Route path='/mesero/carritoventa/:idVenta' element={
                <ProtectedRoute allowedRoles="Mesero">
                  <MeseroCarritoCompra></MeseroCarritoCompra>
                </ProtectedRoute>

              }></Route>              









              {/* El cliente */}
              <Route path='/clientevista/reserva' element={
                <ProtectedRoute allowedRoles="Cliente">
                  <ReservarClienteComponent></ReservarClienteComponent>
                </ProtectedRoute>

              }></Route>              

              <Route path='/clientevista/susreservas' element={
                <ProtectedRoute allowedRoles="Cliente">
                  <ListReservaClientComponent></ListReservaClientComponent>
                </ProtectedRoute>

              }></Route>      

              <Route path='/clientevista/susventas' element={
                <ProtectedRoute allowedRoles="Cliente">
                  <ListVentaHClienteComponent></ListVentaHClienteComponent>
                </ProtectedRoute>

              }></Route>      


              <Route path="/ventacliente/detalle/:tipo/:id" element={
                <ProtectedRoute allowedRoles="Cliente">
                  <DetalleVentaClienteComponent></DetalleVentaClienteComponent>
                </ProtectedRoute>
              }></Route>


              {/* Perfiles */}
              <Route path="/miperfil/empleado" element={
                <ProtectedRoute allowedRoles="Administrador, Cajero, Mesero, Supervisor">
                  <PerfilEmpleadoComponent></PerfilEmpleadoComponent>
                </ProtectedRoute>
              }></Route>              

              <Route path="/miperfil/cliente" element={
                <ProtectedRoute allowedRoles="Cliente">
                  <PerfilClienteComponent></PerfilClienteComponent>
                </ProtectedRoute>
              }></Route> 


            </Routes>
          </LayoutWrapper>
        </BrowserRouter>

      </AuthProvider>

    </>
  )
}

export default App