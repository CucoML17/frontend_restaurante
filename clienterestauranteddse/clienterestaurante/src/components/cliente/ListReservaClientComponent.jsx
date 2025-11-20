import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ToastNotification from '../../toast/ToastComponent';

// Servicios de Reservación (Asegúrate de que 'getReservasByCliente' esté ahí)
import { getReservasByCliente, deleteReservacion } from '../../services/ReservarService';

// Servicio de Cliente (Asegúrate de que 'getClienteByUserId' esté ahí)
import { getClienteByUserId } from '../../services/ClienteService';
import ConfirmDialog from '../../toast/ConfirmDialog';

// Función auxiliar para obtener la fecha actual en formato YYYY-MM-DD
const getTodayDate = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};


export const ListReservaClientComponent = () => {

    const navegar = useNavigate();
    const location = useLocation();
    const today = getTodayDate();

    const confirmDialogRef = useRef();

    // Estados de los datos del cliente
    const [idCliente, setIdCliente] = useState(null);
    const [isClientLoading, setIsClientLoading] = useState(true);

    // Estados de las reservas
    const [reservas, setReservas] = useState([]);
    const [filtroFecha, setFiltroFecha] = useState(today); 
    const [isFiltered, setIsFiltered] = useState(false); // true si el filtroFecha no es la fecha de hoy

    // Para el toast
    const toastRef = useRef();

    //Logica de carga de datos---------------------------------------------------------------------

    //Carga las reservas para el cliente logueado y la fecha especificada.
    const getAllReservaciones = useCallback((clienteId, fechaFiltro = null) => {
        
        if (!clienteId) return; //No hacer nada si no hay ID de cliente

        getReservasByCliente(clienteId, fechaFiltro).then((response) => {
            
            //La API retorna 204 No Content si está vacío o 200 con la lista
            setReservas(response.data || []); 
            
            //Determinar si hay un filtro aplicado diferente al default (hoy)
            setIsFiltered(fechaFiltro !== today); 

        }).catch(error => {
            console.error("Error al cargar las reservaciones del cliente:", error);
            
            if (error.response && error.response.status !== 204) {
                if (toastRef.current) {
                    toastRef.current.show("Error al cargar reservas. Intente más tarde.", 'danger');
                }
            }
            setReservas([]);
            setIsFiltered(fechaFiltro !== today); 
        });
    }, [today]);


    //Lógica de filtro-------------------------------------------------------------------

    // Maneja la búsqueda al hacer clic en el botón
    function manejarBusquedaPorFecha() {
        if (idCliente && filtroFecha) {
            getAllReservaciones(idCliente, filtroFecha);
        }
    }

    // Reinicia la búsqueda al día de hoy
    function reiniciarBusqueda() {
        setFiltroFecha(today); // Resetear la fecha al día de hoy
        getAllReservaciones(idCliente, today);
    }

    // Handler para el cambio de la fecha en el input
    const handleFechaChange = (e) => {
        setFiltroFecha(e.target.value);
    };


    //Acciones del cliente
    function editarReserva(idReserva) {
        console.log(`Editando reserva ID: ${idReserva}`);
        // Navega al componente de ReservarClienteComponent para editar
        navegar(`/reserva/editar/${idReserva}`);
    }

    function verDetalleReserva(idReserva) {
        console.log(`Ver detalle de reserva ID: ${idReserva}`);
        navegar(`/ventacliente/detalle/reserva/${idReserva}`);
    }

function cancelarReserva(idReserva) {
    console.log(`Intentando cancelar (DELETE) reserva ID: ${idReserva}`);

    const message = `¿Está seguro de cancelar la reservación? Esta acción no se puede deshacer.`;

    // Reemplazamos window.confirm por el modal
    if (confirmDialogRef.current) {
        // La función show recibe el mensaje y un callback que se ejecuta SI el usuario confirma (Aceptar)
        confirmDialogRef.current.show(message, () => {
            
            // Lógica que se ejecuta SÓLO si el usuario presiona "Aceptar"
            // Llamada eliminación
            deleteReservacion(idReserva).then(() => {

                if (toastRef.current) {
                    // Cambiamos el color a 'success' o 'info' ya que la acción del usuario fue exitosa (la cancelación)
                    toastRef.current.show(`Reservación ID ${idReserva} cancelada correctamente.`, 'success'); 
                }

                // Recargar las reservaciones después de la eliminación
                getAllReservaciones(idCliente, filtroFecha);

            }).catch(error => {
                console.error(`Error al eliminar la reservación ID: ${idReserva}`, error);
                // Mostrar el error en el Toast en lugar de un `alert` nativo
                if (toastRef.current) {
                    toastRef.current.show(`Error al cancelar la reservación ID ${idReserva}. Intente de nuevo.`, 'danger'); 
                }
            });
        });
    }

}

    //
    // Efecto 1: Cargar ID del Cliente Logueado
    useEffect(() => {
        window.scrollTo(0, 0);
        
        const idUsuarioLogueado = localStorage.getItem('idUsuario');
        
        if (idUsuarioLogueado) {
            getClienteByUserId(Number(idUsuarioLogueado)).then(response => {
                const cliente = response.data;
                // El campo que nos interesa es idcliente (todo en minúscula)
                setIdCliente(cliente.idcliente);
            }).catch(error => {
                console.error("Error al obtener el Cliente por idUsuario:", error);
                if (toastRef.current) {
                    toastRef.current.show("No se pudo cargar su ID de cliente. Inicie sesión nuevamente.", 'danger');
                }
                setIdCliente(null);
            }).finally(() => {
                setIsClientLoading(false);
            });
        } else {
            console.error("ID de Usuario no encontrado en localStorage.");
            if (toastRef.current) {
                toastRef.current.show("No está logueado. Redirigiendo...", 'warning');
            }
            setIsClientLoading(false);
            // Si el usuario no está logueado, podríamos redirigirlo al inicio o login
            // navegar('/');
        }
    }, [navegar]);


    // Efecto 2: Cargar Reservaciones una vez que idCliente esté disponible
    useEffect(() => {
        if (idCliente) {
            // Cargar con el filtro de fecha actual (que por defecto es 'today')
            getAllReservaciones(idCliente, filtroFecha); 
        }
    }, [idCliente, getAllReservaciones]); 


    // Efecto 3: Manejo del Toast
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
        return <h2 className="text-center mb-4">Mis Reservaciones</h2>
    }


    //Renderizar
    return (
        <div className="container-fluid p-4">
            
            {pagTitulo()}

            {/* ------------ SECCIÓN DE FILTRO ------------ */}
            <div className="mb-4 w-75 w-md-50 mx-auto">
                {isClientLoading ? (
                    <p className="text-center text-info fw-bold">Cargando datos del cliente...</p>
                ) : !idCliente ? (
                    <p className="text-center text-danger fw-bold">Error: ID de cliente no disponible.</p>
                ) : (
                    <>
                        <div className="row g-3 align-items-end mb-3">
                            <div className="col-md-12 text-start">
                                <label htmlFor="fechaFilter" className="form-label text-start">
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
                            <div className="col-md-6 d-flex">
                                <button
                                    className='btn btn-primary btn-lg flex-grow-1 me-2 btn-busca-b'
                                    onClick={manejarBusquedaPorFecha} 
                                    disabled={!filtroFecha}
                                >
                                    Buscar por Fecha
                                </button>
                                <button
                                    className={`btn btn-secondary btn-lg btn-reinicia-b ${isFiltered ? '' : 'd-none'}`}
                                    onClick={reiniciarBusqueda} 
                                >
                                    Reiniciar (Hoy)
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {/* ------------ FIN DE LA SECCIÓN DE FILTRO ------------ */}


            <div className="table-responsive">
                <table className="table table-striped table-hover table-bordered">
                    <thead className='tableHeaderStyle'>
                        <tr>
                            <th>Mesa</th>
                            <th>Ubicación</th>
                            <th>Fecha</th>
                            <th>Hora</th>
                            <th>Estatus</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {isClientLoading ? (
                            <tr>
                                <td colSpan="6" className="text-center text-primary">Cargando sus reservaciones...</td>
                            </tr>
                        ) : reservas.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center text-muted">No tienes reservaciones que coincidan con la fecha seleccionada.</td>
                            </tr>
                        ) : (
                            reservas.map(reserva => {

                                const isPending = reserva.estatus === 0;
                                const isCompleted = reserva.estatus === 1;
                                const isProcessing = reserva.estatus === 2; // Aunque el cliente no debería ver esto, lo manejamos.

                                let currentEstatusDisplay = 'Desconocido';
                                let currentEstatusColorClass = 'text-muted';

                                if (isPending) {
                                    currentEstatusDisplay = 'Pendiente';
                                    currentEstatusColorClass = 'text-warning';
                                } else if (isProcessing) {
                                    currentEstatusDisplay = 'En Proceso';
                                    currentEstatusColorClass = 'text-info';
                                } else if (isCompleted) {
                                    currentEstatusDisplay = 'Completada';
                                    currentEstatusColorClass = 'text-success';
                                }

                                return (
                                    <tr key={reserva.idReserva}>
                                        <td>No. {reserva.noMesa}</td>
                                        <td>{reserva.ubicacionMesa}</td>
                                        <td>{reserva.fecha}</td>
                                        <td>{reserva.hora ? reserva.hora.substring(0, 5) : 'N/A'}</td>

                                        <td className={`${currentEstatusColorClass} fw-bold`}>
                                            {currentEstatusDisplay}
                                        </td>
                                        <td>

                                            {/* Solo se permiten acciones en estatus Pendiente (0) */}
                                            {isPending ? (
                                                <>
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
                                                <button 
                                                    className='btn btn-info btn-sm' 
                                                    onClick={() => verDetalleReserva(reserva.idReserva)}
                                                >
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
            <ConfirmDialog ref={confirmDialogRef} />

        </div>
    );
};