import React, { useEffect, useState, useRef } from 'react';

import { listReservaciones, deleteReservacion, updateReservacion, getReservacion } from '../services/ReservarService';

import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ToastNotification from '../toast/ToastComponent';

import { getAtenderByReservaId } from '../services/AtenderService';
import ConfirmDialog from '../toast/ConfirmDialog';


export const ListReservasComponent = () => {


    const { estatusFlag } = useParams();
    //La bandera 0 (Pendientes/Proceso) o 1 (Completadas/Historial)
    const targetEstatus = parseInt(estatusFlag, 10);


    const estatusDisplay = targetEstatus === 1 ? 'Confirmada' : 'Pendiente';
    const estatusColorClass = targetEstatus === 1 ? 'text-success' : 'text-warning';

    //Estados de los datos
    const [reservasOriginales, setReservasOriginales] = useState([]);
    const [reservasDetalladas, setReservasDetalladas] = useState([]);

    // Mapeo: { idReserva: idEmpleado }
    const [empleadosAtendiendo, setEmpleadosAtendiendo] = useState({})

    //Estados de los filtros
    // const [filtroNombreCliente, setFiltroNombreCliente] = useState('');
    // 💡 Mantendremos el filtroFecha, pero lo usaremos para la API
    const [filtroFecha, setFiltroFecha] = useState(''); // Lo inicializamos vacío (o null)
    // const [filtroHora, setFiltroHora] = useState('');

    const [isFiltered, setIsFiltered] = useState(false);

    //Para el toast
    const toastRef = useRef();

    const confirmRef = useRef(null);

    const navegar = useNavigate();
    const location = useLocation();


    // ------------------- Función de utilidad para corregir la fecha -------------------
    /**
     * Toma una cadena de fecha 'YYYY-MM-DD', le suma 1 día y la devuelve formateada.
     * @param {string} dateString La fecha en formato YYYY-MM-DD.
     * @returns {string} La fecha ajustada en formato YYYY-MM-DD.
     */
    function adjustDisplayDate(dateString) {
        if (!dateString) return '';
        
        // 1. Crear un objeto Date. Le añadimos T00:00:00 para tratarlo como hora local
        // y evitar problemas de zona horaria que resten un día al interpretarlo.
        const dateObj = new Date(dateString + 'T00:00:00'); 
        
        // 2. Sumar un día.
        dateObj.setDate(dateObj.getDate() + 1);

        // 3. Formatear de nuevo a YYYY-MM-DD
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        
        return `${yyyy}-${mm}-${dd}`;
    }
    // ----------------------------------------------------------------------------------


    function getAllReservaciones(fechaFiltro = null) {
        listReservaciones(fechaFiltro).then(async (response) => {
            const allReservasCompletas = response.data;

            //1. Aplicar filtro de estatus (Pendiente/Proceso o Completada)
            const filteredReservasByEstatus = allReservasCompletas.filter(reserva => {
                if (targetEstatus === 0) {
                    return reserva.estatus === 0 || reserva.estatus === 2;
                }
                return reserva.estatus === targetEstatus;
            });

            setReservasOriginales(filteredReservasByEstatus);
            setReservasDetalladas(filteredReservasByEstatus);

            //2. OBTENER EMPLEADO ATENDIENDO PARA LAS RESERVAS EN PROCESO (estatus 2)
            const newEmpleadosAtendiendo = {};
            const promesasEmpleados = filteredReservasByEstatus
                .filter(reserva => reserva.estatus === 2)
                .map(reserva => {
                    const idReserva = reserva.idReserva;
                    return getAtenderByReservaId(idReserva)
                        .then(res => {
                            //Si la llamada es exitosa (código 200), guarda el idEmpleado
                            newEmpleadosAtendiendo[idReserva] = res.data.idEmpleado;
                        })
                        .catch(error => {
                            console.warn(`No se encontró empleado atendiendo para Reserva ID ${idReserva}.`, error.response?.status);
                            newEmpleadosAtendiendo[idReserva] = null;
                        });
                });

            //3. Esperar a que todas las promesas se resuelvan antes de actualizar el estado
            await Promise.all(promesasEmpleados);

            setEmpleadosAtendiendo(newEmpleadosAtendiendo);
            //4. Actualizar estado de filtro para el botón "Reiniciar"
            setIsFiltered(!!fechaFiltro);

        }).catch(error => {
            console.error("Error en la carga principal de reservaciones:", error);
            setReservasOriginales([]);
            setReservasDetalladas([]);
            setEmpleadosAtendiendo({}); //Resetear también
        });
    }


    //Lógica de Búsqueda por Fecha
    function manejarBusquedaPorFecha() {
        if (filtroFecha) {
            // Llama a la API con la fecha actual del estado.
            getAllReservaciones(filtroFecha);
        }
    }

    //Lógica de Reinicio
    function reiniciarBusqueda() {
        setFiltroFecha(''); // Resetear la fecha

        // Recargar todas las reservaciones sin filtro de fecha
        getAllReservaciones(null);
    }

    //Handler para el cambio de la fecha
    const handleFechaChange = (e) => {
        setFiltroFecha(e.target.value);
        // Nota: Llama a manejarBusquedaPorFecha en el botón, no en el onChange
    };

    // ------------------- Handlers -------------------


    //------------------- Funciones de Acción -------------------

    function verDetalle(id) {
        console.log(`Ver detalle de reserva ID: ${id}`);
        navegar(`/venta/detalle/${id}`);
    }

    //Pendiente sin proceso
function atenderReserva(idReserva, idCliente, fechaReserva) {
        
        // 🚨 1. CORRECCIÓN DE LA FECHA DE RESERVA RECIBIDA (+1 DÍA) 🚨
        const correctedFechaReserva = adjustDisplayDate(fechaReserva);
        // NOTA: Usamos la función 'adjustDisplayDate' que definimos anteriormente.

        //1. Obtener la fecha actual del sistema en formato YYYY-MM-DD
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const fechaActualFormateada = `${year}-${month}-${day}`;

        console.log(`Fecha de Reserva Original (BD): ${fechaReserva}`);
        console.log(`Fecha de Reserva Corregida (+1 día): ${correctedFechaReserva}`);
        console.log(`Fecha Actual del Sistema: ${fechaActualFormateada}`);


        //2. Validación de Fechas
        // 💡 USAMOS LA FECHA CORREGIDA EN LA VALIDACIÓN
        if (correctedFechaReserva !== fechaActualFormateada) { 
            let mensaje = "";

            //Convierte a date para hacer una comparación de si es pasada o futura
            // 💡 USAMOS LA FECHA CORREGIDA PARA CONVERTIR A OBJETO DATE
            const fechaReservaDate = new Date(correctedFechaReserva + 'T00:00:00'); // Aseguramos que se interprete correctamente
            const fechaActualDate = new Date(fechaActualFormateada + 'T00:00:00');

            if (fechaReservaDate < fechaActualDate) {
                mensaje = `Lo sentimos, la fecha ${correctedFechaReserva} de la reserva ya no se puede atender (Fecha pasada).`;
            } else {
                mensaje = `La fecha ${correctedFechaReserva} de la reserva aún no se puede atender, espere a ese día (Fecha futura).`;
            }

            //El toast
            if (toastRef.current) {
                toastRef.current.show(mensaje, 'warning');
            }

            console.error(mensaje);

            return;
        }

        //3. Si la fecha coincide, procede a navegar
        console.log(`Atendiendo reserva ID: ${idReserva} con Cliente ID: ${idCliente}. Fecha OK: ${correctedFechaReserva}`);
        // Flag 1 para indicar Flujo de Reserva
        navegar(`/empleado/lista/1/${idReserva}/${idCliente}`);
    }


    function manejarNuevaVenta(idReserva) {

        // 1. Buscar el idEmpleado en el estado de empleadosAtendiendo
        const idEmpleado = empleadosAtendiendo[idReserva]; // 🆕 Obtenerlo del estado

        // Validar si encontramos el empleado
        if (!idEmpleado) {
            console.error(`Error: No se encontró el ID de Empleado para la reserva #${idReserva}.`);
            if (toastRef.current) {
                toastRef.current.show(`Error al continuar: Empleado no asignado para Reserva #${idReserva}.`, 'danger');
            }
            return;
        }

        // 1. Buscar el objeto de la reserva para obtener el idCliente
        const reservaActual = reservasDetalladas.find(r => r.idReserva === idReserva);

        if (!reservaActual) {
            console.error(`Error: No se encontró la reserva #${idReserva} para continuar la venta.`);
            if (toastRef.current) {
                toastRef.current.show(`Error al continuar: Reserva #${idReserva} no encontrada.`, 'danger');
            }
            return;
        }

        const idClienteReserva = reservaActual.idCliente; // Obtener el idCliente de la reserva

        const message = "Continuando reservación. Seleccione los productos para la nueva venta.";
        console.log(`Nueva Venta para Reserva ID: ${idReserva}, Cliente ID: ${idClienteReserva}, Empleado ID: ${idEmpleado}.`);

        // 2. Modificación de la navegación: Directo a la selección de productos
        // Ruta: /venta/productos/:idcliente/:flag/:idreserva/:idempleado
        navegar(`/venta/productos/${idClienteReserva}/1/${idReserva}/${idEmpleado}`, {
            state: {
                toastMessage: message,
                toastType: 'success',
                // Ya no es necesario pasar idReserva e idEmpleado aquí, ya van en la URL.
                // Además, aseguramos que el carrito inicie vacío al ir a productos
                carritoItems: []
            }
        });
    }

const adjustReservaDateAndTime = (dto) => {
        if (!dto.fecha || !dto.hora) {
            console.warn("Advertencia: DTO de reserva no contiene fechaReserva o horaReserva para corrección.");
            return dto;
        }

        // Crear un objeto Date combinado (simulando una marca de tiempo completa)
        // Se asume que la fecha es localmente correcta si concatenamos
        const originalDateTimeString = `${dto.fecha}T${dto.hora}`;
        let dateObj = new Date(originalDateTimeString);

        console.log(`Fecha/Hora original antes de corrección: ${dateObj.toISOString()}`);
        
        // 1. Sumar 1 día a la fecha
        dateObj.setDate(dateObj.getDate() + 1);

        // 2. Restar 6 horas a la hora
        dateObj.setHours(dateObj.getHours() - 6);

        console.log(`Fecha/Hora corregida: ${dateObj.toISOString()}`);

        // 3. Formatear los resultados de vuelta a los formatos YYYY-MM-DD y HH:MM:SS
        
        // Formatear Fecha (YYYY-MM-DD)
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        dto.fecha = `${year}-${month}-${day}`;
        
        // Formatear Hora (HH:MM:SS)
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');
        dto.hora = `${hours}:${minutes}:${seconds}`;

        return dto;
    };      

async function manejarTerminarReserva(idReserva) {
    
    // Usamos el ConfirmDialog
    confirmRef.current.show(
        `¿Está seguro de tarminar y marcar como completada la reservación?, ya no se podrán agregar más ventas`, // Mensaje de confirmación
        // 👈 Lógica que se ejecuta SOLO si el usuario confirma
        async () => {
            
            try {
                console.log(`Ejecutando terminación de reserva ID: ${idReserva}`);

                // 1. OBTENER el DTO fresco del servidor
                const reservaResponse = await getReservacion(idReserva);
                let rawReservaDto = reservaResponse.data;
                
                // 2. Modificar estatus a 1 (Reservación Atendida / Cerrada)
                rawReservaDto.estatus = 1;

                rawReservaDto = adjustReservaDateAndTime(rawReservaDto); 
                console.log(`Intentando terminar (UPDATE estatus=1) reserva ID: ${idReserva}`);

                // 3. ACTUALIZAR la reservación
                await updateReservacion(idReserva, rawReservaDto);

                // Lógica de éxito
                if (toastRef.current) {
                    toastRef.current.show(`Reservación ID ${idReserva} terminada y completada.`, 'success');
                }

                // Navegar a la lista de completadas con un mensaje de éxito
                navegar(`/reserva/lista/1`, { 
                    replace: true, 
                    state: { 
                        toastMessage: `Reservación #${idReserva} terminada con éxito.`, 
                        toastType: 'success' 
                    } 
                });

            } catch (error) {
                // Lógica de error
                console.error(`Error al terminar la reservación ID: ${idReserva}`, error.response ? error.response.data : error.message);
                
                if (error.response && error.response.status === 403) {
                    alert(`⚠️ Error 403 (Prohibido): Revise la configuración de seguridad (JWT/CSRF) en el backend.`);
                } else {
                    alert(`Error al terminar la reservación. Consulta la consola para más detalles.`);
                }
            }
        }
    );
}


function cancelarReserva(idReserva) {
    console.log(`Preparando para cancelar (DELETE) reserva ID: ${idReserva}`);

    // Usamos el ConfirmDialog
    confirmRef.current.show(
        `¿Está seguro de cancelar la reservación? Esta acción es irreversible.`, // Mensaje de confirmación
        () => {
            //Lógica de eliminación: Este callback se ejecuta SOLO al CONFIRMAR
            console.log(`Ejecutando cancelación (DELETE) reserva ID: ${idReserva}`);
            
            deleteReservacion(idReserva).then(() => {

                if (toastRef.current) {
                    toastRef.current.show(`Reservación ID ${idReserva} eliminada correctamente.`, 'danger');
                }

                // Recargar todas las reservaciones después de la eliminación
                getAllReservaciones();

            }).catch(error => {

                console.error(`Error al eliminar la reservación ID: ${idReserva}`, error);
                alert(`Error al eliminar la reservación. Consulta la consola para más detalles.`);
            });
        }
    );
}

    useEffect(() => {
        window.scrollTo(0, 0);

        getAllReservaciones();
    }, [targetEstatus]);

    //El usseffect del toast
    useEffect(() => {

        if (location.state && location.state.toastMessage) {
            const { toastMessage, toastType = 'success' } = location.state;
            if (toastRef.current) {
                toastRef.current.show(toastMessage, toastType);

                navegar(location.pathname, { replace: true });
            }
        }
    }, [location.state, navegar, location.pathname]);


    function pagTitulo() {
        if (targetEstatus === 0) {
            return <h2 className="text-center mb-4">Reservas pendientes</h2>
        } else {
            return <h2 className="text-center mb-4">Historial de reservas</h2>
        }

    }


    function verDetalleReserva(idReserva) {
        console.log(`Ver detalle de reserva ID: ${idReserva}`);
        navegar(`/venta/detalle/reserva/${idReserva}`);
    }

    function editarReserva(idReserva) {
        console.log(`Editando reserva ID: ${idReserva}`);

        navegar(`/reserva/editar/${idReserva}`);
    }

    //Ya la construcción
    return (
        <div className="container-fluid p-4">


            {
                pagTitulo()
            }
            {/* ------------ INICIO DE LA SECCIÓN DE FILTRO ------------ */}
            <div className="mb-4 w-50 mx-auto">
                <div className="row g-3 align-items-end mb-3">

                    {/* Filtro por Fecha (col-md-12) */}
                    <div className="col-md-12 text-start">
                        <label
                            htmlFor="fechaFilter"
                            className="form-label text-start"
                        >
                            Seleccione la fecha a filtrar
                        </label>
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
                            onClick={manejarBusquedaPorFecha} // ⬅️ FUNCIÓN DE BÚSQUEDA
                            disabled={!filtroFecha}
                        >
                            Buscar por Fecha
                        </button>
                        <button
                            // Mostrar solo si isFiltered es true (un filtro activo)
                            className={`btn btn-secondary btn-lg btn-reinicia-b ${isFiltered ? '' : 'd-none'}`}
                            onClick={reiniciarBusqueda} // ⬅️ FUNCIÓN DE REINICIO
                        >
                            Reiniciar
                        </button>
                    </div>
                </div>
            </div>
            {/* ------------ FIN DE LA SECCIÓN DE FILTRO ------------ */}


            <div className="table-responsive">
                <table className="table table-striped table-hover table-bordered">
                    <thead className='tableHeaderStyle'>
                        <tr>
                            <th>ID Reserva</th>
                            <th>Cliente</th>
                            <th>Mesa</th>
                            <th>Fecha</th>
                            <th>Hora</th>
                            <th>Estatus</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {reservasDetalladas.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center text-muted">No hay reservaciones que coincidan con los filtros aplicados.</td>
                            </tr>
                        ) : (
                            reservasDetalladas.map(reserva => {

                                const isProcessing = reserva.estatus === 2;
                                console.log(reserva.estatus);
                                const isPending = reserva.estatus === 0;

                                const idEmpleadoAtendiendo = empleadosAtendiendo[reserva.idReserva];
                                const isBeingAttended = !!idEmpleadoAtendiendo; // Bandera para saber si ya tiene empleado                                

                                const currentEstatusDisplay = isProcessing ? 'Proceso' : (isPending ? 'Pendiente' : estatusDisplay);
                                const currentEstatusColorClass = isProcessing ? 'text-info' : (isPending ? 'text-warning' : estatusColorClass);

                                return (
                                    <tr key={reserva.idReserva}>
                                        <td>{reserva.idReserva}</td>
                                        <td>{reserva.nombreCliente}</td>
                                        <td>No. {reserva.noMesa}</td>
                                        {/* 🎯 MODIFICACIÓN AQUÍ 🎯 */}
                                        <td>{adjustDisplayDate(reserva.fecha)}</td>
                                        <td>{reserva.hora}</td>

                                        <td className={`${currentEstatusColorClass} fw-bold`}>
                                            {currentEstatusDisplay}
                                        </td>
                                        <td>

                                            {isProcessing ? (

                                                <>
                                                    <button
                                                        className='btn btn-success btn-sm me-2'
                                                        // 💡 Llamamos a manejarNuevaVenta SÓLO con el idReserva
                                                        onClick={() => manejarNuevaVenta(reserva.idReserva)}
                                                        // 💡 Deshabilitar si aún no hemos podido obtener el empleado
                                                        disabled={!isBeingAttended}
                                                    >
                                                        Nueva Venta
                                                    </button>
                                                    <button
                                                        className='btn btn-danger btn-sm'
                                                        onClick={() => manejarTerminarReserva(reserva.idReserva)}
                                                    >
                                                        Terminar
                                                    </button>
                                                </>
                                            ) : isPending ? (

                                                <>
                                                    <button className='btn btn-success btn-sm me-2' onClick={() => atenderReserva(reserva.idReserva, reserva.idCliente, reserva.fecha)}>
                                                        Atender
                                                    </button>

                                                    <button
                                                        className='btn btn-warning btn-sm me-2'
                                                        onClick={() => editarReserva(reserva.idReserva)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        className='btn btn-danger btn-sm'
                                                        onClick={() => cancelarReserva(reserva.idReserva)}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </>
                                            ) : (

                                                <button className='btn btn-info btn-sm' onClick={() => verDetalleReserva(reserva.idReserva)}>
                                                    Ver detalle
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <ToastNotification ref={toastRef} />
            <ConfirmDialog ref={confirmRef} />

        </div>
    );
};