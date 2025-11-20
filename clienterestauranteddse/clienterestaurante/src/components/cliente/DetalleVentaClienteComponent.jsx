import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
// Se eliminan 'crearCliente' y 'updateCliente' ya que no son necesarias
import { getCliente } from '../../services/ClienteService';

// Se mantiene 'getVenta', 'listVentas', 'descargarTicketPDF', 'getDetalleCompletoVenta'
import { listVentas, descargarTicketPDF, getDetalleCompletoVenta } from '../../services/VentaService';


// Renombramos la exportación al nombre del archivo/solicitud
export const DetalleVentaClienteComponent = () => {
    //Constantes
    const navegar = useNavigate();
    const { tipo, id } = useParams();

    //------------------- Estados -------------------
    const [venta, setVenta] = useState(null);
    const [productosDetalle, setProductosDetalle] = useState([]);
    const [clienteNombre, setClienteNombre] = useState('Cargando...');
    const [empleadoAtiende, setEmpleadoAtiende] = useState(null);
    const [reservacion, setReservacion] = useState(null);
    const [mesaInfo, setMesaInfo] = useState(null);

    const [cargandoPdf, setCargandoPdf] = useState(false);

    //Estado de visibilidad de Reserva
    const [tieneReservacion, setTieneReservacion] = useState(false);

    //Estados para la selección de la venta cuando hay muchas en un pedido
    const [ventasAsociadas, setVentasAsociadas] = useState([]);
    const [idVentaSeleccionada, setIdVentaSeleccionada] = useState(null);
    // Se elimina puestosMap ya que se considera resuelto por el backend
    // const [puestosMap, setPuestosMap] = useState(new Map()); 
    const [idReservaActual, setIdReservaActual] = useState(null);


    const idNum = parseInt(id, 10);

    const [error, setError] = useState(null);


    //Función para cargar los detalles específicos de una venta
    function cargarDetallesVentaEspecifica(idVenta) {
        setVenta(null);
        setProductosDetalle([]);
        setClienteNombre('Cargando...');
        setEmpleadoAtiende(null);
        setReservacion(null); // Importante resetear la reserva también

        // 1. Obtener el Detalle de Venta Completo con una sola llamada
        return getDetalleCompletoVenta(idVenta)
            .then(res => {
                const ventaCompleta = res.data;

                // 2. Establecer estados usando la data consolidada
                setVenta(ventaCompleta);

                // Asumiendo que el campo correcto para el nombre completo en clienteInfo es 'nombrecliente'
                setClienteNombre(ventaCompleta.clienteInfo?.nombrecliente || 'N/A');

                // El backend ya consolidó el empleado, su nombre y puesto.
                setEmpleadoAtiende(ventaCompleta.empleadoAtiende);

                // El backend ya resolvió los productos
                setProductosDetalle(ventaCompleta.productosVendidos || []);

                // El backend ya resolvió la reserva (si existe)
                const tieneReserva = ventaCompleta.idReserva !== null;
                setTieneReservacion(tieneReserva);

                if (tieneReserva) {
                    // La información de la mesa y reserva ya viene anidada en reservaInfo
                    setReservacion({
                        fecha: ventaCompleta.reservaInfo.fechaReserva,
                        hora: ventaCompleta.reservaInfo.horaReserva
                    });
                    setMesaInfo({
                        idMesa: ventaCompleta.reservaInfo.idMesa,
                        numero: ventaCompleta.reservaInfo.numeroMesa,
                        capacidad: ventaCompleta.reservaInfo.capacidadMesa,
                        ubicacion: ventaCompleta.reservaInfo.ubicacion
                    });
                    setIdReservaActual(ventaCompleta.idReserva);
                } else {
                    setReservacion(null);
                    setMesaInfo(null);
                    setIdReservaActual(null);
                }
            })
            .catch(e => {
                console.error(`Error al cargar detalles de la Venta ID ${idVenta}:`, e);
                setError(`Error al cargar la venta seleccionada. ${e instanceof Error ? e.message : e}`);
            });
    }

    function obtenerNombreCliente(idCliente) {
        if (!idCliente) {
            return Promise.resolve(`Cliente no asociado`);
        }

        return getCliente(idCliente)
            .then(clienteRes => {
                // Asegúrate que el JSON de getCliente tenga 'nombrecliente' y 'apellidocliente'
                return `${clienteRes.data.nombrecliente} ${clienteRes.data.apellidocliente || ''}`;
            })
            .catch(() => {
                // Se oculta el ID en el mensaje de error para la vista del cliente.
                return `(No encontrado)`;
            });
    }

    //Función principal de carga (ahora carga el contexto inicial y la primera venta)
    function cargarContextoInicial() {
        setError(null);
        setVentasAsociadas([]);
        setIdVentaSeleccionada(null);
        setTieneReservacion(false);
        setReservacion(null);
        setMesaInfo(null);

        let idVentaInicial = null;
        let idReservaCargada = null;


        // Simulamos un Promise.resolve() para el flujo de la promesa
        Promise.resolve()
            .then(() => {
                if (tipo === 'reserva') {
                    if (isNaN(idNum)) { setError("ID de Reserva inválido."); return Promise.reject("ID de Reserva inválido."); }
                    idReservaCargada = idNum;
                    setIdReservaActual(idReservaCargada);
                    setTieneReservacion(true);

                    // TODO: Esta parte depende del endpoint /api/reservas/{idReserva}/ventas-asociadas
                    // Por ahora, mantenemos la lógica antigua usando listVentas() + filtro + obtenerNombreCliente()
                    const pVentasAsociadas = listVentas().then(ventasRes => {
                        const ventasDeReserva = ventasRes.data.filter(v => v.idReserva == idReservaCargada);

                        if (ventasDeReserva.length === 0) {
                            return Promise.reject(`Error: No se encontró ninguna Venta asociada a la Reserva ID ${idReservaCargada}.`);
                        }


                        const promesasClientes = ventasDeReserva.map(venta =>
                            obtenerNombreCliente(venta.idCliente).then(nombre => ({
                                idVenta: venta.idventa,
                                // Modificado: Usar el nombre del cliente en el display
                                nombreClienteDisplay: `Venta del cliente ${nombre}`
                            }))
                        );

                        return Promise.all(promesasClientes).then(ventasConClientes => {
                            setVentasAsociadas(ventasConClientes);
                            idVentaInicial = ventasConClientes[0].idVenta;
                            setIdVentaSeleccionada(idVentaInicial);
                        });
                    });

                    return pVentasAsociadas;
                } else if (tipo === 'venta') {
                    if (isNaN(idNum)) { setError("ID de Venta inválido."); return Promise.reject("ID de Venta inválido."); }
                    idVentaInicial = idNum;
                    setIdVentaSeleccionada(idVentaInicial);
                    return Promise.resolve();
                } else {
                    setError(`Tipo de detalle (${tipo}) no reconocido.`);
                    return Promise.reject(`Tipo de detalle (${tipo}) no reconocido.`);
                }
            })
            .then(() => {
                // Ahora que tenemos el idVentaInicial, cargamos los detalles de la venta
                if (idVentaInicial) {
                    return cargarDetallesVentaEspecifica(idVentaInicial);
                }
            })
            .catch(err => {
                console.error("Error crítico en la carga de detalles:", err);
                setError(`Error: No se pudo cargar el detalle. ${err instanceof Error ? err.message : err}`);
            });
    }


    //Handler para el cambio de select
    function handleVentaSelectChange(event) {
        const newIdVenta = parseInt(event.target.value, 10);
        if (!isNaN(newIdVenta)) {
            setIdVentaSeleccionada(newIdVenta);
        }
    }


    // ------------------- Lógica de Descarga de Ticket PDF -------------------
    async function descargarTicketPDFHandler(idVenta) {
        if (!idVenta) {
            console.error("ID de venta no definido.");
            alert("No hay una venta seleccionada para descargar el ticket.");
            return;
        }

        setCargandoPdf(true); // Inicia el estado de carga
        setError(null);

        try {
            const response = await descargarTicketPDF(idVenta);
            const blob = response.data; // response.data es el Blob de Axios

            // 1. Crea un objeto URL para el Blob
            const url = window.URL.createObjectURL(blob);

            // 2. Crea un link temporal para forzar la descarga
            const a = document.createElement('a');
            a.href = url;
            a.download = `Ticket_Venta_${idVenta}.pdf`;
            document.body.appendChild(a);
            a.click();

            // 3. Limpieza
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (e) {
            console.error("Error al descargar el PDF:", e);
            setError(`Error al descargar el ticket. Asegúrate que la venta ID ${idVenta} existe: ${e.message}`);
        } finally {
            setCargandoPdf(false); // Finaliza el estado de carga
        }
    }
    // ------------------------------------------------------------------------


    useEffect(() => {
        window.scrollTo(0, 0);
        cargarContextoInicial();
    }, [tipo, id]);

    useEffect(() => {
        if (idVentaSeleccionada !== null) {
            cargarDetallesVentaEspecifica(idVentaSeleccionada)
                .catch(err => {
                    console.error("Error al recargar detalles de venta por cambio de selección:", err);
                    setError(`Error al cargar detalles de la Venta ${idVentaSeleccionada}: ${err.message || err}`);
                });
        }
    }, [idVentaSeleccionada]);


    //------------------- Lógica de Navegación -------------------
    function navegaVolver() {
        // Asumiendo que esta es la versión del cliente, podría volver a su lista de compras/reservas
        if (tipo === 'venta') {
            navegar('/clientevista/susventas'); // RUTA DE EJEMPLO
        } else {
            navegar('/clientevista/susreservas'); // RUTA DE EJEMPLO
        }
    }


    //El html

    if (error) {
        return <div className="container p-4"><div className="alert alert-danger">{error}</div></div>;
    }

    const totalVenta = venta?.totalventa || 0;
    const fechaVenta = venta?.fechaventa || 'N/A';

    // Usamos esta clase solo para el diseño ya que siempre es 6/12 si hay reserva.
    // Si queremos que ocupe todo el ancho cuando no hay reserva, la lógica debe ser diferente
    // La ajustamos: Si tiene reserva, es 6. Si no, es 12 (sin necesidad de "mx-auto" aquí)
    const empleadoColClass = tieneReservacion ? "col-md-6 mb-2" : "col-md-6 mb-2";

    const botonTicketDisabled = cargandoPdf || !idVentaSeleccionada;

    return (
        <div className="container p-2">
            <h3 className="text-center mb-2">Detalle de tu {tipo === 'reserva' ? 'Reservación y Venta' : 'Compra'}</h3>

            {/* SELECT PARA VENTAS ASOCIADAS A LA RESERVA */}
            {tipo === 'reserva' && ventasAsociadas.length > 1 && (
                <div className='col-md-9 mb-2 mx-auto'>
                    <div className="card shadow cardregularpad-menor">
                        <div className="card-body">
                            <div className="row align-items-center">
                                {/* Columna del Select */}
                                <div className="col-md-8">
                                    <div className="form-group">
                                        <label htmlFor="ventaSelect" className="form-label fw-bold">Esta reservación tuvo varias ventas, selecciona la que desea ver</label>
                                        <select
                                            id="ventaSelect"
                                            className="form-select inpufiltros"
                                            value={idVentaSeleccionada || ''}
                                            onChange={handleVentaSelectChange}
                                        >
                                            {ventasAsociadas.map(ventaAsoc => (
                                                <option
                                                    key={ventaAsoc.idVenta}
                                                    value={ventaAsoc.idVenta}
                                                >
                                                    {ventaAsoc.nombreClienteDisplay}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {/* Columna del Botón Descargar Ticket */}
                                <div className="col-md-4 d-grid gap-2 mt-md-0 mt-3">

                                    <button
                                        className='btn btn-success'
                                        onClick={() => descargarTicketPDFHandler(idVentaSeleccionada)} // <-- Handler
                                        disabled={botonTicketDisabled}
                                    >
                                        {cargandoPdf ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Cargando Ticket...
                                            </>
                                        ) : (
                                            'Descargar Ticket PDF'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* FIN SELECT */}

            {/*Atender y reserva */}
            <div className="row mb-0 d-flex justify-content-center">

                {/* MODIFICADO: Empleado Atiende. SE ELIMINA EL CAMPO ID EMPLEADO. */}
                <div className={empleadoColClass}>
                    <div className="card cardregularpad h-100 shadow-sm border-warning cardregularpad-menor inputsdetaventa">
                        <div className="card-header bg-warning text-card-title-black text-center titucardsdv">
                            Atiende
                        </div>

                        <div className="card-body cardregularpad-menor">
                            {/* ELIMINADO: Campo ID Empleado */}

                            <div className="d-flex align-items-center mb-2">
                                <label className="form-label fw-bold mb-0 me-2 text-end w-50" style={{ maxWidth: '120px' }}>
                                    Empleado:
                                </label>
                                <input
                                    type="text"
                                    className="form-control w-50 text-start"
                                    value={empleadoAtiende?.nombre || 'N/A'}
                                    disabled
                                />
                            </div>


                            <div className="d-flex align-items-center">
                                <label className="form-label fw-bold mb-0 me-2 text-end w-50" style={{ maxWidth: '120px' }}>
                                    Puesto:
                                </label>
                                <input
                                    type="text"
                                    className="form-control w-50 text-start"
                                    value={empleadoAtiende?.puesto || 'Cargando/No Atendido'}
                                    disabled
                                />
                            </div>

                        </div>
                    </div>
                </div>


                {tieneReservacion && (
                    <div className="col-md-6 mb-2">
                        <div className="card cardregularpad h-100 shadow-sm border-info cardregularpad-menor inputsdetaventa">
                            <div className="card-header bg-info text-card-title-white text-center titucardsdv">
                                Reservación
                            </div>

                            <div className="card-body cardregularpad-menor">


                                <div className="d-flex align-items-center mb-2">
                                    <label className="form-label fw-bold mb-0 me-2 text-end w-50" style={{ maxWidth: '120px' }}>
                                        Número de mesa:
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control w-25 text-center"
                                        value={mesaInfo?.numero || 'N/A'}
                                        disabled
                                    />
                                </div>


                                <div className="d-flex align-items-center mb-2">
                                    <label className="form-label fw-bold mb-0 me-2 text-end w-50" style={{ maxWidth: '120px' }}>
                                        Capacidad:
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control w-50 text-start"
                                        value={mesaInfo?.capacidad ? `${mesaInfo.capacidad} personas` : 'N/A'}
                                        disabled
                                    />
                                </div>

                                <div className="d-flex align-items-center mb-1">
                                    <div className="d-flex align-items-center mb-1">
                                        <label className="form-label fw-bold mb-0 me-2 text-end w-50" style={{ maxWidth: '120px' }}>
                                            Fecha:
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control w-50 text-start"
                                            value={reservacion?.fecha || 'N/A'}
                                            disabled
                                        />
                                    </div>


                                    <div className="d-flex align-items-center">
                                        <label className="form-label fw-bold mb-0 me-2 text-end w-50" style={{ maxWidth: '120px' }}>
                                            Hora:
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control w-50 text-start"
                                            value={reservacion?.hora || 'N/A'}
                                            disabled
                                        />
                                    </div>
                                </div>


                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Fin de atender y reserva */}

            {/* NUEVA FILA: Datos Generales (4/12) y Productos Vendidos (8/12) */}
            <div className='col-md-12 mb-2 mx-auto'>
                <div className="row">

                    {/* COLUMNA 1: Datos generales de la venta (4/12) */}
                    <div className='col-md-4 mb-3 maxihh'>
                        <div className="card shadow h-100 cardregularpad-menor inputsdetaventa">
                            <div className="card-header bg-carrito-compra titucardsdv">
                                Datos generales de la venta
                            </div>
                            <div className="card-body cardregularpad-menor">
                                <div className="row mb-3">
                                    {/* MODIFICADO: SE ELIMINAN AMBOS CAMPOS PARA USAR EL ESPACIO COMPLETO */}
                                    <div className="col-md-12 d-flex justify-content-start">
                                        <div className="w-75 mx-auto">
                                            {/* ELIMINADO: Campo ID Cliente */}

                                            <label className="form-label fw-bold text-start">Cliente:</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={clienteNombre}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="row mb-1">
                                    <div className="col-md-12 d-flex justify-content-start">
                                        <div className="w-75 mx-auto">
                                            <label className="form-label fw-bold text-start">Fecha Venta:</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={fechaVenta}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* COLUMNA 2: Productos vendidos (8/12) */}
                    <div className='col-md-8 mb-1'>
                        <div className="card cardregularpad shadow h-100 cardregularpad-menor carddetalleventa">
                            <div className="card-header bg-carrito-compra titucardsdv">
                                Productos vendidos
                            </div>
                            <div className="card-body p-0 cardregularpad-menor">
                                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <table className="table table-striped table-hover mb-0">
                                        <thead className="sticky-top bg-light">
                                            <tr>
                                                <th>#</th>
                                                <th>Producto</th>
                                                <th>Precio unitario</th>
                                                <th>Cantidad</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productosDetalle.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="text-center text-muted">No se encontraron productos para esta venta.</td>
                                                </tr>
                                            ) : (
                                                productosDetalle.map((item, index) => (
                                                    <tr key={item.idProducto}>
                                                        <td>{index + 1}</td>
                                                        <td>{item.nombreProducto}</td>
                                                        <td>${item.precioUnitario.toFixed(2)}</td>
                                                        <td>{item.cantidad}</td>
                                                        <td>${(item.subtotal).toFixed(2)}</td>
                                                    </tr>
                                                ))
                                            )}
                                            <tr>
                                                <td><h5 className="mb-0">Total:</h5></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td><h5 className="text-success mb-0">${totalVenta.toFixed(2)}</h5></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                </div> {/* Fin Row */}

            </div>
            {/* Fin Contenedor principal */}

            {/* Botón de Descargar Ticket debajo del detalle de venta */}
            {!(tipo === 'reserva' && ventasAsociadas.length > 1) && (
                <div className='col-md-9 mb-4 mx-auto'>
                    <button
                        className='btn btn-success btn-lg w-100'
                        onClick={() => descargarTicketPDFHandler(idVentaSeleccionada)} // <-- Handler
                        disabled={botonTicketDisabled}
                    >
                        {cargandoPdf ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Cargando Ticket...
                            </>
                        ) : (
                            'Descargar Ticket PDF'
                        )}
                    </button>
                </div>
            )}
            {/* ----- */}
            <div className="col-md-9 mb-0 mx-auto">
                <button
                    className='btn btn-princi btn-lg'
                    onClick={navegaVolver}
                >
                    Volver
                </button>
            </div>

        </div>
    );
};