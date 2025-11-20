import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext';

export const HeaderComponents = () => {

    const { isAuthenticated, hasRole } = useAuth();
    //Estilo de fondo personalizado (Igual que antes)
    const customBgStyle = {
        backgroundColor: '#5C0000',
    };

    //Color cálido para el texto del Brand
    const warmTextColor = {
        color: '#f5f5dc', // Blanco Hueso
    };

    //Color cálido para los enlaces
    const navLinkColor = '#ffddaf';


    const navLinkStyle = {
        color: navLinkColor,
        transition: 'color 0.3s ease',
    };

    const navegar = useNavigate();

    function listaClientes() {
        navegar(`/cliente/lista/0`)

    }

    function listaTipos() {

        navegar(`/tipo/lista`)
    }

    function listaProductos() {

        navegar(`/producto/lista`)
    }

    // Para el tercer micro

    function listaPuesto() {
        navegar(`/puesto/lista`)
    }

    function listaEmpleado() {
        navegar(`/empleado/lista/0`)
    }

    function listaMesa() {
        navegar(`/mesa/lista`)
    }

    function listaVentas() {
        navegar(`/venta/lista`)
    }

    //Para las reservas
    function listaReservasHistorial() {
        navegar(`/reserva/lista/1`)
    }

    // Navega a /reserva/lista/0 (Atender, estatus 0: Pendientes)
    function listaReservasAtender() {
        navegar(`/reserva/lista/0`)
    }

    //Realizar reserva
    function realizarReserva() {
        navegar(`/cliente/lista/1`)
    }

    function listaClienteCajero() {
        navegar(`/cliente/cajero/lista`)
    }

    //Para el mesero:
    function ventasMeseroAtiende() {
        navegar(`/ventas/mesero/lista`)
    }


    //Ir al menu
    function navegaMenu() {
        navegar(`/`)
    }


    function hacerReservaCliente() {
        navegar(`/clientevista/reserva`)
    }

    function clienteVistaSusReservas() {
        navegar(`/clientevista/susreservas`)
    }

    function clienteVistaSusVentas() {
        navegar(`/clientevista/susventas`)
    }    

    function nuestrosProductos() {
        navegar(`/publica/productos`)
    }        

    return (
        <div>
            <header>

                <nav className="navbar navbar-expand-lg navbar-dark" style={customBgStyle}>
                    <div className="container-fluid">
                        <a className="navbar-brand" href="" onClick={() => navegaMenu()} style={warmTextColor}>
                            Inicio
                        </a>
                        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        <div className="collapse navbar-collapse" id="navbarNav">
                            <ul className="navbar-nav">

                                {/* Permisos de Supervisor y admin */}
                                {(hasRole('Administrador') || hasRole('Supervisor')) && (
                                    <>

                                        <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => listaClientes()} style={navLinkStyle}>Clientes</a>
                                        </li>

                                        <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => listaTipos()} style={navLinkStyle}>Tipos</a>
                                        </li>

                                        <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => listaProductos()} style={navLinkStyle}>Productos</a>
                                        </li>
                                        {/* Del tercer microservicio */}
                                        <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => listaPuesto()} style={navLinkStyle}>Puestos</a>
                                        </li>

                                        <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => listaEmpleado()} style={navLinkStyle}>Empleados</a>
                                        </li>

                                        <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => listaMesa()} style={navLinkStyle}>Mesas</a>
                                        </li>
                                    </>
                                )}


                                {hasRole('Cajero') && (
                                    <>
                                        <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => listaClienteCajero()} style={navLinkStyle}>Lista de clientes</a>
                                        </li>
                                    </>
                                )}

                                {(hasRole('Administrador') || hasRole('Cajero')) && (
                                    <>
                                        {/* <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => realizarReserva()} style={navLinkStyle}>Hacer reservación</a>
                                        </li> */}

                                        <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => listaVentas()} style={navLinkStyle}>Ventas</a>
                                        </li>

                                        {/* Reservas */}
                                        <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => listaReservasHistorial()} style={navLinkStyle}>Historial de reservas</a>
                                        </li>

                                        {/* Reservas (Atender) - Llama a la nueva función con Flag 0 */}
                                        <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => listaReservasAtender()} style={navLinkStyle}>Atender reservación</a>
                                        </li>
                                    </>
                                )}

                                {hasRole('Cliente') && (
                                    <>
                                        <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => hacerReservaCliente()} style={navLinkStyle}>Hacer reservación</a>
                                        </li>

                                        <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => nuestrosProductos()} style={navLinkStyle}>Nuestros productos</a>
                                        </li>

                                        <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => clienteVistaSusReservas()} style={navLinkStyle}>Mis reservaciones</a>
                                        </li>

                                        <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => clienteVistaSusVentas()} style={navLinkStyle}>Mis compras</a>
                                        </li>
                                    </>
                                )}

                                {/* Para el mesero */}
                                {hasRole('Mesero') && (
                                    <>
                                        <li className="nav-item mx-2">
                                            <a className="nav-link" href="" onClick={() => ventasMeseroAtiende()} style={navLinkStyle}>Ventas que atender</a>
                                        </li>
                                    </>
                                )}



                            </ul>
                        </div>
                    </div>
                </nav>
            </header>
        </div>
    )
}