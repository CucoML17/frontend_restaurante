import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// 1. Servicios de Venta (Asegúrate de importar la nueva función)
import { getVentasByClienteIdAndFecha } from '../../services/VentaService'
// 2. Servicios de Cliente (Para obtener el ID de Cliente)
import { getClienteByUserId } from '../../services/ClienteService'

import ToastNotification from '../../toast/ToastComponent';

// Función auxiliar para obtener la fecha de hoy en formato YYYY-MM-DD
const getTodayDate = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};


export const ListVentaHClienteComponent = () => {

    const toastRef = useRef(null);
    const location = useLocation();
    const navegar = useNavigate();

    // Estados y constantes
    const [Ventas, setVentas] = useState([]);
    const [idCliente, setIdCliente] = useState(null); // ID del cliente logueado

    // Estados para el filtro por fecha, inicializado en la fecha de hoy
    const [filtroFecha, setFiltroFecha] = useState(getTodayDate());
    // CAMBIO CLAVE: Cambiamos isFiltered para que también cubra la vista 'Todas'
    // Si estamos mostrando 'Hoy', es false. Si mostramos otra fecha O TODAS, es true.
    const [isFiltered, setIsFiltered] = useState(false);
    const fechaHoy = getTodayDate(); // Fecha actual

    // Obtiene el ID de usuario del localStorage
    const getIdUsuarioFromLocalStorage = () => {
        // Asume que el ID de usuario está guardado en localStorage bajo una clave,
        // por ejemplo, 'idUsuario' o dentro de un objeto de usuario
        const usuarioString = localStorage.getItem('usuario');
        if (usuarioString) {
            // Esto es una asunción. Ajusta la lógica según cómo guardes el ID de usuario
            try {
                const usuario = JSON.parse(usuarioString);
                return usuario.idUsuario;
            } catch (e) {
                console.error("Error al parsear el usuario de localStorage:", e);
            }
        }
        // Si no está en 'usuario', revisa si está directamente en 'idUsuario'
        const idUsuarioDirecto = localStorage.getItem('idUsuario');
        if (idUsuarioDirecto) return parseInt(idUsuarioDirecto);

        return null;
    };


    // Función principal para cargar el ID del Cliente y sus Ventas (inicial)
    useEffect(() => {
        const idUsuario = getIdUsuarioFromLocalStorage();
        if (idUsuario) {
            getClienteByUserId(idUsuario)
                .then(response => {
                    const clienteData = response.data;
                    const clienteId = clienteData.idcliente;
                    setIdCliente(clienteId);

                    // Cargar las ventas del cliente para la fecha de hoy (comportamiento inicial)
                    obtenerVentas(clienteId, fechaHoy);
                })
                .catch(error => {
                    console.error("Error al obtener datos del Cliente por idUsuario:", error);
                });
        } else {
            console.error("ID de usuario no encontrado en localStorage.");
            // Opcional: Redirigir al login si no hay usuario
            // navegar('/login');
        }

    }, []); // Se ejecuta solo al montar el componente


    // El useeffect para el toast (copiado de la versión anterior)
    useEffect(() => {
        if (location.state && location.state.toastMessage && toastRef.current) {
            const { toastMessage, toastType } = location.state;
            toastRef.current.show(toastMessage, toastType || 'success', 5000);
            navegar(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, navegar]);


    // Función auxiliar para obtener la lista de ventas del cliente
    // La fechaFiltro puede ser una fecha (YYYY-MM-DD) o una cadena vacía/null para ver todas.
    function obtenerVentas(clienteId, fechaFiltro) {

        if (!clienteId) return; //No hacer nada si no hay ID de cliente

        // Si fechaFiltro es null, undefined, o string vacío, el service envía la petición sin ?fecha=
        const fecha = fechaFiltro || "";

        //Usar la función de servicio, que ahora es más robusta.
        return getVentasByClienteIdAndFecha(clienteId, fecha)
            .then(ventaResponse => {

                const data = ventaResponse.data || [];
                setVentas(data);

                // Lógica de filtro:
                // La lista está "filtrada" si NO estamos mostrando la fecha de hoy.
                // Esto cubre tanto la búsqueda por otra fecha como la vista "Ver Todas" (fechaFiltro === "")
                setIsFiltered(fecha !== fechaHoy);

            })
            .catch(error => {
                //Si el backend devuelve un 204 o error, se vacía la lista
                if (error.response && error.response.status === 204) {
                    setVentas([]);
                } else {
                    console.error("Error al obtener ventas del cliente:", error);
                    setVentas([]);
                }
            });
    }


    // Función de manejo de la búsqueda/filtro por fecha
    function manejarBusquedaPorFecha() {
        const fecha = filtroFecha.trim();

        if (fecha === "") {
            // Si el campo de fecha está vacío, reiniciamos a la lista de HOY (Comportamiento deseado para el input)
            // Aunque la función manejarVerTodas ya permite ver todo si la fecha es ""
            // Aquí forzaremos el comportamiento de "Ver Hoy" si se intenta buscar con campo vacío.
            reiniciarBusqueda();
            return;
        }

        // Llamamos a la función auxiliar para obtener las ventas filtradas por la fecha elegida
        obtenerVentas(idCliente, fecha);
    }

    // NUEVA FUNCIÓN: Ver todas las ventas
    function manejarVerTodas() {
        // 1. Quitar la fecha del input para indicar que no hay filtro
        setFiltroFecha("");
        // 2. Llamar a la función de obtención con fecha vacía
        obtenerVentas(idCliente, "");
    }

    // Lógica de Reinicio (siempre vuelve a la fecha de hoy)
    function reiniciarBusqueda() {
        setFiltroFecha(fechaHoy); // Fija el input a hoy
        obtenerVentas(idCliente, fechaHoy); // Carga las ventas de hoy
    }

    // Handler para actualizar estado de la fecha
    const handleFechaChange = (e) => {
        setFiltroFecha(e.target.value);
    };

    // Detalle de la venta
    function verDetalleVenta(id) {
        navegar(`/ventacliente/detalle/venta/${id}`);
        console.log("Ver detalle de venta: ", id);
    }

    // Diseño e implementación
    return (
        <div className="container-fluid p-4">
            <ToastNotification ref={toastRef} />
            <h2 className="text-center mb-4">Mi historial de compras</h2>




            {/* ------------ INICIO DE LA SECCIÓN DE FILTRO DE FECHA INDIVIDUAL ------------ */}
            <div className="mb-4 w-50 mx-auto">
                <div className="row g-3 align-items-end mb-1">

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
                            disabled={!filtroFecha || !idCliente} // Deshabilitado si no hay fecha o cliente
                        >
                            Buscar por Fecha
                        </button>
                        <button
                            // Mostrar solo si la lista actual NO es la de la fecha de hoy
                            className={`btn btn-secondary btn-lg btn-reinicia-b ${isFiltered ? '' : 'd-none'}`}
                            onClick={reiniciarBusqueda}
                        >
                            Reiniciar
                        </button>
                    </div>
                </div>
            </div>
            {/* ------------ FIN DE LA SECCIÓN DE FILTRO DE FECHA INDIVIDUAL ------------ */}

            {/* NUEVA FILA PARA EL BOTÓN "VER TODAS" */}
            <div className="d-flex justify-content-between align-items-center mb-1">
                {/* Botón "Ver todas" */}
                <button
                    className='btn btn-primary me-2 btn-busca-b menorb'
                    onClick={manejarVerTodas}
                    disabled={!idCliente}
                >
                    Ver todas
                </button>
            </div>
            {/* -------------------------------------------------------- */}

            <table className="table table-striped table-hover table-bordered">

                <thead className='tableHeaderStyle'>
                    <tr>
                        <th>ID Venta</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {Ventas.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="text-center text-muted">
                                No se encontraron ventas para la fecha {filtroFecha === "" ? 'cualquier fecha' : filtroFecha}.
                            </td>
                        </tr>
                    ) : (
                        Ventas.map(venta =>
                            <tr key={venta.idventa}>
                                <td>{venta.idventa}</td>
                                <td>{venta.fechaventa}</td>
                                <td>${venta.totalventa ? venta.totalventa.toFixed(2) : '0.00'}</td>

                                <td>
                                    <button className='btn btn-info btn-sm' onClick={() => verDetalleVenta(venta.idventa)}>Ver Detalle</button>
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
        </div>
    )
}