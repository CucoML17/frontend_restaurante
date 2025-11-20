import React, { useEffect, useState, useRef } from 'react'

import { listVentas, deleteVenta, buscarVentasPorFecha } from '../services/VentaService'
import { listClientes } from '../services/ClienteService'
import { useNavigate, useLocation } from 'react-router-dom'

import ToastNotification from '../toast/ToastComponent';

export const ListVentaComponent = () => {

    const toastRef = useRef(null);
    const location = useLocation();

    //Estados y constantes
    const [Ventas, setVentas] = useState([])
    const [VentasOriginales, setVentasOriginales] = useState([])
    const [ClientesMap, setClientesMap] = useState(new Map())


    // Estados para el filtro por fecha
    const [filtroFecha, setFiltroFecha] = useState(''); // Fecha seleccionada
    const [isFiltered, setIsFiltered] = useState(false);

    //Para navegar
    const navegar = useNavigate();


    useEffect(() => {
        getAllVentasData();
    }, [])


    //El useffect para el toast
    useEffect(() => {
        if (location.state && location.state.toastMessage && toastRef.current) {

            const { toastMessage, toastType } = location.state;


            toastRef.current.show(toastMessage, toastType || 'success', 5000);


            navegar(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, navegar]);

    //Función principal para cargar Ventas y Clientes
    function getAllVentasData() {

        listClientes().then(clienteResponse => {
            const map = new Map();
            clienteResponse.data.forEach(cliente => {
                map.set(cliente.idcliente, cliente.nombrecliente);
            });
            setClientesMap(map);

            // Retorna la promesa para obtener todas las ventas
            return obtenerVentas();
        })
            .catch(error => {
                console.error("Error al cargar datos de Venta o Cliente:", error);
            });
    }

    //  Función auxiliar para obtener la lista (puede ser todas o filtradas)
    function obtenerVentas(fechaFiltro = '') {
        // Si se pasa una fecha, usamos el endpoint de búsqueda, si no, usamos el listado completo
        const servicioVentas = fechaFiltro
            ? buscarVentasPorFecha(fechaFiltro)
            : listVentas();

        return servicioVentas
            .then(ventaResponse => {
                const data = ventaResponse.data;
                setVentas(data); // El que se muestra

                // Solo si no hay filtro, actualizamos la lista original
                if (!fechaFiltro) {
                    setVentasOriginales(data);
                    setIsFiltered(false);
                } else {
                    setIsFiltered(true);
                }

            })
            .catch(error => {
                console.error("Error al obtener ventas:", error);
                setVentas([]);
            });
    }

    //Función de manejo de la búsqueda/filtro
    function manejarBusquedaPorFecha() {
        const fecha = filtroFecha.trim();

        if (fecha === "") {
            // Si el campo de fecha está vacío, reiniciamos a la lista original
            reiniciarBusqueda();
            return;
        }

        // Llamamos a la función auxiliar para obtener las ventas filtradas
        obtenerVentas(fecha);
    }

    //Lógica de Reinicio
    function reiniciarBusqueda() {
        setFiltroFecha('');
        // Recarga la lista completa de ventas (usando obtenerVentas() sin parámetro)
        obtenerVentas();
    }

    //Handler para actualizar estado de la fecha
    const handleFechaChange = (e) => {
        setFiltroFecha(e.target.value);
    };

    //Función auxiliar para obtener el nombre del cliente
    const getClienteNombre = (idCliente) => {

        return ClientesMap.get(idCliente) || `ID ${idCliente} (N/A)`; // Retorna el nombre o un default
    }




    //El detalle de la venta, que miedo
    function verDetalleVenta(id) {

        navegar(`/venta/detalle/venta/${id}`);
        console.log("Ver detalle de venta: ", id);
    }

    //Navega a la creación estro va a cambiar
    function crearVenta() {

        navegar(`/cliente/lista/2`);
    }


    //Eliminación de Venta (normal)
    function eliminarVenta(id) {
        console.log(`Eliminando venta con ID: ${id}`);
        deleteVenta(id).then((response) => {
            console.log(response.data);
            getAllVentasData();
        }).catch(error => {
            console.error("Error al eliminar Venta:", error);
        })
    }

    //Diseño e implementación
    return (
        <div className="container-fluid p-4">
            <ToastNotification ref={toastRef} />
            <h2 className="text-center mb-4">Lista de Ventas</h2>

            {/* ------------ INICIO DE LA SECCIÓN DE FILTRO ------------ */}
            <div className="mb-4 w-50 mx-auto">
                <div className="row g-3 align-items-end mb-3">

                    {/* Filtro por Fecha (col-md-6) */}
                    <div className="col-md-12 text-start">
                        <label htmlFor="fechaFilter" className="form-label text-start"
                        >Seleccione la fecha a filtrar</label>
                        <input
                            id="fechaFilter"
                            type="date"
                            placeholder="Seleccione fecha..."
                            className="form-control form-control-lg"
                            value={filtroFecha}
                            onChange={handleFechaChange}
                        />
                    </div>
                </div>


                <div className="row g-3 align-items-end justify-content-center">
                    {/* Botones (col-md-6) */}
                    <div className="col-md-6 d-flex">
                        <button
                            className='btn btn-primary btn-lg flex-grow-1 me-2 btn-busca-b'
                            onClick={manejarBusquedaPorFecha}
                            disabled={!filtroFecha} // Deshabilitado si no hay fecha seleccionada
                        >
                            Buscar por Fecha
                        </button>
                        <button
                            // Mostrar solo si isFiltered es true (un filtro activo)
                            className={`btn btn-secondary btn-lg btn-reinicia-b ${isFiltered ? '' : 'd-none'}`}
                            onClick={reiniciarBusqueda}
                        >
                            Reiniciar
                        </button>
                    </div>
                </div>
            </div>
            {/* ------------ FIN DE LA SECCIÓN DE FILTRO ------------ */}


            <button className='btn btn-info btn-princi' onClick={() => crearVenta()}>Nueva Venta</button>
            <br />
            <br />

            <table className="table table-striped table-hover table-bordered">

                <thead className='tableHeaderStyle'>
                    <tr>

                        <th>ID Venta</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Total</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {Ventas.length === 0 && (
                        <tr>
                            <td colSpan="5" className="text-center text-muted">
                                No se encontraron ventas para {isFiltered ? `la fecha ${filtroFecha}.` : 'mostrar.'}
                            </td>
                        </tr>
                    )}

                    {
                        Ventas.map(venta =>

                            <tr key={venta.idventa}>
                                <td>{venta.idventa}</td>
                                <td>{venta.fechaventa}</td>


                                <td>{getClienteNombre(venta.idCliente)}</td>


                                <td>${venta.totalventa ? venta.totalventa.toFixed(2) : '0.00'}</td>

                                <td>

                                    <button className='btn btn-primary' onClick={() => verDetalleVenta(venta.idventa)}>Ver Detalle</button>


                                    <button
                                        className='btn btn-eliminar sepaizq d-none'
                                        onClick={() => eliminarVenta(venta.idventa)}
                                    >
                                        Eliminar
                                    </button>

                                </td>
                            </tr>
                        )
                    }
                </tbody>
            </table>
        </div>
    )
}