import React, { useEffect, useState, useRef } from 'react'
import { deleteProducto, listProductos, listTipos, cambiarEstadoProducto, filtrarProductos } from '../services/ProductoService'
import { useNavigate, useLocation } from 'react-router-dom'
import ToastNotification from '../toast/ToastComponent';
// 🚀 Importar el ConfirmDialog
import ConfirmDialog from '../toast/ConfirmDialog';

// 1. Definir la URL base de las imágenes (Asegúrate que coincida con tu backend)
const IMAGE_BASE_URL = '/imagenes/productos';


export const ListProductoComponent = () => {

  const toastRef = useRef(null);
    // 💡 1. Crear la referencia para el ConfirmDialog
    const confirmRef = useRef(null);

  const [Productos, setProductos] = useState([])
  const [TiposMap, setTiposMap] = useState(new Map())
  const [TiposList, setTiposList] = useState([]) // <<-- Para el Select de Tipos

  // ----------------------------------------------------
  // ESTADOS DEL FILTRO
  // ----------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('') // Filtro por nombre
  const [selectedTipo, setSelectedTipo] = useState(0) // Filtro por Tipo (0 = Todos)
  const [usePriceRange, setUsePriceRange] = useState(false) // Checkbox para el rango de precios
  const [precioMin, setPrecioMin] = useState(''); // Precio mínimo (USAR CADENA VACÍA)
  const [precioMax, setPrecioMax] = useState(''); // Precio máximo
  const [isFiltered, setIsFiltered] = useState(false) // Controla la visibilidad del botón Reiniciar
  // ----------------------------------------------------

  //Para navegar
  const navegar = useNavigate();
  const location = useLocation();

  //Useefect para mostrar todo el listado
  useEffect(() => {
    getAllProducto();
  }, [])

  //Useeffect para los toast
  useEffect(() => {
    if (location.state && location.state.toastMessage && toastRef.current) {

      const { toastMessage, toastType } = location.state;

      toastRef.current.show(toastMessage, toastType || 'success', 3000);

      navegar(location.pathname, { replace: true, state: {} });
    }

  }, [location.state, location.pathname, navegar]);

  function getAllProducto() {
    //Obtener Tipos y crear el Map (idTipo -> nombreTipo) y la Lista (para el Select)
    listTipos().then(tipoResponse => {
      const map = new Map();
      const list = [];
      tipoResponse.data.forEach(tipo => {
        map.set(tipo.idtipo, tipo.tipo);
        list.push(tipo); // Agregar a la lista para el <select>
      });
      setTiposMap(map);
      setTiposList(list); // Establecer la lista de tipos

      return listProductos(); // Obtiene todos los productos (Activos)
    })
      .then(productoResponse => {
        setProductos(productoResponse.data);
        setIsFiltered(false); // Al cargar todos, no está filtrado.

      })
      .catch(error => {
        console.error("Error al cargar datos:", error);

      });

  }

  //Para colocarle el tipo
  const getTipoNombre = (idTipo) => {
    return TiposMap.get(idTipo) || 'N/A';
  }

  // ----------------------------------------------------
  // LÓGICA DE FILTRADO
  // ----------------------------------------------------

  // Función principal de búsqueda/filtro
  const handleSearch = () => {
    const nombre = searchTerm.trim();
    const idTipo = parseInt(selectedTipo, 10);

    let min = null;
    let max = null;
    let isPriceRangeValid = true;

    //Solo toma los valores de precio si el checkbox está activo
    if (usePriceRange) {



      //Si precioMin NO está vacío, lo parseamos. Si está vacío, queda como 'null'.
      const trimmedMin = precioMin.trim();
      if (trimmedMin !== '') {
        min = parseFloat(trimmedMin);
      }

      //Si precioMax NO está vacío, lo parseamos. Si está vacío, queda como 'null'.
      const trimmedMax = precioMax.trim();
      if (trimmedMax !== '') {
        max = parseFloat(trimmedMax);
      }

      if (trimmedMin === '' && trimmedMax === '') {
        toastRef.current.show('Ingrese el rango a filtrar.', 'warning', 3000);
        isPriceRangeValid = false; //El filtro de precio no es válido/completo
      }

      //Validación simple: si ambos son números, verifica que min <= max
      if (min !== null && max !== null && min > max) {
        toastRef.current.show('El precio mínimo no puede ser mayor al máximo.', 'warning', 3000);
        return;
      }
    }
    // --------------------------

  //2. Determinar si realmente se aplicó algún filtro
  //el filtro de precio ACTIVO solo si se ingresó min O max
  const isPriceFilterEffective = (min !== null || max !== null) && isPriceRangeValid;
 
  //El filtro general es activo si hay nombre, tipo, O el filtro de precio es efectivo
  const isSearchActive = nombre || idTipo > 0 || isPriceFilterEffective;

  if (!isSearchActive) {

   if(usePriceRange && !isPriceRangeValid){
     return;
   }
     
   //Si no hay filtros (y el rango de precio no está generando un error)
   reiniciarBusqueda();
   return;
  }

    //Si la validación de rango de precio falló (pero isSearchActive=true por otro filtro)
    if(usePriceRange && !isPriceRangeValid){
      return;
    }
    //Llamar al servicio de filtro con los parámetros
    filtrarProductos(nombre, idTipo, min, max)
      .then(response => {
        setProductos(response.data);
        setIsFiltered(true); //Se ha realizado una búsqueda (filtro activo)
      })
      .catch(error => {
        console.error("Error al filtrar productos:", error);
        setProductos([]);
        setIsFiltered(true);
      });
  };

  // Reinicio: Limpia todos los estados de filtro y carga todos los productos
  const reiniciarBusqueda = () => {
    setSearchTerm('');
    setSelectedTipo(0);
    setUsePriceRange(false);
    setPrecioMin('');
  setPrecioMax('');
    setIsFiltered(false);
    getAllProducto(); // Carga la lista original de productos activos
  };

  // Ejecutar búsqueda al presionar "Enter" en el input de nombre
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };
  // ----------------------------------------------------

  //Navegación a actualizar
  function actualizaProducto(id) {
    navegar(`/producto/edita/${id}`)
  }

  //--------------Para la eliminiación---------------
  // ... (mantener eliminarProducto - Se podría agregar el ConfirmDialog aquí también si se usa)
  function eliminarProducto(id) {
    console.log(id);
    deleteProducto(id).then((response) => {
      getAllProducto();

    }).catch(error => {
      console.error(error);
    })
  }

    // 2. Modificar manejarDesactivar para usar ConfirmDialog
  function manejarDesactivar(producto) {
    const nuevoEstado = producto.estatus === 1 ? 0 : 1;
        const accion = nuevoEstado === 0 ? 'desactivar' : 'activar';
        const mensaje = `¿Está seguro de ${accion} el producto "${producto.nombre}"?`;

        // Mostrar el diálogo de confirmación
        confirmRef.current.show(mensaje, () => {
            // Este bloque se ejecuta SOLAMENTE si el usuario confirma
            cambiarEstadoProducto(producto.id_producto)
                .then(() => {
                    console.log(`Estatus del producto ${producto.id_producto} invertido a ${nuevoEstado}.`);

                    if (toastRef.current) {
                        const toastMsg = nuevoEstado === 0 
                            ? `Producto '${producto.nombre}' Desactivado` 
                            : `Producto '${producto.nombre}' Activado`;
                        
                        const toastType = nuevoEstado === 0 ? 'warning' : 'success';

                        toastRef.current.show(toastMsg, toastType, 3000);
                    }

                    getAllProducto();
                })
                .catch(error => {
                    console.error("Error al cambiar estatus:", error);
                    if (toastRef.current) {
                        toastRef.current.show(`Error al intentar ${accion.toLowerCase()} el producto.`, 'error', 5000);
                    }
                });
        });
  }

    // 3. Modificar cambiarBotonEliminar para que pase el objeto 'producto' completo
  function cambiarBotonEliminar(producto) {
    //Si el estatus es 1 (Activo)
    if (producto.estatus === 1) {
      return (
        <button
          className='btn btn-danger sepaizq'
                    // Llama a manejarDesactivar con el objeto producto
          onClick={() => manejarDesactivar(producto)} 
        >
          Desactivar
        </button>
      )
    }
    //Si el estatus es 0 o null (Inactivo)
    else {
      return (
        <button
          className='btn btn-success sepaizq'
                    // Llama a manejarDesactivar con el objeto producto
          onClick={() => manejarDesactivar(producto)}
        >
          Activar
        </button>
      )
    }
  }

  //Navega crear cliente
  function crearProducto() {
    navegar(`/producto/crear`)

  }


  return (
    <div className="container-fluid p-4">
      <ToastNotification ref={toastRef} />
            {/* 💡 4. Renderizar el ConfirmDialog */}
            <ConfirmDialog ref={confirmRef} />
      <h2 className="text-center mb-4">Lista de Productos</h2>

      {/* ------------ INICIO DE LA SECCIÓN DE FILTRO (No modificado) ------------ */}
      <div className="mb-4 w-75 mx-auto wi-65">

        <div className="row g-3 align-items-end mb-3">

          {/* Filtro por Nombre */}
          <div className="col-md-6">

            <input
              id="nombreFilter"
              type="text"
              placeholder="Buscar por nombre..."
              className="form-control form-control-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>

          {/* Filtro por Tipo */}
          <div className="col-md-6">

            <select
              id="tipoFilter"
              className="form-select form-select-lg"
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
            >
              <option value={0}>Todos</option>
              {TiposList.map(tipo => (
                <option key={tipo.idtipo} value={tipo.idtipo}>
                  {tipo.tipo}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* */}

        {/*SEGUNDA FILA */}
        <div className="row g-3 align-items-end mb-3">
          {/* PRIMERA FILA: Nombre y Tipo */}
          {/* Checkbox para Activar Rango de Precios (Fijo en col-md-4) */}
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

          {/* Contenedor Fijo para los Inputs de Precio (col-md-4 + col-md-4 = 8/12) */}
          <div className="col-md-8 d-flex justify-content-start"> {/* Este div ocupa el espacio restante */}

            {/* Inputs de Rango de Precios (Condicional) */}
            {usePriceRange && (
              <div className="row g-3 w-100"> {/* Usamos w-100 para que esta sub-fila use todo el col-md-8 */}
                <div className="col-md-6"> {/* col-md-6 dentro del col-md-8 padre (ocupa 50% del espacio) */}
                  <input
                    id="precioMinFilter"
                    type="number"
                    className="form-control form-control-lg"
                    value={precioMin === '' ? '' : precioMin}
                    onChange={(e) => setPrecioMin(e.target.value)}
                    onKeyDown={handleKeyPress}
                    min="0.00"
                    step="0.01"
                    placeholder="Precio Mínimo"
                  />
                </div>
                <div className="col-md-6"> {/* col-md-6 dentro del col-md-8 padre (ocupa 50% del espacio) */}
                  <input
                    id="precioMaxFilter"
                    type="number"
                    className="form-control form-control-lg"
                    value={precioMax === '' ? '' : precioMax}
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
        {/* */}
        <div className="row g-3 align-items-end justify-content-center">

          {/* Botones de Buscar y Reiniciar */}
          <div className="col-md-4 d-flex">
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
      {/* ------------ FIN DE LA SECCIÓN DE FILTRO ------------ */}

      <div className="mb-4 d-flex justify-content-end">
        <button className='btn btn-info btn-princi' onClick={() => crearProducto()}>Nuevo Producto</button>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover table-bordered">

          <thead className='tableHeaderStyle'>
            <tr>
              <th>ID Producto</th>
              <th>Nombre</th>
              <th>Imagen</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {Productos.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-muted">No se encontraron productos que coincidan con los filtros aplicados.</td>
              </tr>
            ) : (
              Productos.map(producto =>

                <tr key={producto.id_producto}>
                  <td>{producto.id_producto}</td>
                  <td>{producto.nombre}</td>
                  <td>
                    {producto.imgProducto ? (
                      <img
                        src={`${IMAGE_BASE_URL}${producto.imgProducto}`}
                        alt={producto.nombre}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                        onError={(e) => { e.target.onerror = null; e.target.src = ""; }}
                      />
                    ) : (
                      <span className="text-muted fst-italic">Sin imagen</span>
                    )}
                  </td>
                  <td>{producto.descripcion}</td>
                  <td>${producto.precio.toFixed(2)}</td>

                  <td>{getTipoNombre(producto.idTipo)}</td>
                  <td>
                    <button className='btn btn-edicion' onClick={() => actualizaProducto(producto.id_producto)}>Actualizar</button>

                    {
                      cambiarBotonEliminar(producto)
                    }

                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}