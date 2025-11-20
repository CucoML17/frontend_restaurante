import React, { useEffect, useState, useRef } from 'react';
import { listActiveProductos, filtrarProductos } from '../services/ProductoService';
import { listTipos } from '../services/ProductoService';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import ToastNotification from '../toast/ToastComponent';

const IMAGE_BASE_URL = '/imagenes/productos';


export const ListProductoVentaComponent = () => {

    const location = useLocation();
    const toastRef = useRef(null);

    //Estados y constantes
    const [Productos, setProductos] = useState([]);
    const [TiposMap, setTiposMap] = useState(new Map());

    //NUEVOS ESTADOS PARA FILTROS
    const [searchTerm, setSearchTerm] = useState(''); // Texto de búsqueda por nombre
    const [selectedTipoId, setSelectedTipoId] = useState('Todos'); // ID del tipo seleccionado (string 'Todos' o idTipo numérico)
    const [filteredProductos, setFilteredProductos] = useState([]); // Lista que se renderiza
    const [TiposList, setTiposList] = useState([]); // Lista de objetos tipo para el desplegable

    //NUEVOS ESTADOS para Rango de Precios y Control
    const [usePriceRange, setUsePriceRange] = useState(false); // Checkbox para el rango de precios
    const [precioMin, setPrecioMin] = useState(''); // Precio mínimo (usamos string vacío para control de input)
    const [precioMax, setPrecioMax] = useState(''); // Precio máximo (usamos string vacío para control de input)
    const [isFiltered, setIsFiltered] = useState(false); // Controla la visibilidad del botón Reiniciar
    // ----------------------------------------------------    


    //Estado principal del "carrito" (Arreglo temporal de DetalleVenta)
    //Estructura: [{ idProducto, nombre, precioUnitario, cantidad }]
    const [carrito, setCarrito] = useState(location.state?.carritoItems || []);

    //Estados para el Modal (agregar producto)
    const [showModal, setShowModal] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidad, setCantidad] = useState(1);

    //Pal carrito
    const [toastInfo, setToastInfo] = useState({ show: false, message: '', type: 'success' });
    const [productoAgregado, setProductoAgregado] = useState(null);

    //Obtener los parametros de la URL
    const { idcliente, flag, idreserva, idempleado } = useParams();

    const idClienteNum = parseInt(idcliente, 10);
    const estatusFlag = parseInt(flag, 10);

    //La bandera es 0 si es venta directa
    const idReservaNum = estatusFlag === 1 ? parseInt(idreserva, 10) : 0;
    const idEmpleadoNum = parseInt(idempleado, 10);


    const navegar = useNavigate();

    // ------------------- LÓGICA DE FILTRADO (NUEVA FUNCIÓN) -------------------
    // Función que limpia todos los filtros
    const reiniciarFiltros = () => {
        setSearchTerm('');
        setSelectedTipoId('Todos');
        setUsePriceRange(false);
        setPrecioMin('');
        setPrecioMax('');

        // Ejecutar la búsqueda con los valores reseteados
        // Al usar 'listActiveProductos' cargamos la lista original, reseteando la UI.
        listActiveProductos().then(response => {
            setFilteredProductos(response.data);
            setIsFiltered(false);
        }).catch(e => console.error("Error al reiniciar productos:", e));
    };

    // 🟢 Función que ejecuta la búsqueda al presionar "Enter" (similar a ListProductoComponent)
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Llama a la función principal de búsqueda/filtro (handleSearch)
            handleSearch();
        }
    };

    // 🟢 Función principal de búsqueda/filtro (Igual que en ListProductoComponent, PERO llama a la API)
    // 🟢 Función principal de búsqueda/filtro (Igual que en ListProductoComponent, PERO llama a la API)
    const handleSearch = () => {
        const nombre = searchTerm.trim();
        const idTipo = selectedTipoId === 'Todos' ? 0 : parseInt(selectedTipoId, 10);

        let min = null;
        let max = null;
        let isPriceRangeValid = true; // 🚩 NUEVA BANDERA para controlar la validez del rango

        // 1. Obtener los valores de precio (solo si el checkbox está activo)
        if (usePriceRange) {
            // Usamos trim() para verificar si los inputs están realmente vacíos
            const trimmedMin = precioMin.trim();
            const trimmedMax = precioMax.trim();

            // Si el checkbox está marcado pero ambos campos están vacíos
            if (trimmedMin === '' && trimmedMax === '') {
                // Muestra el toast y detiene la búsqueda
                toastRef.current.show('Ingrese el rango a filtrar.', 'warning', 3000);
                return;
            }

            // Convertir a número solo si hay valor. Si no hay valor, se mantiene en null.
            if (trimmedMin !== '') {
                const minVal = parseFloat(trimmedMin);
                min = minVal >= 0 ? minVal : null;
            }

            if (trimmedMax !== '') {
                const maxVal = parseFloat(trimmedMax);
                max = maxVal >= 0 ? maxVal : null;
            }

            // Validación simple: si ambos son números válidos, verifica que min <= max
            if (min !== null && max !== null && min > max) {
                toastRef.current.show('El precio mínimo no puede ser mayor al máximo.', 'warning', 3000);
                return; // Detiene la ejecución
            }
        }

        // 2. Determinar si *algún* filtro está activo
        // El filtro de precio es efectivo si usePriceRange es TRUE Y se ingresó min O max.
        const isPriceFilterEffective = usePriceRange && (min !== null || max !== null);

        // El filtro general es activo si hay nombre, tipo, O el filtro de precio es efectivo
        const isSearchActive = nombre || idTipo > 0 || isPriceFilterEffective;

        if (!isSearchActive) {
            // Si no hay filtros activos (y no se detuvo por el toast del precio vacío), reiniciamos.
            reiniciarFiltros();
            return;
        }

        // 3. Llamar al servicio de filtro con los parámetros
        // min/max serán null si el campo estaba vacío o si usePriceRange era false.
        filtrarProductos(nombre, idTipo, min, max)
            .then(response => {
                setFilteredProductos(response.data);
                setIsFiltered(true); // Filtro aplicado
            })
            .catch(error => {
                console.error("Error al filtrar productos:", error);
                setFilteredProductos([]);
                setIsFiltered(true);
            });
    };

    // 🟢 Modificar handlers para NO filtrar en tiempo real (ahora se usa el botón/Enter)
    const handleSearchTermChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleTipoChange = (e) => {
        setSelectedTipoId(e.target.value);
    };

    // 🟢 Función principal que aplica los filtros
    const applyFilters = (products, term, tipoId) => {
        const lowerTerm = term.toLowerCase();

        return products.filter(producto => {
            const nombreMatch = producto.nombre.toLowerCase().includes(lowerTerm);

            // Si el tipo es 'Todos', ignoramos el filtro por tipo.
            const tipoMatch = tipoId === 'Todos' || producto.idTipo.toString() === tipoId;

            // Lógica combinada:
            // 1. Si se elige un tipo específico (tipoId !== 'Todos'), debe coincidir el tipo Y (opcionalmente) el nombre.
            // 2. Si es 'Todos', solo debe coincidir el nombre.

            if (tipoId !== 'Todos') {
                // Filtro por Tipo Y por Nombre (si el nombre no está vacío)
                return tipoMatch && nombreMatch;
            } else {
                // Solo filtra por Nombre (ignora el tipo)
                return nombreMatch;
            }
        });
    };

    // ------------------- USE EFFECTS -------------------

    //Use effect para la Carga Inicial de Datos (Productos Activos y Tipos)
    useEffect(() => {

        listTipos()
            .then(tipoResponse => {
                const tiposData = tipoResponse.data;
                const map = new Map();
                tiposData.forEach(tipoObj => {
                    map.set(tipoObj.idtipo, tipoObj.tipo);
                });
                setTiposMap(map);
                setTiposList(tiposData);

                return listActiveProductos();
            })
            .then(productoResponse => {
                const loadedProducts = productoResponse.data;
                setProductos(loadedProducts);
                setFilteredProductos(loadedProducts); // Inicializar con todos
                setIsFiltered(false); // Al cargar todos, no está filtrado.
            })
            .catch(error => {
                console.error("Error al cargar Tipos o Productos Activos:", error);
            });
    }, []);

    // -------------------Funciones Auxiliares-----------------

    //Para colocarle el tipo en la Card
    function getTipoNombre(idTipo) {
        return TiposMap.get(idTipo) || 'Sin Tipo';
    }
    //------Lógica del Modal (Comprar)----

    //Abrir Modal
    function manejaComprarClick(producto) {
        setProductoSeleccionado(producto);
        setCantidad(1); // Resetear la cantidad a 1
        setShowModal(true);
    };

    //Cerrar Modal
    function manejaCloseModal() {
        setShowModal(false);
        setProductoSeleccionado(null);
        setCantidad(1);
    };

    //----------------Lógica del Carrito----------------

    //Agregar/Actualizar producto en el carrito
    function AgregarACarrito() {
        if (productoSeleccionado && cantidad > 0) {

            const C_nueva = parseInt(cantidad);
            const idProductoAAgregar = productoSeleccionado.id_producto;

            let productoNombre = productoSeleccionado.nombre;
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


    //Para cuando se va navegar a la confirmación de la venta
    function navegarACarrito() {
        if (carrito.length === 0) {
            alert("El carrito está vacío. Agrega al menos un producto.");
            return;
        }

        let ruta = `/venta/carrito/${idClienteNum}`;
        let stateData = { carritoItems: carrito };


        if (estatusFlag === 1 || estatusFlag === 2) {

            //Usamos la estructura completa de la ruta. idReservaNum será 0 si estatusFlag es 2.
            ruta = `/venta/carrito/${idClienteNum}/${estatusFlag}/${idReservaNum}/${idEmpleadoNum}`;

            //Pasamos los IDs necesarios como contexto en el state
            stateData = {
                carritoItems: carrito,
                idReserva: idReservaNum,
                idEmpleado: idEmpleadoNum,
                estatusFlag: estatusFlag
            };

            console.log(`Navegando a Carrito (Flujo ${estatusFlag === 1 ? 'Reserva' : 'Venta Directa'}). Ruta: ${ruta}`);

        } else {

            console.log("Navegando a Carrito (Flujo Base). Ruta: /venta/carrito/:idcliente");
        }


        navegar(ruta, { state: stateData });
    };

    //Para seguimiento del carrito
    useEffect(() => {

        if (productoAgregado && toastRef.current) {

            //Crear el listado de productos para el toast
            const detalles = carrito.map(item =>
                `- ${item.nombre} x ${item.cantidad}`
            ).join('\n');

            const mensajeToast = `Carrito Actualizado (Producto agregado: ${productoAgregado}):\n\n${detalles}`;

            toastRef.current.show(mensajeToast, 'success', 3000);


            setProductoAgregado(null);
        }

        console.log("Estado actual del carrito:", carrito);

    }, [carrito, productoAgregado]);


    //Diseño e implementación
    return (
        <div className="container p-4">

            <ToastNotification ref={toastRef} />


            <h2 className="text-center mb-4">
                Elegir productos  para la venta
            </h2>


            <div className="text-center mb-4">
                <button className='btn btn-warning btn-lg' onClick={navegarACarrito} disabled={carrito.length === 0}>
                    Ir al Carrito ({carrito.length} Productos)
                </button>
            </div>

            {/* ------------ INICIO DE LA SECCIÓN DE FILTRO ------------ */}
            <div className="mb-4 w-75 mx-auto">

                {/* PRIMERA FILA: Nombre y Tipo */}
                <div className="row g-3 align-items-end mb-3">

                    {/* Filtro por Nombre (col-md-6) */}
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

                    {/* Filtro por Tipo (col-md-6) */}
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

                {/* SEGUNDA FILA: Checkbox y Rango de Precios (Estructura Fija 4/8) */}
                <div className="row g-3 align-items-end mb-3">

                    {/* Checkbox (Fijo en col-md-4) */}
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

                    {/* Contenedor Fijo para Inputs (col-md-8) */}
                    <div className="col-md-8 d-flex justify-content-start">

                        {/* Inputs de Rango de Precios (Condicional {usePriceRange && ...}) */}
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

                {/* TERCERA FILA: Botones (Buscar y Reiniciar) */}
                <div className="row g-3 align-items-end justify-content-center">

                    {/* Botones de Buscar y Reiniciar (col-md-4) */}
                    <div className="col-md-4 d-flex">
                        <button
                            className='btn btn-primary btn-lg flex-grow-1 me-2 btn-busca-b'
                            onClick={handleSearch}
                        >
                            Buscar
                        </button>
                        <button
                            // Mostrar solo si isFiltered es true (un filtro activo)
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

                                    {/*  Imagen del producto */}
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
                                    {/*  */}


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
                {/*  */}

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