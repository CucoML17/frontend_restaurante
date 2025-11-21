import React, { useEffect, useState, useRef, useCallback } from 'react';
import { listActiveProductos, filtrarProductos } from '../../services/ProductoService';
import { listTipos, getProducto } from '../../services/ProductoService'; // Necesitamos getProducto para mapear los detalles
import { getVenta } from '../../services/VentaService'; //Importamos el servicio para obtener la venta
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import ToastNotification from '../../toast/ToastComponent';

// Asegúrate de que esta ruta sea correcta para tu proyecto
const IMAGE_BASE_URL = '/imagenes/productos';


export const MeseroProductoVenta = () => { // 🔄 Nombre del componente cambiado

    const location = useLocation();
    const toastRef = useRef(null);
    const navegar = useNavigate();
    const { idVenta } = useParams(); // 🆕 Extraemos el ID de la Venta de la URL

    // ------------------- ESTADOS DE DATOS -------------------
    const [Productos, setProductos] = useState([]);
    const [TiposMap, setTiposMap] = useState(new Map());
    const [VentaData, setVentaData] = useState(null); // 🆕 Guardaremos aquí los datos de la venta
    const [isLoading, setIsLoading] = useState(true); // 🆕 Para controlar la carga inicial

    // ------------------- ESTADOS DE FILTRO (Mantienen la lógica del componente base) -------------------
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTipoId, setSelectedTipoId] = useState('Todos');
    const [filteredProductos, setFilteredProductos] = useState([]);
    const [TiposList, setTiposList] = useState([]);
    const [usePriceRange, setUsePriceRange] = useState(false);
    const [precioMin, setPrecioMin] = useState('');
    const [precioMax, setPrecioMax] = useState('');
    const [isFiltered, setIsFiltered] = useState(false);
    // ----------------------------------------------------

    // Estado principal del "carrito" (Arreglo temporal de DetalleVenta)
    // Estructura: [{ idProducto, nombre, precioUnitario, cantidad }]
    const [carrito, setCarrito] = useState([]); // 🔄 Inicialmente vacío, se llenará desde la venta

    // Estados para el Modal (agregar producto)
    const [showModal, setShowModal] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidad, setCantidad] = useState(1);

    // Pal carrito
    const [productoAgregado, setProductoAgregado] = useState(null);

    // ------------------- LÓGICA DE CARGA INICIAL (MODIFICADA PARA RECUPERAR STATE) -------------------

    // Use effect para la Carga Inicial de Datos (Productos, Tipos y Venta)
useEffect(() => {
        const idVentaNum = parseInt(idVenta, 10);
        // 🆕 Recuperar el estado de navegación
        const carritoRecuperado = location.state?.carritoItems;
        const mensajeRecuperacion = location.state?.message;

        if (isNaN(idVentaNum) || idVentaNum <= 0) {
            //  MODIFICACIÓN 1: Verificación antes de llamar a show()
            if (toastRef.current) {
                toastRef.current.show("ID de Venta no válido.", 'error', 5000);
            }
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            let loadedProducts; // Declarado dentro para el scope

            try {
                // ... (Carga de Tipos, Productos Activos y Datos de la Venta, sin cambios) ...

                const tipoResponse = await listTipos();
                const tiposData = tipoResponse.data;
                const map = new Map();
                tiposData.forEach(tipoObj => map.set(tipoObj.idtipo, tipoObj.tipo));
                setTiposMap(map);
                setTiposList(tiposData);

                const productoResponse = await listActiveProductos();
                loadedProducts = productoResponse.data;
                setProductos(loadedProducts);
                setFilteredProductos(loadedProducts);

                const ventaResponse = await getVenta(idVentaNum);
                const ventaData = ventaResponse.data;
                setVentaData(ventaData);

                let carritoInicial;

                if (carritoRecuperado) {
                    // Caso 1: Carrito recuperado desde la navegación
                    carritoInicial = carritoRecuperado;
                    
                    //  MODIFICACIÓN 2.1: Verificación antes de llamar a show()
                    if (toastRef.current) {
                        if (mensajeRecuperacion) {
                            toastRef.current.show(mensajeRecuperacion, 'info', 3000);
                        } else {
                            toastRef.current.show(`Venta ${idVentaNum} cargada y carrito recuperado.`, 'info', 3000);
                        }
                    }
                } else {
                    //  Caso 2: Mapear detalles de la venta a la estructura del carrito
                    const detallesVentaPromesas = ventaData.detallesVenta.map(async (detalle) => {
                        // ... (Lógica de mapeo de detalles, sin cambios) ...
                        const productoInfo = loadedProducts.find(p => p.id_producto === detalle.idProducto);

                        if (productoInfo) {
                            return {
                                idProducto: detalle.idProducto,
                                nombre: productoInfo.nombre,
                                precioUnitario: productoInfo.precio, 
                                cantidad: detalle.cantidad,
                            };
                        } else {
                            console.warn(`Producto ID ${detalle.idProducto} no encontrado en la lista de activos. Buscando detalles...`);
                            const productoFull = await getProducto(detalle.idProducto);

                            return {
                                idProducto: detalle.idProducto,
                                nombre: productoFull.data.nombre,
                                precioUnitario: productoFull.data.precio,
                                cantidad: detalle.cantidad,
                            };
                        }
                    });

                    carritoInicial = await Promise.all(detallesVentaPromesas);

                    //  MODIFICACIÓN 2.2: Verificación antes de llamar a show()
                    if (toastRef.current) {
                        toastRef.current.show(`Venta ${idVentaNum} cargada para edición.`, 'info', 3000);
                    }
                }

                //  Asignación final del carrito
                setCarrito(carritoInicial);

            } catch (error) {
                console.error("Error al cargar datos iniciales:", error);
                //  MODIFICACIÓN 3: Verificación dentro del bloque catch
                if (toastRef.current) {
                    toastRef.current.show(`Error al cargar la venta ID ${idVentaNum}.`, 'error', 5000);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [idVenta, location]);

    // ------------------- LÓGICA DE FILTRADO (Se mantiene igual) -------------------

    // [El código de las funciones reiniciarFiltros, handleKeyPress, handleSearch, 
    // handleSearchTermChange, handleTipoChange y applyFilters va aquí, 
    // se copia directamente del componente base.]

    const reiniciarFiltros = () => {
        setSearchTerm('');
        setSelectedTipoId('Todos');
        setUsePriceRange(false);
        setPrecioMin('');
        setPrecioMax('');

        listActiveProductos().then(response => {
            setFilteredProductos(response.data);
            setIsFiltered(false);
        }).catch(e => console.error("Error al reiniciar productos:", e));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    const handleSearch = () => {
        const nombre = searchTerm.trim();
        const idTipo = selectedTipoId === 'Todos' ? 0 : parseInt(selectedTipoId, 10);

        let min = null;
        let max = null;

        if (usePriceRange) {
            const trimmedMin = precioMin.trim();
            const trimmedMax = precioMax.trim();

            if (trimmedMin === '' && trimmedMax === '') {
                toastRef.current.show('Ingrese el rango a filtrar.', 'warning', 3000);
                return;
            }

            if (trimmedMin !== '') {
                const minVal = parseFloat(trimmedMin);
                min = minVal >= 0 ? minVal : null;
            }

            if (trimmedMax !== '') {
                const maxVal = parseFloat(trimmedMax);
                max = maxVal >= 0 ? maxVal : null;
            }

            if (min !== null && max !== null && min > max) {
                toastRef.current.show('El precio mínimo no puede ser mayor al máximo.', 'warning', 3000);
                return;
            }
        }

        const isPriceFilterEffective = usePriceRange && (min !== null || max !== null);
        const isSearchActive = nombre || idTipo > 0 || isPriceFilterEffective;

        if (!isSearchActive) {
            reiniciarFiltros();
            return;
        }

        filtrarProductos(nombre, idTipo, min, max)
            .then(response => {
                setFilteredProductos(response.data);
                setIsFiltered(true);
            })
            .catch(error => {
                console.error("Error al filtrar productos:", error);
                setFilteredProductos([]);
                setIsFiltered(true);
            });
    };

    const handleSearchTermChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleTipoChange = (e) => {
        setSelectedTipoId(e.target.value);
    };

    function getTipoNombre(idTipo) {
        return TiposMap.get(idTipo) || 'Sin Tipo';
    }

    // ------------------- LÓGICA DEL CARRITO (Se mantiene igual) -------------------

    // [El código de las funciones manejaComprarClick, manejaCloseModal, AgregarACarrito y el 
    // useEffect de seguimiento del carrito se copia directamente del componente base.]

    function manejaComprarClick(producto) {
        setProductoSeleccionado(producto);
        setCantidad(1); // Resetear la cantidad a 1
        setShowModal(true);
    };

    function manejaCloseModal() {
        setShowModal(false);
        setProductoSeleccionado(null);
        setCantidad(1);
    };

    function AgregarACarrito() {
        if (productoSeleccionado && cantidad > 0) {

            const C_nueva = parseInt(cantidad);
            const idProductoAAgregar = productoSeleccionado.id_producto;
            let cantidadFinal = C_nueva;

            setCarrito(prevCarrito => {
                const index = prevCarrito.findIndex(item => item.idProducto === idProductoAAgregar);

                if (index > -1) {
                    const itemAntiguo = prevCarrito[index];
                    const C_antigua = itemAntiguo.cantidad;
                    const C_total = C_antigua + C_nueva;

                    console.log(`[DEBUG SUMA] Producto ID: ${idProductoAAgregar}. ${C_antigua} + ${C_nueva} = ${C_total}`);

                    cantidadFinal = C_total;

                    const nuevoCarrito = [...prevCarrito];

                    nuevoCarrito[index] = {
                        ...itemAntiguo,
                        cantidad: C_total
                    };

                    return nuevoCarrito;
                } else {

                    const nuevoItem = {
                        idProducto: idProductoAAgregar,
                        nombre: productoSeleccionado.nombre,
                        precioUnitario: productoSeleccionado.precio,
                        cantidad: C_nueva,
                    };
                    return [...prevCarrito, nuevoItem];
                }
            });

            setProductoAgregado(productoSeleccionado.nombre);
            manejaCloseModal();
        }
    };


    // Para seguimiento del carrito
    useEffect(() => {

        if (productoAgregado && toastRef.current) {

            const detalles = carrito.map(item =>
                `- ${item.nombre} x ${item.cantidad}`
            ).join('\n');

            const mensajeToast = `Carrito Actualizado (Producto agregado: ${productoAgregado}):\n\n${detalles}`;
            toastRef.current.show(mensajeToast, 'success', 3000);
            setProductoAgregado(null);
        }

        console.log("Estado actual del carrito:", carrito);

    }, [carrito, productoAgregado]);


    // ------------------- LÓGICA DE NAVEGACIÓN (MODIFICADA) -------------------

    function navegarACarrito() {
        if (carrito.length === 0) {
            alert("El carrito está vacío. Agrega al menos un producto.");
            return;
        }

        if (!VentaData) {
            console.error("VentaData no está cargado.");
            return;
        }

        const idVentaNum = parseInt(idVenta, 10); // Obtenido del useParams()

        // Los datos necesarios de la venta original se empaquetan en el 'state'
        const stateData = {
            carritoItems: carrito,           // 1. El carrito actual para edición
            idVentaOriginal: idVentaNum,     // 2. El ID de la venta que se está editando
            idCliente: VentaData.idCliente,  // 3. ID del cliente de la venta original
            idReserva: VentaData.idReserva || 0, // 4. ID de reserva (o 0)
            // 5. El idEmpleado logueado aún debe obtenerse, lo pasamos como 0 temporalmente
            idEmpleado: 0
        };

        // 🆕 Nueva ruta: /mesero/carritoventa/:idVenta
        const ruta = `/mesero/carritoventa/${idVentaNum}`;

        console.log(`[EDITAR VENTA] Navegando a MeseroCarritoCompra para ID Venta ${idVentaNum}.`);
        console.log(`Ruta: ${ruta}`);
        console.log(`Datos de estado:`, stateData); // 🚨 LOGCAT solicitado

        navegar(ruta, { state: stateData });
    };

    // ------------------- DISEÑO E IMPLEMENTACIÓN -------------------

    if (isLoading) {
        return (
            <div className="container p-4 text-center mt-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-3">Cargando datos de la venta...</p>
            </div>
        );
    }

    return (
        <div className="container p-4">

            <ToastNotification ref={toastRef} />

            <h2 className="text-center mb-4">
                Editar Productos de la Venta #{idVenta}
            </h2>

            {/* 🆕 Información de la Venta Cargada */}
            <div className="alert alert-info text-center mb-4 d-none">
                Cliente: **{VentaData?.idCliente || 'N/A'}** |
                Reserva: **{VentaData?.idReserva || 'Sin Reserva'}** |
                Total Venta Original: **${VentaData?.totalventa.toFixed(2) || '0.00'}**
            </div>


            <div className="text-center mb-4">
                <button className='btn btn-warning btn-lg' onClick={navegarACarrito} disabled={carrito.length === 0}>
                    Ir a Carrito ({carrito.length} Productos)
                </button>
            </div>

            {/* ------------ INICIO DE LA SECCIÓN DE FILTRO ------------ */}
            {/* [CÓDIGO DE FILTROS SE COPIA AQUÍ] */}
            <div className="mb-4 w-75 mx-auto">
                <div className="row g-3 align-items-end mb-3">
                    <div className="col-md-6">
                        <input
                            id="nombreFilter"
                            type="text"
                            placeholder="Buscar por nombre..."
                            className="form-control form-control-lg"
                            value={searchTerm}
                            onChange={handleSearchTermChange}
                            onKeyDown={handleKeyPress}
                        />
                    </div>
                    <div className="col-md-6">
                        <select
                            id="tipoFilter"
                            className="form-select form-select-lg"
                            value={selectedTipoId}
                            onChange={handleTipoChange}
                        >
                            <option value="Todos">Todos los Tipos</option>
                            {TiposList.map(tipo => (
                                <option key={tipo.idtipo} value={tipo.idtipo.toString()}>
                                    {tipo.tipo}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="row g-3 align-items-end mb-3">
                    <div className="col-md-4 d-flex align-items-center mb-1">
                        <div className="form-check me-3">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="checkRangoPrecio"
                                checked={usePriceRange}
                                onChange={(e) => setUsePriceRange(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="checkRangoPrecio">
                                Filtrar por Rango de Precios
                            </label>
                        </div>
                    </div>
                    <div className="col-md-8 d-flex justify-content-start">
                        {usePriceRange && (
                            <div className="row g-3 w-100">
                                <div className="col-md-6">
                                    <input
                                        id="precioMinFilter"
                                        type="number"
                                        className="form-control form-control-lg"
                                        value={precioMin}
                                        onChange={(e) => setPrecioMin(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        min="0.00"
                                        step="0.01"
                                        placeholder="Precio Mínimo"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <input
                                        id="precioMaxFilter"
                                        type="number"
                                        className="form-control form-control-lg"
                                        value={precioMax}
                                        onChange={(e) => setPrecioMax(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        min="0.00"
                                        step="0.01"
                                        placeholder="Precio Máximo"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="row g-3 align-items-end justify-content-center">
                    <div className="col-md-4 d-flex">
                        <button
                            className='btn btn-primary btn-lg flex-grow-1 me-2 btn-busca-b'
                            onClick={handleSearch}
                        >
                            Buscar
                        </button>
                        <button
                            className={`btn btn-secondary btn-lg btn-reinicia-b ${isFiltered ? '' : 'd-none'}`}
                            onClick={reiniciarFiltros}
                        >
                            Reiniciar
                        </button>
                    </div>
                </div>
            </div>
            {/* ------------ FIN DE LA SECCIÓN DE FILTRO ------------ */}


            <div className="row">
                {filteredProductos.length === 0 && (
                    <div className="col-12 text-center text-muted mt-5">
                        <h4> No se encontraron productos con los filtros aplicados.</h4>
                    </div>
                )}
                <div className="row justify-content-center">
                    {filteredProductos.map(producto => (

                        <div key={producto.id_producto} className="col-lg-4 col-md-6 col-sm-12 mb-4">
                            <div className="card shadow h-100 carmenorpad">
                                <div className="card-body productoventa">

                                    {/* Imagen del producto */}
                                    {producto.imgProducto && (
                                        <div className="mb-3 text-center">
                                            <img
                                                src={`${IMAGE_BASE_URL}${producto.imgProducto}`}
                                                alt={`Imagen de ${producto.nombre}`}
                                                style={{ maxHeight: '120px', width: 'auto', objectFit: 'contain', borderBottom: '1px solid #eee' }}
                                                className="card-img-top p-2"
                                            />
                                        </div>
                                    )}
                                    {/* */}

                                    <h5 className="card-title text-center">
                                        {producto.nombre}
                                    </h5>
                                    <hr />

                                    <p className="card-text">
                                        <strong>Tipo:</strong> {getTipoNombre(producto.idTipo)}
                                    </p>
                                    <hr />

                                    <p className="card-text text">
                                        {producto.descripcion}
                                    </p>

                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                        <h4 className="text-success mb-0 txtprecio">
                                            ${producto.precio.toFixed(2)}
                                        </h4>
                                        <button className='btn btn-info' onClick={() => manejaComprarClick(producto)}>
                                            Comprar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* */}

            </div>


            {showModal && productoSeleccionado && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">

                                <h5 className="modal-title">Agregar a Carrito</h5>
                                <button type="button" className="btn-close" onClick={manejaCloseModal}></button>
                            </div>

                            <div className="modal-body">

                                <h5 className="mb-2 color-rojo">Producto: {productoSeleccionado.nombre}</h5>
                                <hr className="mb-3 mt-0" />

                                <p className="mb-2">
                                    <strong>Precio Unitario:</strong> <span className="text-success">${productoSeleccionado.precio.toFixed(2)}</span>
                                </p>

                                <hr className="mb-3 mt-3" />

                                <div className="row align-items-center">
                                    <div className="col-4">
                                        <label className="form-label mb-0"><strong>Cantidad:</strong></label>
                                    </div>
                                    <div className="col-8">
                                        <input type="number" className="form-control" min="1" value={cantidad}
                                            onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                                        />
                                    </div>
                                </div>

                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-princi" onClick={manejaCloseModal}>Cancelar</button>
                                <button type="button" className="btn btnvolvercarrito" onClick={AgregarACarrito}>Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};