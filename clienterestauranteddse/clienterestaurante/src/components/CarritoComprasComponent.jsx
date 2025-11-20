import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { crearVenta } from '../services/VentaService'; 
import { crearAtender } from '../services/AtenderService';
import { updateReservacion, getReservacion } from '../services/ReservarService'; 


import 'bootstrap/dist/css/bootstrap.min.css';

export const CarritoComprasComponent = () => {
    
    //--------------------Obtención de los parametos de la URL--------------------
    const location = useLocation();
    const navegar = useNavigate();
    
    //estatusFlag: 0 (Venta Base), 1 (Venta con Reserva), 2 (Venta Directa)
    const { idcliente, flag, idreserva, idempleado } = useParams();

    const idClienteNum = parseInt(idcliente, 10);
    const estatusFlag = parseInt(flag, 10) || 0; 
    //idreserva solo es relevante para Flag 1
    const idReservaNum = estatusFlag === 1 ? parseInt(idreserva, 10) : null;
    //idempleado es relevante para Flag 1 y 2
    const idEmpleadoNum = (estatusFlag === 1 || estatusFlag === 2) ? parseInt(idempleado, 10) : null;

    //Estado principal del carrito
    const [carritoItems, setCarritoItems] = useState(location.state?.carritoItems || []);
    const [total, setTotal] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false); // Estado para evitar doble click

    //useEffect para calcular el total
    useEffect(() => {
        const nuevoTotal = carritoItems.reduce((acc, item) => 
            acc + (item.precioUnitario * item.cantidad)
        , 0);
        setTotal(nuevoTotal);
    }, [carritoItems]);

    //Función para mostrar mensajes de forma no bloqueante (temporal, idealmente usar un Modal)
    const showFlowAlert = (message) => {
        //NOTA: Reemplazar 'alert' por un componente Modal o Toast no bloqueante.
        console.warn(`[ALERTA DE FLUJO]: ${message}`);
        alert(message);
    };

    //------------------- Lógica de Interacción con la Tabla -------------------

    function cambiarCarritoCant(index, nuevaCantidadStr) {
        const nuevaCantidad = parseInt(nuevaCantidadStr);
        if (isNaN(nuevaCantidad) || nuevaCantidad < 1) return;

        setCarritoItems(prevItems => {
            const nuevosItems = [...prevItems];
            nuevosItems[index].cantidad = nuevaCantidad;
            return nuevosItems;
        });
    };

    
    function quitarProductoCarrito(index) {
        setCarritoItems(prevItems => {
            const nuevosItems = prevItems.filter((_, i) => i !== index);
            return nuevosItems;
        });
    };
    
    //------------------- Lógica de navegación y acciones finales -------------------
    
    function seguirComprando() {

        let ruta = `/venta/productos/${idcliente}`;
        
        if (estatusFlag === 1 || estatusFlag === 2) {
            
            //Si hay flag, reserva o empleado, mantenemos el contexto de la ruta
            ruta = `/venta/productos/${idcliente}/${estatusFlag}/${idreserva}/${idempleado}`;
        }
        
        //Le pasa también el carrito para que no se pierda
        navegar(ruta, { state: { carritoItems: carritoItems } });
    };


    function cancelarVenta() {
     
            setCarritoItems([]); 
            if (estatusFlag===2){
                navegar('/venta/lista');
            }else{
                navegar('/reserva/lista/0');
            }
            
    };

  
    async function confirmarYCerrarPedido() {
        if (carritoItems.length === 0) {
            showFlowAlert("El carrito está vacío. Agregue productos para confirmar la venta.");
            return;
        }
        
        if (isProcessing) return;
        setIsProcessing(true);

        const productosVenta = carritoItems.map(item => ({
            idProducto: item.idProducto, 
            cantidad: item.cantidad
        }));

        const ventaRequest = {
            idCliente: idClienteNum,
            productos: productosVenta,
            idReserva: idReservaNum
        };
        
        let idVentaCreada = null;

        try {
            //1. Insertar la venta
            const ventaResponse = await crearVenta(ventaRequest);
            idVentaCreada = ventaResponse.data.idventa;
            console.log(`Venta #${idVentaCreada} registrada con éxito.`);

            //2. Se inserta quien la atiende (Atender)
            const atenderRequest = {
                idEmpleado: idEmpleadoNum,
                idVenta: idVentaCreada
            };
            await crearAtender(atenderRequest);
            console.log("Atender registrado con éxito.");

            //3. Obtener y actualizar la reserva (CERRAR PEDIDO)
            const reservaResponse = await getReservacion(idReservaNum);
            let reservaUpdateDto = reservaResponse.data;

            reservaUpdateDto = adjustReservaDateAndTime(reservaUpdateDto); 
            console.log(`Reserva DTO corregido: Fecha: ${reservaUpdateDto.fecha}, Hora: ${reservaUpdateDto.hora}`);

            //reservaUpdateDto = adjustReservaDateAndTime(reservaUpdateDto); 
            
            //Modificar estatus a 1 (Reservación Atendida / Cerrada)
            reservaUpdateDto.estatus = 1; 

            await updateReservacion(idReservaNum, reservaUpdateDto);
            console.log("Reserva actualizada (cerrada) con éxito.");

            //Navegación final
            const successMessage = `Venta con reserva registrada y pedido cerrado con éxito.`;
            navegar('/reserva/lista/1', { state: { toastMessage: successMessage, toastType: 'success' } });

        } catch (error) {
            console.error("Error al procesar Confirmar y cerrar pedido:", error.response ? error.response.data : error.message);
            showFlowAlert("Error al registrar la Venta o al cerrar el pedido. Consulte la consola para más detalles.");
        } finally {
            setIsProcessing(false);
        }
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

    //Antes de hacerlo como CRIS:
    // async function agregarVentaYContinuar() {
    //      if (carritoItems.length === 0) {
    //         showFlowAlert("El carrito está vacío. Agregue productos para continuar.");
    //         return;
    //     }

    //     if (isProcessing) return;
    //     setIsProcessing(true);

    //     const productosVenta = carritoItems.map(item => ({
    //         idProducto: item.idProducto, 
    //         cantidad: item.cantidad
    //     }));

    //     const ventaRequest = {
    //         idCliente: idClienteNum,
    //         productos: productosVenta,
    //         idReserva: idReservaNum //Se incluye el ID de la reserva para asociarla
    //     };
        
    //     let idVentaCreada = null;

    //     try {
    //         //1. Insertar la venta
    //         const ventaResponse = await crearVenta(ventaRequest);
    //         idVentaCreada = ventaResponse.data.idventa;
    //         console.log(`Venta #${idVentaCreada} registrada con éxito.`);

    //         //2. Se inserta quien la atiende (Atender)
    //         const atenderRequest = {
    //             idEmpleado: idEmpleadoNum,
    //             idVenta: idVentaCreada
    //         };
    //         await crearAtender(atenderRequest);
    //         console.log("Atender registrado con éxito.");
            
    //         //3. Navegación: Vamos a la elección de cliente con flag 3 y contexto
    //         const message = `Venta con ID #${idVentaCreada} realizada, elija de quién será la nueva venta.`;
            
    //         //Navegamos a la lista de clientes con flag 3, y pasamos la reserva y el empleado en el state
    //         navegar(`/cliente/lista/3`, { 
    //             state: { 
    //                 toastMessage: message, 
    //                 toastType: 'success',
                   
    //                 idReserva: idReservaNum, 
    //                 idEmpleado: idEmpleadoNum
    //             } 
    //         });

    //     } catch (error) {
    //         console.error("Error al procesar Agregar venta y continuar:", error.response ? error.response.data : error.message);
    //         showFlowAlert("Error al registrar la Venta. Consulte la consola para más detalles.");
    //     } finally {
    //         setIsProcessing(false);
    //     }
    // }


    async function agregarVentaYContinuar() {
        if (carritoItems.length === 0) {
            showFlowAlert("El carrito está vacío. Agregue productos para continuar.");
            return;
        }

        if (isProcessing) return;
        setIsProcessing(true);

        const productosVenta = carritoItems.map(item => ({
            idProducto: item.idProducto, 
            cantidad: item.cantidad
        }));

        const ventaRequest = {
            idCliente: idClienteNum,
            productos: productosVenta,
            idReserva: idReservaNum //Se incluye el ID de la reserva para asociarla
        };
        
        let idVentaCreada = null;

        try {
            //1. Insertar la venta
            const ventaResponse = await crearVenta(ventaRequest);
            idVentaCreada = ventaResponse.data.idventa;
            console.log(`Venta #${idVentaCreada} registrada con éxito.`);

            //2. Se inserta quien la atiende (Atender)
            const atenderRequest = {
                idEmpleado: idEmpleadoNum,
                idVenta: idVentaCreada
            };
            await crearAtender(atenderRequest);
            console.log("Atender registrado con éxito.");

            // INICIO DE LA MODIFICACIÓN
            // 3. Obtener y actualizar la reserva (MARCAR COMO EN PROCESO)
            if (idReservaNum) {
                const reservaResponse = await getReservacion(idReservaNum);
                let reservaUpdateDto = reservaResponse.data;

                reservaUpdateDto = adjustReservaDateAndTime(reservaUpdateDto); 

                // Modificar estatus a 2 (Reservación en Proceso / Parcialmente Atendida)
                reservaUpdateDto.estatus = 2; 

                await updateReservacion(idReservaNum, reservaUpdateDto);
                console.log("Reserva actualizada (en proceso: estatus 2) con éxito.");
            }
            //FIN DE LA MODIFICACIÓN            

            // --------------------------------------------------------------------------
            // 3. Modificación: Navegación para CONTINUAR con la misma reserva (Flujo 1)
            // --------------------------------------------------------------------------
            const message = `Venta con ID #${idVentaCreada} realizada. Agregue productos para la siguiente venta del pedido.`;
            
            // Navegamos de vuelta a la selección de productos para el MISMO cliente, 
            // manteniendo el flag 1, la idReserva y el idEmpleado.
            // Se pasa el carritoItems vacío en el state para empezar una nueva venta.
            navegar(`/venta/productos/${idClienteNum}/1/${idReservaNum}/${idEmpleadoNum}`, { 
                state: { 
                    toastMessage: message, 
                    toastType: 'success',
                    carritoItems: [] // Reiniciar el carrito en la nueva ruta
                } 
            });


        } catch (error) {
            console.error("Error al procesar Agregar venta y continuar:", error.response ? error.response.data : error.message);
            showFlowAlert("Error al registrar la Venta. Consulte la consola para más detalles.");
        } finally {
            setIsProcessing(false);
        }
    }

    async function confirmarVentaGeneral() {
        if (carritoItems.length === 0) {
            showFlowAlert("El carrito está vacío. Agregue productos para confirmar la venta.");
            return;
        }

        if (!idcliente || isNaN(idClienteNum)) {
            showFlowAlert("Error: ID de cliente inválido.");
            return;
        }
        
        //Verificación de empleado: Solo es requerido para los flujos 1 y 2.
        if (estatusFlag === 2 && (!idempleado || isNaN(idEmpleadoNum))) {
            showFlowAlert("Error: ID de empleado inválido para este flujo de venta.");
            return;
        }

        if (isProcessing) return;
        setIsProcessing(true);

        const productosVenta = carritoItems.map(item => ({
            idProducto: item.idProducto, 
            cantidad: item.cantidad
        }));

        const ventaRequest = {
            idCliente: idClienteNum,
            productos: productosVenta,
        };
        
        let idVentaCreada = null;

        try {
            //1. Insertar la venta
            const ventaResponse = await crearVenta(ventaRequest);
            idVentaCreada = ventaResponse.data.idventa;
            console.log(`Venta #${idVentaCreada} registrada con éxito.`);

            //Flujo 0: Venta Base (sin reserva ni empleado en URL, o flag ausente)
            if (estatusFlag === 0) {
                showFlowAlert(`Venta #${idVentaCreada} registrada con éxito. Total: $${ventaResponse.data.totalventa.toFixed(2)}`);
                navegar(`/venta/atender/${idcliente}/${idVentaCreada}`);
                return;
            }

            //Flujo 2: Requiere registro en ATENDER

            //2. Se inserta quien la atiende (Atender)
            const atenderRequest = {
                idEmpleado: idEmpleadoNum,
                idVenta: idVentaCreada
            };
            await crearAtender(atenderRequest);
            console.log("Atender registrado con éxito.");
            
            //3. Navegación de Flujo 2
            if (estatusFlag === 2) {
                const message = `Venta con ID #${idVentaCreada} registrada exitosamente.`;
                navegar('/venta/lista', { state: { toastMessage: message, toastType: 'success' } });
                return;
            }
            
        } catch (error) {
            console.error("Error en el proceso de Confirmación de Venta General:", error.response ? error.response.data : error.message);
            showFlowAlert("Error al registrar la Venta o al procesar. Consulte la consola para más detalles.");
        } finally {
            setIsProcessing(false);
        }
    };


function getAlertaFlujo() {
    
    let mensaje = '';
    let clase = 'alert-info';
    
    if (estatusFlag === 1) {
        mensaje = 'Confirmación de Venta (Flujo 1: Con Reserva)';
        clase = 'alert-info';
    } else if (estatusFlag === 2) {
         mensaje = 'Confirmación de Venta (Flujo 2: Venta Directa)';
         clase = 'alert-warning';
    } else if (estatusFlag === 0) {
        mensaje = 'Confirmación de Venta (Flujo 0: Venta Base)';
        clase = 'alert-success';
    } else {
        return null;
    }

    return (
        <div className={`alert ${clase} text-center py-2 mb-4`}>
            <i className="bi bi-info-circle-fill"></i> {mensaje}
        </div>
    );
}    

function getTituloCarrito() {
    let tituloAdicional = '';
    
    if (estatusFlag === 1) {
        tituloAdicional = `(Venta con reserva)`;
    } else if (estatusFlag === 2) {
        tituloAdicional = ``;
    } else if (estatusFlag === 0) {
        tituloAdicional = ``;
    }

    return (
        <h3 className="text-center mb-3 menor-margin-bottom">
            Tu carrito de compras {tituloAdicional}
        </h3>
    );
}


const renderActionButtons = () => {
    
    
    if (estatusFlag === 1) {
        return (
            <>
               
                <div className="row mb-3">
                    <div className="col-md-6 mb-2">
                        <button className='btn btn-warning btn-lg w-100' onClick={seguirComprando} disabled={isProcessing}>
                            &larr; Seguir comprando
                        </button>
                    </div>
                    <div className="col-md-6 mb-2">
                        <button 
                            className='btn btn-primary btn-lg w-100' 
                            onClick={agregarVentaYContinuar} 
                            disabled={carritoItems.length === 0 || isProcessing}
                        >
                            Agregar venta y continuar con el pedido
                        </button>
                    </div>
                </div>
                
                
                <div className="row">
                    <div className="col-md-6 mb-2">
                        <button 
                            className='btn btn-success btn-lg w-100' 
                            onClick={confirmarYCerrarPedido} 
                            disabled={carritoItems.length === 0 || isProcessing}
                        >
                            Confirmar y cerrar pedido
                        </button>
                    </div>
                    <div className="col-md-6 mb-2">
                        <button className='btn btn-danger btn-lg w-100' onClick={cancelarVenta} disabled={isProcessing}>
                            Cancelar Venta
                        </button>
                    </div>
                </div>
            </>
        );
    }
    

    return (
        <>
            <div className="d-grid gap-2 mb-3">
                <button className='btn btn-secondary btn-lg btnvolvercarrito' onClick={seguirComprando} disabled={isProcessing}>
                    &larr; Seguir comprando
                </button>
            </div>

            <div className="row">
                <div className="col-md-6 mb-2">
                    <button 
                        className='btn btn-success btn-lg w-100' 
                        onClick={confirmarVentaGeneral} 
                        disabled={carritoItems.length === 0 || isProcessing}
                    >
                        {isProcessing ? 'Procesando...' : 'Confirmar Venta'}
                    </button>
                </div>
                <div className="col-md-6 mb-2">
                    <button className='btn btn-danger btn-lg w-100' onClick={cancelarVenta} disabled={isProcessing}>
                        Cancelar Venta
                    </button>
                </div>
            </div>
        </>
    );
};


    //El return
    return (
        <div className="container p-4">
        {getTituloCarrito()} 

            <div className="card cardregularpad shadow mb-4">
                
                <div className="card-header bg-carrito-compra">
                    Detalle del Pedido
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="table table-striped table-hover mb-0 tablacarrito">
                            <thead className="sticky-top bg-light">
                                <tr>
                                    <th>#</th>
                                    <th>Producto</th>
                                    <th>Precio unitario</th>
                                    <th style={{ width: '150px' }}>Cantidad</th>
                                    <th>Subtotal</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {carritoItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center text-muted">El carrito está vacío.</td>
                                    </tr>
                                ) : (
                                    carritoItems.map((item, index) => (
                                        <tr key={item.idProducto}>
                                            <td>{index + 1}</td>
                                            <td>{item.nombre}</td>
                                            <td>${item.precioUnitario.toFixed(2)}</td>
                                            <td className="text-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="text-center form-control form-control-sm"
                                                    value={item.cantidad}
                                                    onChange={(e) => cambiarCarritoCant(index, e.target.value)}
                                                    style={{ maxWidth: '80px' }}
                                                />
                                            </td>
                                            <td>${(item.precioUnitario * item.cantidad).toFixed(2)}</td>
                                            <td>
                                                <button className="btn btn-danger btn-sm" onClick={() => quitarProductoCarrito(index)} disabled={isProcessing}>
                                                    Quitar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                <tr>
                                    <td colSpan="4" className="text-end pe-4"><h4 className="mb-0">Total:</h4></td>
                                    <td><h4 className="text-success mb-0">${total.toFixed(2)}</h4></td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className='col-md-9 mb-0 mx-auto botonescarrito'>
                {renderActionButtons()}
            </div>
            
        </div>
    );
};