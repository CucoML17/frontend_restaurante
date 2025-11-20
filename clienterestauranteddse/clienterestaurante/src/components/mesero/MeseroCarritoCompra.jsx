import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { updateVentaCompleta } from '../../services/VentaService'; 

import 'bootstrap/dist/css/bootstrap.min.css';

export const MeseroCarritoCompra = () => {

    // ... (Hooks, obtención de parámetros y estados iniciales - SIN CAMBIOS) ...
    const location = useLocation();
    const navegar = useNavigate();
    const { idVenta } = useParams(); 
    const idVentaOriginal = parseInt(idVenta, 10);
    const stateData = location.state || {};
    const idClienteNum = stateData.idCliente; 
    const idReservaNum = stateData.idReserva || null; 
    const [carritoItems, setCarritoItems] = useState(stateData.carritoItems || []);
    const [total, setTotal] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false); 

    // ... (useEffect para calcular el total y showFlowAlert - SIN CAMBIOS) ...
    useEffect(() => {
        const nuevoTotal = carritoItems.reduce((acc, item) => 
            acc + (item.precioUnitario * item.cantidad)
        , 0);
        setTotal(nuevoTotal);
    }, [carritoItems]);

    const showFlowAlert = (message) => {
        console.warn(`[ALERTA DE FLUJO]: ${message}`);
        alert(message);
    };

    // ... (cambiarCarritoCant y quitarProductoCarrito - SIN CAMBIOS) ...
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
    
    // 1. MODIFICADO: Navegación para "Seguir Comprando"
    function seguirComprando() {
        // La ruta de productos del mesero ahora es: /mesero/productoventa/:idVenta
        const ruta = `/mesero/editarventa/${idVentaOriginal}`;
        
        // Se le pasa el carritoItems actual para que no se pierdan los cambios no guardados
        // Se usará para sobrescribir el estado interno de MeseroProductoVenta.
        navegar(ruta, { 
            state: { 
                carritoItems: carritoItems, 
                // Añadimos un flag o mensaje para que MeseroProductoVenta sepa que viene de vuelta
                message: 'Carrito de edición recuperado.',
            } 
        });
    };

    // 2. NUEVO: Función para Cancelar la edición
    function cancelarEdicion() {
        navegar('/ventas/mesero/lista', { state: { toastMessage: 'Edición de venta cancelada.' } });
    }


    async function guardarCambiosVenta() {
        // ... (Lógica de guardar cambios - SIN CAMBIOS) ...
        if (carritoItems.length === 0) {
            showFlowAlert("El carrito está vacío. Agregue productos para guardar la edición de la venta.");
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
        
        try {
            const ventaResponse = await updateVentaCompleta(idVentaOriginal, ventaRequest);
            
            console.log(`Venta #${idVentaOriginal} actualizada con éxito.`);

            const successMessage = `Venta actualizada con éxito. (Total: $${ventaResponse.data.totalventa.toFixed(2)})`;
            navegar('/ventas/mesero/lista', { state: { toastMessage: successMessage, toastType: 'success' } });

        } catch (error) {
            console.error("Error al procesar Guardar Cambios de Venta:", error.response ? error.response.data : error.message);
            showFlowAlert("Error al actualizar la Venta. Consulte la consola para más detalles.");
        } finally {
            setIsProcessing(false);
        }
    }

    function getTituloCarrito() {
        return (
            <h3 className="text-center mb-3 menor-margin-bottom">
                Edición de Venta
            </h3>
        );
    }

    // 3. MODIFICADO: Renderizado de botones de acción
    const renderActionButtons = () => {
        return (
            <>
                {/* Primera Fila: Navegación */}
                <div className="row mb-3">
                    <div className="col-md-6 mb-2">
                         <button className='btn btn-warning btn-lg w-100' onClick={seguirComprando} disabled={isProcessing}>
                            &larr; Seguir comprando
                        </button>
                    </div>
                    <div className="col-md-6 mb-2">
                         {/* NUEVO BOTÓN CANCELAR */}
                         <button className='btn btn-danger btn-lg w-100' onClick={cancelarEdicion} disabled={isProcessing}>
                            Cancelar Edición
                        </button>
                    </div>
                </div>

                {/* Segunda Fila: Acción Principal */}
                <div className="row">
                    <div className="col-md-12 mb-2">
                        <button 
                            className='btn btn-success btn-lg w-100' 
                            onClick={guardarCambiosVenta} 
                            disabled={carritoItems.length === 0 || isProcessing}
                        >
                            {isProcessing ? 'Guardando...' : 'Guardar Cambios de Venta'}
                        </button>
                    </div>
                </div>
            </>
        );
    };

    // ... (El return del componente - ESTRUCTURA SIN CAMBIOS) ...
    return (
        <div className="container p-4">
            {getTituloCarrito()} 
            <p className="text-center text-muted d-none">Venta ID: {idVentaOriginal} | Cliente ID: {idClienteNum} | Reserva ID: {idReservaNum || 'N/A'}</p>

            <div className="card cardregularpad shadow mb-4">
                
                <div className="card-header bg-carrito-compra">
                    Detalle del Pedido a Editar
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
                                                    disabled={isProcessing}
                                                />
                                            </td>
                                            <td>${(item.precioUnitario * item.cantidad).toFixed(2)}</td>
                                            <td>
                                                <button 
                                                    className="btn btn-danger btn-sm" 
                                                    onClick={() => quitarProductoCarrito(index)} 
                                                    disabled={isProcessing}
                                                >
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