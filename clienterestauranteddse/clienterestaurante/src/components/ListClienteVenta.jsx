import React, {useEffect, useState} from 'react'

import { listClientes } from '../services/ClienteService' 
import { useNavigate} from 'react-router-dom'

export const ListClienteVenta = () => {

    //La constante
    const[Clientes, setClientes] = useState([])
    
    //El uase
    useEffect(() => {
        getAllCliente();
    }, [])

    //Todos los clientes
    function getAllCliente(){
        listClientes().then((response) => {
            setClientes(response.data);
        }).catch(error =>{
            console.error("Error al cargar clientes:", error);
        })
    }


    //Para navegar
    const navegar = useNavigate();

    //Función para seleccionar el cliente y navegar al Listado de Productos
    function seleccionarCliente(idCliente, nombreCliente){

        console.log(`Cliente ${nombreCliente} (ID: ${idCliente}) seleccionado para la venta.`);
        
        navegar(`/venta/productos/${idCliente}`) 
    }
    
    
    function crearCliente(){
        
        navegar(`/cliente/crear`)
    }


    return (
        <div className="container-fluid p-4">
            <h3 className="text-center mb-3">Selecciona el cliente que hará la venta</h3>

           
            {/* <button className='btn btn-success btn-princi' onClick={()=>crearCliente()}>Crear nuevo cliente</button>             */}


            <table className="table table-striped table-hover table-bordered">
                <thead className='tableHeaderStyle'>
                    <tr>
                        <th>Id Cliente</th>
                        <th>Nombre</th>
                        <th>Número</th>
                        <th>Correo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {
                        Clientes.map( cliente =>
                            <tr key={cliente.idcliente}>
                                <td>{cliente.idcliente}</td>
                                <td>{cliente.nombrecliente}</td>
                                <td>{cliente.telefono}</td>
                                <td>{cliente.correo}</td>
                                <td>
                                  
                                    <button className='btn btn-secun' onClick={() => seleccionarCliente(cliente.idcliente, cliente.nombrecliente)}>
                                        Elegir
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