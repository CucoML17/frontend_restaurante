import React, { useEffect, useState, useRef } from 'react'
import { listClientes, deleteCliente, buscaClientesByName } from '../services/ClienteService'
import { getReservacion } from '../services/ReservarService'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import ToastNotification from '../toast/ToastComponent';

//IMPORTACIONES NECESARIAS para la lógica de usuario
import { getUsuarioById, toggleUserEstatus } from '../services/AuthService';

//IMPORTACIÓN DEL NUEVO COMPONENTE
import ConfirmDialog from '../toast/ConfirmDialog';

export const ListClienteComponent = () => {

    // 💡 NUEVO ESTADO: Mapa para almacenar el estatus de usuario (idUsuario => estatus)
    const [userEstatusMap, setUserEstatusMap] = useState(new Map());

    //Extraer el parámetro de la URL (las banderas para saber la acción a realizar)
    const { flag } = useParams();
    const targetFlag = parseInt(flag, 10);

    const navegar = useNavigate();
    const location = useLocation();

    //Extraer datos del state (necesarios para el Flujo 3)
    const { idReserva: idReservaContext, idEmpleado: idEmpleadoContext } = location.state || {};

    //Referencia para el Toast
    const toastRef = useRef(null);

    // 2. Referencia para el ConfirmDialog
    const confirmRef = useRef(null);

    //Estados para manejar los datos y el filtro
    const [clientes, setClientes] = useState([])
    const [searchTerm, setSearchTerm] = useState('')

    const [isFiltered, setIsFiltered] = useState(false)

    //Carega inicial de datos
    useEffect(() => {
        window.scrollTo(0, 0);
        getAllCliente();
    }, [])

    //Useeffect para el toast
    useEffect(() => {

        if (location.state && location.state.toastMessage && toastRef.current) {

            const { toastMessage, toastType } = location.state;


            const idReservaTemp = location.state.idReserva;
            const idEmpleadoTemp = location.state.idEmpleado;

            toastRef.current.show(toastMessage, toastType || 'success', 3000);


            navegar(location.pathname, {
                replace: true,
                state: {
                    idReserva: idReservaTemp,
                    idEmpleado: idEmpleadoTemp
                }
            });
        }

    }, [location.state, location.pathname, navegar]);


    //FUNCIÓN TOGGLE (similar a la de Empleado)
    function toggleEstatusUsuario(idUsuario, currentEstatus) {
        if (idUsuario === 0) return;

        const accion = currentEstatus === 1 ? 'desactivar' : 'activar';

        // 3. Reemplazo de window.confirm con ConfirmDialog
        const message = `¿Está seguro de ${accion} a este cliente?`;

        confirmRef.current.show(message, () => {
            // Este bloque se ejecuta SÓLO si el usuario presiona "Aceptar"

            toggleUserEstatus(idUsuario).then(response => {
                const nuevoEstatus = response.data.estatus;
                const mensaje = `Usuario ${nuevoEstatus === 1 ? 'activado' : 'desactivado'} correctamente.`;

                if (toastRef.current) {
                    toastRef.current.show(mensaje, nuevoEstatus === 1 ? 'success' : 'danger', 3000);
                }

                //Actualizar el mapa local después de la operación exitosa
                setUserEstatusMap(prevMap => {
                    const newMap = new Map(prevMap);
                    newMap.set(idUsuario, nuevoEstatus);
                    return newMap;
                });

            }).catch(error => {
                console.error("Error al alternar estatus del usuario:", error);
                // Cambiamos el alert simple por un Toast
                if (toastRef.current) {
                    toastRef.current.show("Error al cambiar el estatus del usuario. Consulte la consola.", 'error', 5000);
                }
            });
        });

    }

    // Renombramos para que siempre use la función de servicio que obtiene el listado
    function getAllCliente() {
        listClientes().then((response) => {
            const clientesData = response.data;
            setClientes(clientesData);

            // NUEVA LÓGICA DE CARGA DE ESTATUS DE USUARIO
            const userPromises = clientesData
                .filter(c => c.idUsuario && c.idUsuario > 0)
                .map(c => getUsuarioById(c.idUsuario));

            Promise.allSettled(userPromises).then(results => {
                const estatusMap = new Map();
                results.forEach(result => {
                    if (result.status === "fulfilled" && result.value.data) {
                        const usuario = result.value.data;
                        estatusMap.set(usuario.id, usuario.estatus);
                    }
                });
                setUserEstatusMap(estatusMap);
            }).catch(error => console.error("Error al cargar estatus de usuarios:", error));
            // 🟢 FIN DE LA NUEVA LÓGICA

        }).catch(error => {
            console.error("Error al obtener la lista de clientes:", error);
        })
    }

    // Función que se dispara al cambiar el input de búsqueda
    const handleSearchTermChange = (e) => {
        setSearchTerm(e.target.value);
    };

    //Filtrado: AHORA LLAMA AL BACKEND
    function handleSearch() {
        const nombreFiltro = searchTerm.trim();

        if (nombreFiltro) {
            // Caso 1: Hay un término de búsqueda. Ejecuta el filtro.
            setIsFiltered(true); // La tabla es el resultado de un filtro

            buscaClientesByName(nombreFiltro).then((response) => {
                const clientesData = response.data;
                setClientes(clientesData);

                //RECARGAR ESTATUS DE USUARIOS después del filtro
                const userPromises = clientesData
                    .filter(c => c.idUsuario && c.idUsuario > 0)
                    .map(c => getUsuarioById(c.idUsuario));

                Promise.allSettled(userPromises).then(results => {
                    const estatusMap = new Map();
                    results.forEach(result => {
                        if (result.status === "fulfilled" && result.value.data) {
                            const usuario = result.value.data;
                            estatusMap.set(usuario.id, usuario.estatus);
                        }
                    });
                    setUserEstatusMap(estatusMap);
                });
                // FIN RECARGAR ESTATUS

            }).catch(error => {
                console.error("Error al buscar clientes por nombre:", error);
                setClientes([]); // En caso de error, limpia o muestra un error.
            });
        } else {
            //Caso 2: Campo vacío. Vuelve a cargar la lista completa.
            setIsFiltered(false); //No hay filtro activo
            getAllCliente();
        }
    }

    //Ejecutar búsqueda al presionar "Enter" en el input
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    //Reinicio
    function reiniciarBusqueda() {
        setSearchTerm('');
        setIsFiltered(false);
        getAllCliente(); // Llama a la carga inicial, que trae todos.
    }


    function actualizaCliente(id) {
        navegar(`/cliente/edita/${id}`)
    }

    // La función eliminarCliente ya no se utiliza en el botón, pero la dejo por si es necesaria en otro lado.
    function eliminarCliente(id) {
        console.log(`Intentando eliminar cliente ID: ${id}`);
        deleteCliente(id).then((response) => {
            getAllCliente();
            if (toastRef.current) {
                toastRef.current.show('Cliente eliminado correctamente.', 'danger', 3000);
            }
        }).catch(error => {
            console.error(error);
        })
    }


    function crearCliente() {
        navegar(`/cliente/crear`)
    }


    function elegirCliente(idCliente, idClienteContexto = null) {

        const idAUtilizar = idClienteContexto || idCliente;

        if (targetFlag === 1) {
            //Flujo 1: Reservación nueva
            navegar(`/reserva/nueva/${idAUtilizar}`);
            console.log(`Cliente elegido (ID: ${idAUtilizar}). Navegando a /reserva/nueva/${idAUtilizar}...`);

        } else if (targetFlag === 2) {
            //Flujo 2: Venta Directa (debe elegir empleado primero)
            //El 0 es un placeholder para idreserva
            navegar(`/empleado/lista/2/0/${idAUtilizar}`);
            console.log(`Cliente elegido (ID: ${idAUtilizar}). Navegando a ListEmpleado para Venta Directa...`);

        } else if (targetFlag === 3) {
            //Flujo 3: Nueva venta para pedido existente (mantiene idReserva e idEmpleado)
            const idR = idReservaContext;
            const idE = idEmpleadoContext;

            if (idR && idE) {
                console.log(`Cliente ID: ${idAUtilizar} elegido. Navegando a Venta/Productos con RESERVA ID: ${idR} y EMPLEADO ID: ${idE}`);
                //La flag es 1 porque esta nueva venta es a partir de una Reserva
                navegar(`/venta/productos/${idAUtilizar}/1/${idR}/${idE}`);
            } else {
                console.log(`Error: Faltan IDs de contexto (Reserva/Empleado) para el Flujo 3. Volviendo a la lista de clientes sin contexto.`);

                navegar(`/clientes`);
            }
        }
    }

    function pagTitulo() {
        if (targetFlag === 1) {
            return <h2 className="text-center mb-4"> Seleccionar el cliente que hará la reservación </h2>
        } else if (targetFlag === 2) {
            return <h2 className="text-center mb-4"> Seleccionar el cliente que hará la venta </h2>
        } else if (targetFlag === 3) {
            return <h2 className="text-center mb-4"> Seleccione el cliente que hará la nueva venta </h2>
        } else {
            return <h2 className="text-center mb-4"> Lista de clientes </h2>
        }
    }

    //Función para el botón "Mismo cliente" (Flujo 3)
    const manejarMismoCliente = async () => {

        if (!idReservaContext || !idEmpleadoContext) {
            console.log("Error: Faltan IDs de contexto (Reserva/Empleado) para el Flujo 3.");
            alert("Error de Flujo 3: Falta información de Reserva/Empleado.");
            return;
        }

        try {
            //1. Consultar la reserva usando idReservaContext
            const response = await getReservacion(idReservaContext);
            const idClienteDeReserva = response.data.idCliente;

            if (idClienteDeReserva) {
                //2. Usar el idCliente obtenido para continuar el flujo
                elegirCliente(null, idClienteDeReserva);
            } else {
                console.log("Error: La reserva no contiene un idCliente válido.");
                alert("Error: La reserva no contiene un idCliente válido.");
            }

        } catch (error) {
            console.error("Error al obtener la Reserva para el Flujo 3:", error);
            alert("Error al intentar obtener los datos de la reserva.");
        }
    };


    // 🟢 NUEVA FUNCIÓN AUXILIAR
    const getBotonAccionUsuario = (idUsuario) => {
        if (idUsuario === 0) {
            // El cliente no tiene un usuario asociado
            return { texto: 'Sin usuario', clase: 'btn-secondary', handler: null };
        }

        const estatus = userEstatusMap.get(idUsuario);

        if (estatus === 1) {
            // Usuario Activo (Opción: Desactivar)
            return { texto: 'Desactivar', clase: 'btn-danger', handler: () => toggleEstatusUsuario(idUsuario, 1) };
        } else if (estatus === 0) {
            // Usuario Inactivo (Opción: Activar)
            return { texto: 'Activar', clase: 'btn-success', handler: () => toggleEstatusUsuario(idUsuario, 0) };
        }

        // Mientras se carga la información de la API (estatus es 'undefined')
        return { texto: 'Cargando...', clase: 'btn-warning', handler: null };
    }

    //Confirmar atributos con consola truquera
    console.log("Clientes mostrados: ", JSON.stringify(clientes, null, 2));
    console.log(`Contexto Flujo 3 - idReserva: ${idReservaContext}, idEmpleado: ${idEmpleadoContext}`);

    return (
        <div className="container-fluid p-4">


            <ToastNotification ref={toastRef} />
            {/* 4. Renderizar el ConfirmDialog */}
            <ConfirmDialog ref={confirmRef} />

            {pagTitulo()}

            {/* NUEVO DISEÑO DEL FILTRO */}
            <div className="row justify-content-center mb-3">
                <div className="col-md-8 col-lg-8">
                    <div className="row g-2 align-items-center">
                        {/* Campo de búsqueda por Nombre */}
                        <div className="col-md-7">
                            <input
                                type="text"
                                placeholder="Buscar cliente por nombre..."
                                className="form-control form-control-lg inpufiltros"
                                value={searchTerm}
                                onChange={handleSearchTermChange}
                                onKeyDown={handleKeyPress}
                            />
                        </div>

                        {/* Botones de Buscar y Reiniciar */}
                        <div className="col-md-5 d-flex">
                            <button
                                className='btn btn-primary btn-lg flex-grow-1 me-2 btn-busca-b'
                                onClick={handleSearch}
                            >
                                Buscar
                            </button>
                            <button
                                className={`btn btn-secondary btn-lg btn-reinicia-b ${isFiltered ? '' : 'd-none'}`}
                                onClick={reiniciarBusqueda}
                            >
                                Reiniciar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* FIN DEL NUEVO DISEÑO DEL FILTRO */}

            <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap">


                {targetFlag === 3 ? (
                    <button
                        className='btn btn-primary btn-princi me-auto'
                        onClick={manejarMismoCliente}
                        disabled={!idReservaContext || !idEmpleadoContext}
                    >
                        Mismo cliente
                    </button>
                ) : (
                    <div className='invisible me-auto' style={{ width: '10px' }}></div>
                )}


                {targetFlag === 0 && (

                    <button className='btn btn-info btn-princi' onClick={() => crearCliente()}>Nuevo cliente</button>

                )}


                <div className='invisible ms-auto' style={{ width: '10px' }}></div>
            </div>

            <div className="table-responsive">
                <table className="table table-striped table-hover table-bordered">

                    <thead className='tableHeaderStyle'>
                        <tr>
                            <th>Id Cliente</th>
                            <th>Nombre cliente</th>
                            <th>Número cliente</th>
                            <th>Correo cliente</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {clientes.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center text-muted">No se encontraron clientes que coincidan con la búsqueda.</td>
                            </tr>) : (clientes.map(cliente => { // USAMOS EL BLOQUE DE FUNCIÓN

                                // Declaramos la constante localmente
                                const botonConfig = getBotonAccionUsuario(cliente.idUsuario);

                                // Retornamos el JSX
                                return (
                                    <tr key={cliente.idcliente}>
                                        <td>{cliente.idcliente}</td>
                                        <td>{cliente.nombrecliente}</td>
                                        <td>{cliente.telefono}</td>
                                        <td>{cliente.correo}</td>
                                        <td>


                                            {(targetFlag === 1 || targetFlag === 2 || targetFlag === 3) ? (

                                                <button
                                                    className='btn btn-success'
                                                    onClick={() => elegirCliente(cliente.idcliente)}
                                                >
                                                    Elegir
                                                </button>
                                            ) : (

                                                <>
                                                    <button className='btn btn-edicion' onClick={() => actualizaCliente(cliente.idcliente)}>Actualizar</button>

                                                    {/* NUEVO BOTÓN: Activar/Desactivar */}
                                                    <button
                                                        className={`btn ${botonConfig.clase} sepaizq`}
                                                        onClick={botonConfig.handler}
                                                        disabled={botonConfig.handler === null} // Deshabilitar si es 'Sin usuario' o 'Cargando'
                                                    >
                                                        {botonConfig.texto}
                                                    </button>
                                                </>
                                            )}
                                        </td>

                                    </tr>
                                )
                            }))} {/* CIERRE DEL MAP Y DE LA EXPRESIÓN */}

                    </tbody>
                </table>
            </div>


        </div>
    )
}