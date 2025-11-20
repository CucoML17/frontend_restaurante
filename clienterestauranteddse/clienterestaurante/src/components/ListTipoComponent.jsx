import React, { useEffect, useState, useRef } from 'react'
import { listTipos, deleteTipo } from '../services/TipoService'
import { useNavigate, useLocation } from 'react-router-dom'
import ToastNotification from '../toast/ToastComponent';
// 🚀 Importar el ConfirmDialog
import ConfirmDialog from '../toast/ConfirmDialog';

export const ListTipoComponent = () => {

    const toastRef = useRef(null);
    // 💡 1. Crear la referencia para el ConfirmDialog
    const confirmRef = useRef(null);

    //Variables y constantes
    const [Tipos, setTipos] = useState([])

    const location = useLocation();
    //Para navegar y navegaciones------------
    const navegar = useNavigate();

    //El useEffect-----
    useEffect(() => {
        getAllTipo();


    }, [])

    //El ussefect para el toast
    useEffect(() => {
        if (location.state && location.state.toastMessage && toastRef.current) {

            const { toastMessage, toastType } = location.state;


            toastRef.current.show(toastMessage, toastType || 'success', 3000);

            navegar(location.pathname, { replace: true, state: {} });
        }

    }, [location.state, location.pathname, navegar]);

    function getAllTipo() {
        listTipos().then((response) => {
            setTipos(response.data);
        }).catch(error => {
            console.error(error);
        })
    }


    //Para crear
    function crearTipo() {
        navegar(`/tipo/crear`)

    }

    //Navegación a actualizar
    function actualizarTipo(id) {
        //Es la ruta que ponemos en app.jsx
        //C U I D A D O
        navegar(`/tipo/edita/${id}`)

    }

    //Fin navegaciones-------

    // 2. Función modificada para usar el ConfirmDialog
    function eliminarTipo(id, nombreTipo) {
        console.log(id);

        const message = `¿Está seguro de eliminar el Tipo "${nombreTipo}"? Esta acción no se puede deshacer.`;

        // Usar el ConfirmDialog en lugar de window.confirm
        confirmRef.current.show(message, () => {
            // Este bloque SÓLO se ejecuta si el usuario presiona "Aceptar"
            deleteTipo(id).then((response) => {
                getAllTipo();
                if (toastRef.current) {
                    toastRef.current.show(`Tipo ID ${id} eliminado correctamente.`, 'danger', 3000);
                }

            }).catch(error => {
                console.error(error);
                if (toastRef.current) {
                    toastRef.current.show(`Error al eliminar el Tipo ID ${id}.`, 'error', 5000);
                }
            })
        });
    }

    return (

        <div className="container-fluid p-4">

            <ToastNotification ref={toastRef} />
            {/* 3. Renderizar el ConfirmDialog */}
            <ConfirmDialog ref={confirmRef} />

            <h2 className="text-center mb-4">Lista de Tipos</h2>

            <button className='btn btn-info btn-princi' onClick={() => crearTipo()}>Nuevo Tipo</button>
            <br />
            <br />

            <table className="table table-striped table-hover table-bordered">

                <thead className='tableHeaderStyle'>
                    <tr>

                        <th>ID Tipo</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {

                        Tipos.map(tipo =>

                            <tr key={tipo.idtipo}>
                                <td>{tipo.idtipo}</td>
                                <td>{tipo.tipo}</td>
                                <td>{tipo.descripcion}</td>
                                <td>
                                    <button className='btn btn-edicion' onClick={() => actualizarTipo(tipo.idtipo)}>Actualizar</button>

                                    {/* 🎯 Llamamos a eliminarTipo enviando el ID y el nombre para el mensaje */}
                                    <button
                                        className='btn btn-eliminar sepaizq'
                                        onClick={() => eliminarTipo(tipo.idtipo, tipo.tipo)}
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        )
                    }
                </tbody>
            </table>
        </div>
    )
}