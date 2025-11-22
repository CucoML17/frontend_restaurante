import React, { useEffect, useState, useRef, useCallback } from 'react'

// Servicios
import { listClientes } from '../../services/ClienteService'
// Se importa el nuevo servicio para actualizar la venta
import { getVentasAtendidas, updateVentaSimple } from '../../services/VentaService'
import { getEmpleadoByUserId } from '../../services/EmpleadoService';
import { useNavigate, useLocation } from 'react-router-dom'
import ToastNotification from '../../toast/ToastComponent';

import ConfirmDialog from '../../toast/ConfirmDialog';

// Función auxiliar para obtener la fecha actual en formato yyyy-mm-dd
const getTodayDateString = () => {
    const today = new Date();
    return today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');
};


export const MeseroVentasComponent = () => {

    const toastRef = useRef(null);
    const location = useLocation();
    const confirmRef = useRef(null);
    const TODAY_DATE = getTodayDateString(); // Constante para la fecha de hoy

    // Estados y constantes
    const [idEmpleado, setIdEmpleado] = useState(null); // ID del empleado logueado
    const [Ventas, setVentas] = useState([])
    const [ClientesMap, setClientesMap] = useState(new Map())

    // Estados para el filtro por fecha. La fecha inicial es SIEMPRE hoy.
    const [filtroFecha, setFiltroFecha] = useState(TODAY_DATE);
    // isFiltered: Indica si se está mostrando un filtro (true: Ver Todas o una fecha diferente a Hoy)
    const [isFiltered, setIsFiltered] = useState(false); 

    // Para navegar
    const navegar = useNavigate();

    // ----------------------------------------------------------------------
    // LÓGICA PRINCIPAL: OBTENER ID EMPLEADO Y CARGAR DATOS
    // ----------------------------------------------------------------------

    // Paso 1: Obtener el idUsuario de localStorage
    useEffect(() => {
        window.scrollTo(0, 0);

        // Asumiendo que el idUsuario se guarda al loguearse.
        const idUsuarioLogueado = localStorage.getItem('idUsuario');

        if (idUsuarioLogueado) {
            // Paso 2: Usar idUsuario para obtener el idEmpleado
            getEmpleadoByUserId(Number(idUsuarioLogueado)).then(response => {
                const empleadoData = response.data;
                // Guardamos el idEmpleado para usarlo en las siguientes peticiones
                setIdEmpleado(empleadoData.idEmpleado);
            }).catch(error => {
                console.error("Error al obtener datos del Empleado por idUsuario:", error);
                toastRef.current.show("Error al cargar datos de mesero.", 'error', 5000);
            });
        } else {
            console.error("ID de Usuario no encontrado en localStorage.");
            toastRef.current.show("Sesión no válida. Inicia sesión de nuevo.", 'error', 5000);
        }
    }, [])

    // Paso 3: Cargar clientes y ventas una vez que idEmpleado esté disponible
    useEffect(() => {
        if (idEmpleado !== null) {
            getAllVentasData();
        }
    }, [idEmpleado]) // Se ejecuta cada vez que idEmpleado cambia (una vez que se carga)


    //Todas las ventas que atiende
    const getAllVentasData = useCallback(() => {
        // 1. Cargar clientes (es global, solo se hace una vez)
        listClientes().then(clienteResponse => {
            const map = new Map();
            clienteResponse.data.forEach(cliente => {
                map.set(cliente.idcliente, cliente.nombrecliente);
            });
            setClientesMap(map);

            //2. Cargar las ventas iniciales (HOY) usando el idEmpleado ya cargado
            //Pasamos la fecha actual (filtroFecha inicial)
            return obtenerVentas(TODAY_DATE);
        })
            .catch(error => {
                console.error("Error al cargar datos de Venta o Cliente:", error);
                setVentas([]);
                toastRef.current.show("Error al cargar datos iniciales.", 'error', 5000);
            });
    }, [idEmpleado, TODAY_DATE])

    // Función auxiliar para obtener la lista de ventas atendidas
    function obtenerVentas(fechaFiltro) {
        // fechaFiltro puede ser una fecha 'YYYY-MM-DD' o null para 'Ver Todas'
        if (idEmpleado === null) return;

        // Llama al nuevo endpoint, siempre incluyendo el idEmpleado
        // Si fechaFiltro es null, el servicio lo omite correctamente
        return getVentasAtendidas(idEmpleado, fechaFiltro)
            .then(ventaResponse => {
                let data = ventaResponse.data || [];

                // MODIFICACIÓN: Filtrar solo las ventas con estado = 0
                const ventasFiltradas = data.filter(venta => venta.estado === 0);
                setVentas(ventasFiltradas);

                // Determinar si el resultado es un filtro activo (diferente a HOY o 'Ver Todas')
                const isShowingToday = fechaFiltro === TODAY_DATE;
                const isCurrentFiltered = !isShowingToday; 
                setIsFiltered(isCurrentFiltered);

                // Actualiza el estado del input de fecha: si es null (Ver Todas), el input se limpia ('').
                setFiltroFecha(fechaFiltro === null ? '' : fechaFiltro);
            })
            .catch(error => {
                // El endpoint retorna 204 (NO_CONTENT) si no hay ventas
                if (error.response && error.response.status === 204) {
                    setVentas([]);
                    const isShowingToday = fechaFiltro === TODAY_DATE;
                    setIsFiltered(!isShowingToday);
                    setFiltroFecha(fechaFiltro === null ? '' : fechaFiltro);
                } else {
                    console.error("Error al obtener ventas:", error);
                    setVentas([]);
                    toastRef.current.show("Error al obtener ventas.", 'error', 5000);
                }
            });
    }

    // Función de manejo de la búsqueda/filtro por el usuario (sin cambios)
    function manejarBusquedaPorFecha() {
        const fecha = filtroFecha.trim();

        if (fecha === "") {
            // Si el campo está vacío, volvemos a la base: HOY
            reiniciarBusqueda();
            return;
        }

        // Llamamos a la función auxiliar para obtener las ventas filtradas
        obtenerVentas(fecha);
    }

    // Lógica de Reinicio (Vuelve a cargar las ventas de HOY) (sin cambios)
    function reiniciarBusqueda() {
        setFiltroFecha(TODAY_DATE); // Actualiza el input a HOY
        // Recarga la lista de ventas para HOY
        obtenerVentas(TODAY_DATE);
    }
    
    // LÓGICA DE VER TODAS LAS VENTAS
    function manejarVerTodasVentas() {
        // Al pasar null, la función obtenerVentas llama a la API sin el parámetro 'fecha'
        obtenerVentas(null); 
    }

    // Handler para actualizar estado de la fecha (sin cambios)
    const handleFechaChange = (e) => {
        setFiltroFecha(e.target.value);
    };

    // Función auxiliar para obtener el nombre del cliente (sin cambios)
    const getClienteNombre = (idCliente) => {
        return ClientesMap.get(idCliente) || `ID ${idCliente} (N/A)`; // Retorna el nombre o un default
    }

    // useEffect para el toast (sin cambios)
    useEffect(() => {
        if (location.state && location.state.toastMessage && toastRef.current) {
            const { toastMessage, toastType } = location.state;
            toastRef.current.show(toastMessage, toastType || 'success', 5000);
            navegar(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, navegar]);


    // Redirección para crear venta (sin cambios)
    function crearVenta() {
        navegar(`/cliente/lista/2`); // Asumiendo que esta es la ruta de inicio de venta.
    }

    function manejarEditarCarrito(venta) {
        const idVenta = venta.idventa;
        console.log(`[EDITAR CARRITO] Navegando para ID Venta: ${idVenta}`);
        // Navegación a la nueva ruta
        navegar(`/mesero/editarventa/${idVenta}`);
    }

    //LÓGICA DE FINALIZAR VENTA (Actualiza estado a 1)
    const manejarFinalizarVenta = (venta) => {
        const message = `¿Estás seguro de finalizar la venta? ya no se podrán agregar más productos`;
        
        //Reemplazamos window.confirm por el modal
        confirmRef.current.show(message, () => {
            // Lógica de Finalizar Venta: Este código SÓLO se ejecuta si se presiona "Aceptar"
            
            // El DTO debe incluir los campos que NO queremos que se borren (idCliente e idReserva)
            const ventaUpdateDto = {
                idCliente: venta.idCliente, 
                idReserva: venta.idReserva, 
                estado: 1
            };

            updateVentaSimple(venta.idventa, ventaUpdateDto)
                .then(() => {
                    toastRef.current.show(`Venta ${venta.idventa} finalizada (Estado: 1).`, 'success', 3000);
                    // Recarga las ventas para que la lista muestre solo las activas (estado 0)
                    obtenerVentas(filtroFecha === '' ? null : filtroFecha); // Recarga manteniendo el filtro actual (o 'Ver Todas' si estaba activo)
                })
                .catch(error => {
                    console.error("Error al finalizar la venta:", error);
                    toastRef.current.show(`Error al finalizar la venta ${venta.idventa}.`, 'error', 5000);
                });
        });
        // Si el usuario presiona Cancelar en el modal, no se ejecuta nada más aquí.
    };


    // Diseño e implementación (La parte del return queda sin cambios, ya que los botones se definieron antes)
    return (
        <div className="container-fluid p-3">
            <ConfirmDialog ref={confirmRef} />
            <ToastNotification ref={toastRef} />
            <h2 className="text-center mb-2">Ventas a atender</h2>

            {/* ------------ INICIO DE LA SECCIÓN DE FILTRO ------------ */}
            <div className="mb-2 w-50 mx-auto">
                <div className="row g-3 align-items-end mb-3">

                    {/* Filtro por Fecha (col-md-12) */}
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
                            // Deshabilitado si el idEmpleado aún no carga
                            disabled={idEmpleado === null} 
                        >
                            Buscar por Fecha
                        </button>
                        <button
                            // Mostrar si la fecha actual es diferente a la de hoy
                            className={`btn btn-secondary btn-lg btn-reinicia-b ${isFiltered ? '' : 'd-none'}`}
                            onClick={reiniciarBusqueda}
                            disabled={idEmpleado === null}
                        >
                            Reiniciar
                        </button>
                    </div>
                </div>
            </div>
            {/* ------------ FIN DE LA SECCIÓN DE FILTRO ------------ */}

            <button className='btn btn-info btn-princi d-none' onClick={() => crearVenta()} disabled={idEmpleado === null}>
                Nueva Venta
            </button>
            <br />
            {/* Se quita el <br> para poner el botón aquí */}

            {/* ------------ BOTÓN VER TODAS (Arriba de la tabla, a la izquierda) ------------ */}
            <div className="d-flex justify-content-start mb-1"> 
                <button
                    className='btn btn-primary me-2 btn-busca-b menorb'
                    onClick={manejarVerTodasVentas}
                    disabled={idEmpleado === null}
                >
                    Ver todas
                </button>
            </div>
            {/* ---------------------------------------------------------------------------- */}

            <div className="table-responsive">
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
                        {idEmpleado === null ? (
                            <tr>
                                <td colSpan="5" className="text-center text-warning">Cargando datos del mesero...</td>
                            </tr>
                        ) : Ventas.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center text-muted">
                                    {/* Mensaje ajustado para reflejar si hay filtro o no */}
                                    {isFiltered && filtroFecha === ''
                                        ? "No se encontraron ventas activas." 
                                        : isFiltered 
                                            ? `No se encontraron ventas activas para la fecha ${filtroFecha}.` 
                                            : "No se encontraron ventas activas hoy."
                                    }
                                </td>
                            </tr>
                        ) : (
                            Ventas.map(venta =>
                                <tr key={venta.idventa}>
                                    <td>{venta.idventa}</td>
                                    <td>{venta.fechaventa}</td>
                                    <td>{getClienteNombre(venta.idCliente)}</td>
                                    <td>${venta.totalventa ? venta.totalventa.toFixed(2) : '0.00'}</td>
                                    <td>
                                        {/* Botón para Editar Carrito */}
                                        <button
                                            className='btn btn-warning me-2'
                                            onClick={() => manejarEditarCarrito(venta)}
                                        >
                                            Editar carrito
                                        </button>

                                        {/* Botón para Finalizar Venta */}
                                        <button
                                            className='btn btn-success'
                                            onClick={() => manejarFinalizarVenta(venta)}
                                        >
                                            Finalizar
                                        </button>
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    )
}