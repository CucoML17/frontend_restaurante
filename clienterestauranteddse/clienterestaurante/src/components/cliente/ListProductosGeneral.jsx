import React, { useEffect, useState, useRef } from 'react';
// Importamos solo los servicios de listado y filtrado
import { listActiveProductos, filtrarProductos, listTipos } from '../../services/ProductoService';
import 'bootstrap/dist/css/bootstrap.min.css';

import ToastNotification from '../../toast/ToastComponent';

// Asegúrate de que esta URL base sea correcta para tu entorno
const IMAGE_BASE_URL = '/imagenes/productos';


export const ListProductosGeneral = () => {

    const toastRef = useRef(null);

    // ------------------- ESTADOS -------------------
    const [Productos, setProductos] = useState([]); // Lista original (no esencial, pero la mantenemos para referencia)
    const [TiposMap, setTiposMap] = useState(new Map()); // Mapa de ID a nombre de Tipo
    const [TiposList, setTiposList] = useState([]); // Lista de objetos tipo para el desplegable
    const [filteredProductos, setFilteredProductos] = useState([]); // Lista que se renderiza

    // ESTADOS PARA FILTROS
    const [searchTerm, setSearchTerm] = useState(''); // Texto de búsqueda por nombre
    const [selectedTipoId, setSelectedTipoId] = useState('Todos'); // ID del tipo seleccionado
    
    // ESTADOS para Rango de Precios y Control
    const [usePriceRange, setUsePriceRange] = useState(false); // Checkbox
    const [precioMin, setPrecioMin] = useState(''); // Precio mínimo
    const [precioMax, setPrecioMax] = useState(''); // Precio máximo
    const [isFiltered, setIsFiltered] = useState(false); // Controla la visibilidad del botón Reiniciar
    // ----------------------------------------------------


    // ------------------- LÓGICA DE FILTRADO -------------------

    // Función que limpia todos los filtros y recarga la lista completa
    const reiniciarFiltros = () => {
        setSearchTerm('');
        setSelectedTipoId('Todos');
        setUsePriceRange(false);
        setPrecioMin('');
        setPrecioMax('');

        // Recargar la lista inicial de productos activos
        listActiveProductos().then(response => {
            setFilteredProductos(response.data);
            setIsFiltered(false);
        }).catch(e => console.error("Error al reiniciar productos:", e));
    };

    // Función para manejar la tecla Enter y ejecutar la búsqueda
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    // Función principal de búsqueda/filtro (llama a la API)
    const handleSearch = () => {
        const nombre = searchTerm.trim();
        const idTipo = selectedTipoId === 'Todos' ? 0 : parseInt(selectedTipoId, 10);

        let min = null;
        let max = null;
        
        // 1. Obtener los valores de precio (solo si el checkbox está activo)
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

            // Validación simple: si ambos son números válidos, verifica que min <= max
            if (min !== null && max !== null && min > max) {
                toastRef.current.show('El precio mínimo no puede ser mayor al máximo.', 'warning', 3000);
                return;
            }
        }

        // 2. Determinar si *algún* filtro está activo (idTipo > 0 significa que se seleccionó algo diferente a 'Todos')
        const isPriceFilterEffective = usePriceRange && (min !== null || max !== null);
        const isSearchActive = nombre || idTipo > 0 || isPriceFilterEffective;

        if (!isSearchActive) {
            // Si no hay filtros activos, reiniciamos (recargamos la lista completa)
            reiniciarFiltros();
            return;
        }

        // 3. Llamar al servicio de filtro con los parámetros
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

    // Handlers simples para actualizar el estado del input (no ejecutan la búsqueda)
    const handleSearchTermChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleTipoChange = (e) => {
        setSelectedTipoId(e.target.value);
    };

    // ------------------- USE EFFECTS -------------------

    // Use effect para la Carga Inicial de Datos (Productos Activos y Tipos)
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
                setIsFiltered(false);
            })
            .catch(error => {
                console.error("Error al cargar Tipos o Productos Activos:", error);
            });
    }, []);

    // ------------------- Funciones Auxiliares -----------------

    // Para colocarle el tipo en la Card
    function getTipoNombre(idTipo) {
        return TiposMap.get(idTipo) || 'Sin Tipo';
    }


    // ------------------- Diseño e Implementación -------------------

    return (
        <div className="container p-4">

            <ToastNotification ref={toastRef} />

            <h2 className="text-center mb-4">
                Catálogo General de Productos
            </h2>

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

                {/* SEGUNDA FILA: Checkbox y Rango de Precios */}
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

                        {/* Inputs de Rango de Precios (Condicional) */}
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
                                        
                                        {/* Botón de Comprar ELIMINADO */}
                                        <button className='btn btn-outline-info d-none' disabled>
                                            Ver Detalles
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};