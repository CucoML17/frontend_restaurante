import React, { useEffect, useState, useRef } from 'react'
import { listClientes, buscaClientesByName } from '../../services/ClienteService'
import { useNavigate } from 'react-router-dom'
import ToastNotification from '../../toast/ToastComponent';

//  IMPORTACIÓN CORREGIDA: Solo necesitamos getUsuarioById desde AuthService
import { getUsuarioById } from '../../services/AuthService';

export const ListClienteCajeroComponent = () => {

    // Estados para manejar los datos y el filtro
    const [clientes, setClientes] = useState([]) // Lista final mostrada (filtrada por estatus)
    const [searchTerm, setSearchTerm] = useState('')
    const [isFiltered, setIsFiltered] = useState(false)

    // Mapa para almacenar el estatus de usuario (idUsuario => estatus)
    const [userEstatusMap, setUserEstatusMap] = useState(new Map());

    const navegar = useNavigate();
    const toastRef = useRef(null); 

    // Carga inicial de datos
    useEffect(() => {
        window.scrollTo(0, 0);
        getAllCliente();
    }, [])



    const cargarEstatusYFiltrar = (clientesData) => {
            
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

            // 1. Guardar el mapa de estatus
            setUserEstatusMap(estatusMap);

            // 2. Filtrar la lista de clientes
            const clientesFiltrados = clientesData.filter(cliente => {
                const estatus = estatusMap.get(cliente.idUsuario);
                
                // Criterio del cajero:
                // a) idUsuario === 0 (No tiene usuario asociado) -> SI lo muestra.
                // b) estatus === 1 (Usuario Activo) -> SI lo muestra.
                // c) estatus === 0 (Usuario Inactivo) -> NO lo muestra.
                return cliente.idUsuario === 0 || estatus === 1;
            });
            
            // 3. Actualizar la lista visible
            setClientes(clientesFiltrados);

        }).catch(error => console.error("Error al cargar estatus de usuarios:", error));
    };


    // Función de carga inicial (obtiene todos y luego filtra)
    function getAllCliente() {
        listClientes().then((response) => {
            cargarEstatusYFiltrar(response.data);
        }).catch(error => {
            console.error("Error al obtener la lista de clientes:", error);
        })
    }

    // Función que se dispara al cambiar el input de búsqueda
    const handleSearchTermChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Función de búsqueda (busca en el backend y luego filtra)
    function handleSearch() {
        const nombreFiltro = searchTerm.trim();
        
        if (nombreFiltro) {
            setIsFiltered(true); 
            
            buscaClientesByName(nombreFiltro).then((response) => {
                // Al buscar, recargamos el estatus y filtramos
                cargarEstatusYFiltrar(response.data);
            }).catch(error => {
                console.error("Error al buscar clientes por nombre:", error);
                setClientes([]);
            });
        } else {
            setIsFiltered(false);
            getAllCliente(); // Vuelve a cargar la lista completa y filtra por estatus
        }
    }

    // Ejecutar búsqueda al presionar "Enter" en el input
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Reinicio
    function reiniciarBusqueda() {
        setSearchTerm('');
        setIsFiltered(false);
        getAllCliente();
    }

    //Nueva ruta para crear cliente (exclusiva del cajero)
    function crearCliente() {
        navegar(`/cliente/cajero/crear`) 
    }

    // Función auxiliar para obtener el estatus de usuario como texto
    const getEstatusTexto = (idUsuario) => {
        if (idUsuario === 0) {
            // Se mantiene el comportamiento: los clientes sin usuario asociado son visibles.
            return { texto: 'No aplica', clase: 'badge text-bg-secondary' }; 
        }
        const estatus = userEstatusMap.get(idUsuario);

        if (estatus === 1) {
            return { texto: 'Activo', clase: 'badge text-bg-success' };
        } else if (estatus === 0) {
            // Aunque este caso no debería aparecer debido al filtro, lo dejamos por seguridad.
            return { texto: 'Inactivo', clase: 'badge text-bg-danger' };
        }
        return { texto: 'Cargando...', clase: 'badge text-bg-warning' };
    }


    return (
        <div className="container-fluid p-4">

            <ToastNotification ref={toastRef} /> 

            <h2 className="text-center mb-4">Lista de Clientes</h2>

            {/* DISEÑO DEL FILTRO */}
            <div className="row justify-content-center mb-3">
                <div className="col-md-8 col-lg-8">
                    <div className="row g-2 align-items-center">
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
            {/* FIN DEL DISEÑO DEL FILTRO */}

            <div className="mb-4 d-flex justify-content-end align-items-center flex-wrap">
                {/*  Botón de Nuevo Cliente con ruta corregida */}
                <button className='btn btn-info btn-princi' onClick={() => crearCliente()}>Nuevo cliente</button>
            </div>

            <div className="table-responsive">
                <table className="table table-striped table-hover table-bordered">

                    <thead className='tableHeaderStyle'>
                        <tr>
                            <th>Id Cliente</th>
                            <th>Nombre cliente</th>
                            <th>Número cliente</th>
                            <th>Correo cliente</th>
                            {/*  Reemplazamos la columna de Acciones por Estatus */}
                            <th>Estatus usuario</th> 
                        </tr>
                    </thead>

                    <tbody>
                        {clientes.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center text-muted">No se encontraron clientes que cumplan los criterios (Activo o Sin Usuario).</td>
                            </tr>) : (clientes.map(cliente => { 

                                const estatusInfo = getEstatusTexto(cliente.idUsuario);
                                
                                return (
                                    <tr key={cliente.idcliente}>
                                        <td>{cliente.idcliente}</td>
                                        <td>{cliente.nombrecliente}</td>
                                        <td>{cliente.telefono}</td>
                                        <td>{cliente.correo}</td>
                                        {/*  Columna de Estatus */}
                                        <td>
                                            <span className={estatusInfo.clase}>
                                                {estatusInfo.texto}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            }))} 

                    </tbody>
                </table>
            </div>


        </div>
    )
}