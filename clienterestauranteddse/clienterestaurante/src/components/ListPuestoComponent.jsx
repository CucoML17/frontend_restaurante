import React, { useEffect, useState, useRef } from 'react'

import { listPuestos, deletePuesto } from '../services/PuestoService'
import { getAllPerfiles } from '../services/AuthService'; 
import { useNavigate, useLocation } from 'react-router-dom'
import ToastNotification from '../toast/ToastComponent';
// 🚀 Importar el ConfirmDialog
import ConfirmDialog from '../toast/ConfirmDialog';


export const ListPuestoComponent = () => {

  const toastRef = useRef(null);
    // 💡 1. Crear la referencia para el ConfirmDialog
    const confirmRef = useRef(null);

  //Variables y constantes
  const [Puestos, setPuestos] = useState([])
  // 💡 NUEVO ESTADO: Almacenar los nombres de los perfiles protegidos
  const [perfilesProtegidos, setPerfilesProtegidos] = useState([]);

  //Para navegar y navegaciones------------
  const navegar = useNavigate();
  const location = useLocation();

  // El useEffect (Principal)-----
  useEffect(() => {
    getAllPuesto(); // Todos para llenar la tabla
    getPerfilesProtegidos(); // 💡 Cargar los perfiles protegidos
  }, [])

  // El useffect del toast
  useEffect(() => {
    if (location.state && location.state.toastMessage && toastRef.current) {
     
      const { toastMessage, toastType } = location.state;

      toastRef.current.show(toastMessage, toastType || 'success', 3000);

      navegar(location.pathname, { replace: true, state: {} });
    }
   
  }, [location.state, location.pathname, navegar]); 

  function getAllPuesto() {
   
    listPuestos().then((response) => {
      setPuestos(response.data);
    }).catch(error => {
      console.error("Error al listar puestos:", error);
    })
  }

  // 💡 NUEVA FUNCIÓN: Cargar los perfiles del sistema
  function getPerfilesProtegidos() {
    getAllPerfiles().then((response) => {
      // Asumiendo que PerfilDto tiene un campo llamado 'nombre' o similar
      // y que necesitamos solo una lista de strings con esos nombres
      const nombres = response.data.map(perfil => perfil.nombre);
      setPerfilesProtegidos(nombres);
    }).catch(error => {
      console.error("Error al cargar perfiles protegidos:", error);
      // Manejo de error: Puedes dejar la lista vacía o mostrar una advertencia
    });
  }

  // 💡 NUEVA FUNCIÓN: Verifica si el puesto debe estar protegido
  function isPuestoProtegido(nombrePuesto) {
    if (!nombrePuesto) return false;
   
    // Convertimos a minúsculas para una comparación que no distinga entre mayúsculas y minúsculas
    const nombrePuestoLower = nombrePuesto.toLowerCase().trim();
   
    // Verificamos si el nombre del puesto está en la lista de perfiles protegidos
    return perfilesProtegidos.some(perfil => perfil.toLowerCase().trim() === nombrePuestoLower);
  }

  //Para crear (Cambiamos la ruta y el nombre de la función)
  function crearPuesto() {
    navegar(`/puesto/crear`)

  }

  //Navegación a actualizar
  function actualizarPuesto(id) {
    navegar(`/puesto/edita/${id}`)

  }


    // 2. Modificar eliminarPuesto para usar ConfirmDialog
  function eliminarPuesto(puesto) {
    // El diálogo pide un mensaje y una función de callback (lo que ocurre si se confirma)
        confirmRef.current.show(
            `¿Está seguro de eliminar el puesto "${puesto.nombrePuesto}"? Esta acción es irreversible`,
            () => {
                // Este bloque se ejecuta SÓLO si el usuario hace clic en "Sí"
                console.log(`Intentando eliminar puesto ID: ${puesto.idPuesto}`);
                deletePuesto(puesto.idPuesto).then(() => {

                    if (toastRef.current) {
                        toastRef.current.show('Puesto eliminado correctamente.', 'danger', 3000);
                    }

                    getAllPuesto();
                    
                }).catch(error => {
                    console.error("Error al eliminar el puesto:", error);
                    if (toastRef.current) {
                        // Puedes usar el error para un mensaje más detallado si tu API lo permite
                        toastRef.current.show('Error al eliminar. Verifique que no esté en uso.', 'error', 5000);
                    }
                });
            }
        );
  }

  return (

    <div className="container-fluid p-4">
      <ToastNotification ref={toastRef} />
            {/* 💡 3. Renderizar el ConfirmDialog */}
            <ConfirmDialog ref={confirmRef} /> 
      <h2 className="text-center mb-4">Lista de Puestos</h2>

      <button className='btn btn-info btn-princi' onClick={() => crearPuesto()}>Nuevo Puesto</button>
      <br />
      <br />

      <table className="table table-striped table-hover table-bordered">

        <thead className='tableHeaderStyle'>
          <tr>

            <th>ID Puesto</th>
            <th>Nombre del Puesto</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {

            Puestos.map(puesto =>

             
              <tr key={puesto.idPuesto}>
                <td>{puesto.idPuesto}</td>
                <td>{puesto.nombrePuesto}</td>
                <td>
                  {
                    // 💡 Renderizado condicional: SÓLO muestra los botones si el puesto NO está protegido
                    !isPuestoProtegido(puesto.nombrePuesto) ? (
                      <>
                        <button
                          className='btn btn-edicion'
                          onClick={() => actualizarPuesto(puesto.idPuesto)}
                        >
                          Actualizar
                        </button>

                        <button
                          className='btn btn-eliminar sepaizq'
                                                // Se pasa el objeto puesto completo a la función
                          onClick={() => eliminarPuesto(puesto)}
                        >
                          Eliminar
                        </button>
                      </>
                    ) : (
                      // 💡 Mensaje opcional para los puestos protegidos
                      <span className='text-danger fw-bold'>Puesto con perfil</span>
                    )
                  }
                </td>
              </tr>
            )
          }
        </tbody>
      </table>
    </div>
  )
}