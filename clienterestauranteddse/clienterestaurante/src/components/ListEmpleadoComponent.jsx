import React, { useEffect, useState, useRef } from 'react'
import { deleteEmpleado, listEmpleados, listPuestos, buscarEmpleados } from '../services/EmpleadoService'

import { useNavigate, useParams, useLocation } from 'react-router-dom'
import ToastNotification from '../toast/ToastComponent';

import { getUsuarioById, toggleUserEstatus } from '../services/AuthService';

//Importar el ConfirmDialog
import ConfirmDialog from '../toast/ConfirmDialog';

export const ListEmpleadoComponent = () => {

  const [userEstatusMap, setUserEstatusMap] = useState(new Map());

  //El toast
  const toastRef = useRef(null);
    // 💡 1. Crear la referencia para el ConfirmDialog
    const confirmRef = useRef(null);

  //Parametros pasados por la URL
  const { flag, idreserva, idcliente } = useParams();
  const targetFlag = parseInt(flag, 10) || 0;

  //Constantes
  const idReservaNum = parseInt(idreserva, 10) || null;
  const idClienteNum = parseInt(idcliente, 10) || null;


  const [empleadosOriginales, setEmpleadosOriginales] = useState([])

  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([])



  const [PuestosMap, setPuestosMap] = useState(new Map())

  const [filtroNombre, setFiltroNombre] = useState('')


  // [NUEVOS ESTADOS]
  const [selectedPuestoId, setSelectedPuestoId] = useState('Todos'); // ID del puesto seleccionado (string 'Todos' o idTipo numérico)
  const [PuestosList, setPuestosList] = useState([]); // Lista de objetos Puesto para el desplegable
  const [isFiltered, setIsFiltered] = useState(false);

  //Para navegar
  const navegar = useNavigate();
  const location = useLocation();

  //El use effect
  useEffect(() => {
    window.scrollTo(0, 0);
    getAllEmpleados();
  }, [targetFlag])

  useEffect(() => {
    if (location.state && location.state.toastMessage && toastRef.current) {

      const { toastMessage, toastType } = location.state;

      //Mostrar el toast
      toastRef.current.show(toastMessage, toastType || 'success', 3000);

      const currentPath = `/empleado/lista/${targetFlag}/${idReservaNum || 0}/${idClienteNum || 0}`;
      navegar(currentPath, { replace: true, state: {} });
    }

  }, [location.state, location.pathname, navegar, targetFlag, idReservaNum, idClienteNum]);


  // 💡 2. Función modificada para usar ConfirmDialog
  function toggleEstatusUsuario(idUsuario, currentEstatus) {
    if (idUsuario === 0) return; // No se puede alternar si no hay usuario

    const accion = currentEstatus === 1 ? 'desactivar' : 'activar';
        const mensaje = `¿Está seguro de ${accion} a este empleado?`;
        
        confirmRef.current.show(
            mensaje,
            () => {
                // Lógica de toggleUserEstatus (lo que estaba en el `then` del window.confirm)
                toggleUserEstatus(idUsuario).then(response => {
                    const nuevoEstatus = response.data.estatus;
                    const toastMsg = `Usuario ${nuevoEstatus === 1 ? 'activado' : 'desactivado'} correctamente.`;

                    if (toastRef.current) {
                        toastRef.current.show(toastMsg, nuevoEstatus === 1 ? 'success' : 'danger', 3000);
                    }

                    // Actualizar el mapa local después de la operación exitosa
                    setUserEstatusMap(prevMap => {
                        const newMap = new Map(prevMap);
                        newMap.set(idUsuario, nuevoEstatus);
                        return newMap;
                    });

                }).catch(error => {
                    console.error("Error al alternar estatus del usuario:", error);
                    if (toastRef.current) {
                        toastRef.current.show("Error al cambiar el estatus del usuario.", 'error', 5000);
                    }
                });
            }
        );
  }

  // La función para obtener todos los empleados
  function getAllEmpleados() {
    // 1. Cargar Puestos
    listPuestos().then(puestoResponse => {
      const puestosData = puestoResponse.data;
      const map = new Map();
      puestosData.forEach(puesto => {
        map.set(puesto.idPuesto, puesto.nombrePuesto);
      });
      setPuestosMap(map);
      setPuestosList(puestosData); // <-- 🚩 Guardamos la lista para el select

      // 2. Cargar Empleados
      return listEmpleados();
    }).then(empleadoResponse => {
      let empleadosData = empleadoResponse.data;

      // Si el flag es 1 o 2 (Reserva/Venta), filtramos solo a VENDEDORES (idPuesto === 4)
      if (targetFlag === 1 || targetFlag === 2) {
        empleadosData = empleadosData.filter(empleado => empleado.idPuesto === 4);
      }

      setEmpleadosOriginales(empleadosData);
      setEmpleadosFiltrados(empleadosData);
      setIsFiltered(false); // Al cargar, no está filtrado

      // NUEVA LÓGICA DE CARGA DE ESTATUS DE USUARIO (AQUÍ ES DONDE VA)
      const userPromises = empleadosData
        .filter(e => e.idUsuario && e.idUsuario > 0)
        .map(e => getUsuarioById(e.idUsuario));

      // No esperamos aquí, la función sigue y el map se actualizará.
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
      // FIN DE LA NUEVA LÓGICA

    }).catch(error => {
      console.error("Error al cargar datos:", error);
    });
  }

  //Función para colocarle el nombre del puesto
  const getPuestoNombre = (idPuesto) => {
    return PuestosMap.get(idPuesto) || 'N/A';
  }

  //------------------- Lógica de Filtrado (Buscar por Nombre) -------------------

  // Función principal de búsqueda/filtro
  function handleSearch() {
    const nombre = filtroNombre.trim();
    const idPuesto = selectedPuestoId === 'Todos' ? 0 : parseInt(selectedPuestoId, 10);

    // Determinar si *algún* filtro está activo
    const isSearchActive = nombre || idPuesto > 0;

    if (!isSearchActive) {
      // Si no hay filtros activos, reiniciamos la vista (muestra todos los originales)
      reiniciarFiltros();
      return;
    }

    // Llamar al servicio de filtro con los parámetros
    buscarEmpleados(nombre, idPuesto) //
      .then(response => {
        let resultados = response.data;

        if (targetFlag === 1 || targetFlag === 2) {
          resultados = resultados.filter(empleado => empleado.idPuesto === 4);
        }

        setEmpleadosFiltrados(resultados);
        setIsFiltered(true); // Filtro aplicado
      })
      .catch(error => {
        console.error("Error al filtrar empleados:", error);
        setEmpleadosFiltrados([]);
        setIsFiltered(true);
      });
  }

  // Lógica de Reinicio (Limpia inputs y recarga la lista original)
  function reiniciarFiltros() {
    setFiltroNombre('');
    setSelectedPuestoId('Todos');

    // Recargar la lista original. Si targetFlag es 1 o 2, ya aplica el filtro de VENDEDORES.
    getAllEmpleados();
  }

  // Handler para presionar Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Handlers para actualizar estados
  const handleSearchTermChange = (e) => {
    setFiltroNombre(e.target.value);
  };

  const handlePuestoChange = (e) => {
    setSelectedPuestoId(e.target.value);
  };

  //------------------- Fin Lógica de Filtrado -------------------

  //Funciones de navegación-------------------

  //Navegación a actualizar
  function actualizaEmpleado(id) {
    navegar(`/empleado/editar/${id}`)
  }

  // 💡 3. Eliminación con ConfirmDialog
  function eliminarEmpleado(empleado) {
        confirmRef.current.show(
            `¿Está seguro de eliminar al empleado **${empleado.nombre}** (ID: ${empleado.idEmpleado})? Esta acción no se puede deshacer.`,
            () => {
                deleteEmpleado(empleado.idEmpleado).then(() => {
                    if (toastRef.current) {
                        toastRef.current.show('Empleado eliminado correctamente.', 'danger', 3000);
                    }
                    getAllEmpleados();
                }).catch(error => {
                    console.error("Error al eliminar empleado:", error);
                    if (toastRef.current) {
                        toastRef.current.show("Error al eliminar el empleado.", 'error', 5000);
                    }
                })
            }
        );
  }

  //Navega crear empleado
  function crearEmpleado() {
    navegar(`/empleado/crear`)
  }

  //Elegir Empleado para Reserva
  function elegirEmpleadoReserva(idEmpleado) {


    if (targetFlag === 1 && idReservaNum && idClienteNum) {

      console.log(`Empleado ID: ${idEmpleado} elegido para atender la RESERVA ID: ${idReservaNum} del CLIENTE ID: ${idClienteNum}`);

      navegar(`/venta/productos/${idClienteNum}/1/${idReservaNum}/${idEmpleado}`);

    } else {
      console.log(`Error: Flag de reserva no detectado o IDs de contexto faltantes.`);
    }
  }
  //Elegir Empleado para Venta
  function elegirEmpleadoVenta(idEmpleado) {

    if (targetFlag === 2 && idClienteNum) {


      console.log(`Empleado ID: ${idEmpleado} elegido para la Venta DIRECTA del CLIENTE ID: ${idClienteNum}`);


      navegar(`/venta/productos/${idClienteNum}/2/0/${idEmpleado}`);

    } else {
      console.log(`Error: Flag de venta directa no detectado o ID de cliente faltante.`);
    }
  }


  function pagTitulo() {
    if (targetFlag === 1) {
      return <h2 className="text-center mb-4">Seleccionar el Empleado que atenderá la reserva</h2>
    } else if (targetFlag === 2) {
      return <h2 className="text-center mb-4">Seleccionar el Empleado que atenderá la venta</h2>
    } else {
      return <h2 className="text-center mb-4">Lista de Empleados</h2>
    }
  }



  // Nueva función auxiliar
  const getBotonAccionUsuario = (idUsuario) => {
    if (idUsuario === 0) {
      return { texto: 'Sin usuario', clase: 'btn-secondary', handler: null };
    }

    const estatus = userEstatusMap.get(idUsuario);

    if (estatus === 1) {
      return { texto: 'Desactivar', clase: 'btn-danger', handler: () => toggleEstatusUsuario(idUsuario, 1) };
    } else if (estatus === 0) {
      return { texto: 'Activar', clase: 'btn-success', handler: () => toggleEstatusUsuario(idUsuario, 0) };
    }

    // Mientras se carga
    return { texto: 'Cargando...', clase: 'btn-warning', handler: null };
  }

  return (
    <div className="container-fluid p-4">
      <ToastNotification ref={toastRef} />
            {/* 💡 4. Renderizar el ConfirmDialog */}
            <ConfirmDialog ref={confirmRef} />
      {pagTitulo()}


      {/* ------------ INICIO DE LA SECCIÓN DE FILTRO ------------ */}
      <div className="mb-4 w-75 mx-auto">
        <div className="row g-3 align-items-end mb-3">

          {/* Filtro por Nombre (col-md-5) */}
          <div className="col-md-6">
            <label htmlFor="nombreFilter" className="form-label visually-hidden">Nombre</label>
            <input
              id="nombreFilter"
              type="text"
              placeholder="Buscar por nombre..."
              className="form-control form-control-lg"
              value={filtroNombre}
              onChange={handleSearchTermChange}
              onKeyDown={handleKeyPress}
            />
          </div>

          {/* Filtro por Puesto (col-md-4) */}
          <div className="col-md-6">
            <label htmlFor="puestoFilter" className="form-label visually-hidden">Puesto</label>
            <select
              id="puestoFilter"
              className="form-select form-select-lg"
              value={selectedPuestoId}
              onChange={handlePuestoChange}
            >
              <option value="Todos">Todos los Puestos</option>
              {PuestosList.map(puesto => (
                // 🚩 Opcional: Si targetFlag es 1 o 2, solo mostramos el Puesto ID 3 (Vendedor)
                ((targetFlag === 1 || targetFlag === 2) && puesto.idPuesto !== 4) ? null :
                  <option key={puesto.idPuesto} value={puesto.idPuesto.toString()}>
                    {puesto.nombrePuesto}
                  </option>
              ))}
            </select>
          </div>


        </div>


        <div className="row g-3 align-items-end justify-content-center">
          {/* Botones (col-md-3) */}
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

      {targetFlag === 0 && (
        <>
          <button className='btn btn-info btn-princi' onClick={() => crearEmpleado()}>Nuevo Empleado</button>
          <br />
          <br />
        </>
      )}

      <div className="table-responsive">
        <table className="table table-striped table-hover table-bordered">

          <thead className='tableHeaderStyle'>
            <tr>
              <th>ID Empleado</th>
              <th>Nombre</th>
              <th>Puesto</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {empleadosFiltrados.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center text-muted">
                  No se encontraron empleados que coincidan con la búsqueda.
                </td>
              </tr>
            )}
            {
              // Utilizamos bloque de función para poder declarar la variable 'botonConfig'
              empleadosFiltrados.map(empleado => {

                // Declaramos la constante localmente
                const botonConfig = getBotonAccionUsuario(empleado.idUsuario);

                // Retornamos el JSX para la fila
                return (
                  <tr key={empleado.idEmpleado}>
                    <td>{empleado.idEmpleado}</td>
                    <td>{empleado.nombre}</td>
                    <td>{getPuestoNombre(empleado.idPuesto)}</td>

                    <td>

                      {targetFlag === 0 ? (
                        <>
                          <button className='btn btn-edicion' onClick={() => actualizaEmpleado(empleado.idEmpleado)}>
                            Actualizar
                          </button>

                          {/* Botón de Desactivar/Activar o Etiqueta de Sin usuario */}
                          <button
                            className={`btn ${botonConfig.clase} sepaizq`}
                            onClick={botonConfig.handler}
                            disabled={botonConfig.handler === null} // Deshabilitar si es 'Sin usuario' o 'Cargando'
                          >
                            {botonConfig.texto}
                          </button>

                                                {/* Botón de Eliminar con ConfirmDialog */}
                                                <button
                                                    className='btn btn-eliminar sepaizq d-none'
                                                    onClick={() => eliminarEmpleado(empleado)}
                                                >
                                                    Eliminar
                                                </button>
                        </>
                      ) : targetFlag === 1 ? (

                        <button
                          className='btn btn-success'
                          onClick={() => elegirEmpleadoReserva(empleado.idEmpleado)}
                        >
                          Elegir
                        </button>
                      ) : targetFlag === 2 ? (

                        <button
                          className='btn btn-success'
                          onClick={() => elegirEmpleadoVenta(empleado.idEmpleado)}
                        >
                          Elegir
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}