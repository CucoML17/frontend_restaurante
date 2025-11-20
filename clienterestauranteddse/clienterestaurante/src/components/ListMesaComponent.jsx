import React, { useEffect, useState, useRef } from 'react'

import { listMesas, deleteMesa } from '../services/MesaService'
import { useNavigate, useLocation } from 'react-router-dom'
import ToastNotification from '../toast/ToastComponent';

import ConfirmDialog from '../toast/ConfirmDialog';

export const ListMesaComponent = () => {

  const toastRef = useRef(null);
    // 🚀 1. Crear la referencia para el ConfirmDialog
    const confirmRef = useRef(null);


  //Variables
  const [Mesas, setMesas] = useState([])
 
  //Para navegar
  const navegar = useNavigate();
  const location = useLocation();

  //El useEffect
  useEffect(() => {
    getAllMesas();
  }, [])

  //Useeffect para el toast
  useEffect(() => {
    if (location.state && location.state.toastMessage && toastRef.current) {
     
      const { toastMessage, toastType } = location.state;

     
      toastRef.current.show(toastMessage, toastType || 'success', 3000);
     
     
      navegar(location.pathname, { replace: true, state: {} });
    }
   
  }, [location.state, location.pathname, navegar]); 

  //Función para obtener todas las Mesas
  function getAllMesas() {
    listMesas().then((response) => {
      setMesas(response.data);
    }).catch(error => {
      console.error(error);
    })
  }




  //Navegación a actualizar
  function actualizaMesa(id) {

    navegar(`/mesa/edita/${id}`)

  }

    // 🚀 2. Función de eliminación modificada para usar ConfirmDialog
  function eliminarMesa(mesa) {
        
        confirmRef.current.show(
            `¿Está seguro de eliminar la mesa #${mesa.numero}? Esta acción no se puede deshacer.`,
            () => {
                // Lógica de eliminación que solo se ejecuta al confirmar
                console.log(`Intentando eliminar mesa con ID: ${mesa.idMesa}`);
                deleteMesa(mesa.idMesa).then(() => {
                    if (toastRef.current) {
                        toastRef.current.show(`Mesa con ID: ${mesa.idMesa} eliminada correctamente.`, 'danger', 3000);
                    }     
                    getAllMesas();
                }).catch(error => {
                    console.error("Error al eliminar mesa:", error);
                    if (toastRef.current) {
                        toastRef.current.show("Error al eliminar la mesa. Verifique que no esté en uso.", 'error', 5000);
                    }
                })
            }
        );
  }

  //Navega crear mesa
  function crearMesa() {
    navegar(`/mesa/crear`)

  }


  //Confirmar atributos con consola
  console.log("Mesas recibidas desde el backend: ", Mesas);
  console.log("Mesas recibidas desde el backend: ", JSON.stringify(Mesas, null, 2));

  return (
    <div className="container-fluid p-4">
      <ToastNotification ref={toastRef} />
            {/* 🚀 3. Renderizar el ConfirmDialog */}
            <ConfirmDialog ref={confirmRef} />
      <h2 className="text-center mb-4">Lista de Mesas</h2>

      <button className='btn btn-info btn-princi' onClick={() => crearMesa()}>Nueva Mesa</button>
      <br/>
      <br/>

      <table className="table table-striped table-hover table-bordered">
        <thead className='tableHeaderStyle'>
          <tr>
            <th>ID Mesa</th>
            <th>Número</th>
            <th>Capacidad</th>
            <th>Ubicación</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {
           
            Mesas.map(mesa =>
             
              <tr key={mesa.idMesa}>
                <td>{mesa.idMesa}</td>
                <td>{mesa.numero}</td>
                <td>{mesa.capacidad}</td>
                <td>{mesa.ubicacion}</td>
                <td>

                  <button className='btn btn-edicion' onClick={() => actualizaMesa(mesa.idMesa)}> Actualizar </button>

                                    {/* Nota: Se pasa el objeto 'mesa' completo a eliminarMesa para tener su número en el mensaje de confirmación */}
                  <button className='btn btn-eliminar sepaizq' onClick={() => eliminarMesa(mesa)}> Eliminar </button>

                </td>

              </tr>

            )

          }

        </tbody>
      </table>


    </div>
  )
}