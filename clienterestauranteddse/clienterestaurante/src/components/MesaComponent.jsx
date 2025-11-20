import React, { useState, useEffect } from 'react'

import { crearMesa, getMesa, updateMesa } from '../services/MesaService'
import { useNavigate, useParams } from 'react-router-dom'

export const MesaComponent = () => {

    //Atributos y constantes
    const [numero, setNumero] = useState('')
    const [capacidad, setCapacidad] = useState('')
    const [ubicacion, setUbicacion] = useState('')

    const [estatus, setEstatus] = useState(1)


    //La id que llega para editar
    const { id } = useParams();

    //Actualizaciones
    const actualizaNumero = (e) => {
        setNumero(e.target.value);
    }

    const actualizaCapacidad = (e) => {
        setCapacidad(e.target.value);
    }

    const actualizaUbicacion = (e) => {
        setUbicacion(e.target.value);
    }



    //Constante de error - - - - - - - -
    const [errors, setErrors] = useState({
        numero: '',
        capacidad: '',
        ubicacion: ''
    })
    // - - - - - - - -

    //Función para validar
    function validaForm() {
        let valida = true;
        const errorsCopy = { ...errors }

     
        //Validación del número de mesa
        if (numero.trim() && !isNaN(numero) && parseInt(numero) > 0) {
            errorsCopy.numero = '';
        } else {
            errorsCopy.numero = 'El número de mesa es requerido y debe ser un número positivo.';
            valida = false;
        }

        //Validación de la capacidad
        if (capacidad.trim() && !isNaN(capacidad) && parseInt(capacidad) > 0) {
            errorsCopy.capacidad = '';
        } else {
            errorsCopy.capacidad = 'La capacidad es requerida y debe ser un número positivo.';
            valida = false;
        }
        
        //Validación de ubicación
        if (ubicacion.trim()) {
            errorsCopy.ubicacion = '';
        } else {
            errorsCopy.ubicacion = 'La ubicación es requerida';
            valida = false;
        }


        setErrors(errorsCopy);

        return valida;

    }

    //Navegación
    const navegar = useNavigate();


    //--------------------------Momento CRUD--------------------------

    //Ahora sí el guardado
    function saveMesa(e) { 
        e.preventDefault();
        if (validaForm()) {
            
            //Convertir a Integer antes de enviar
            const numeroInteger = parseInt(numero);
            const capacidadInteger = parseInt(capacidad);

            //DTO de Mesa
            const mesaObj = { 
                numero: numeroInteger, 
                capacidad: capacidadInteger, 
                ubicacion,
                estatus: estatus
            } 
            console.log(mesaObj)

            let message = '';
            let navigateOptions = {};            

            if (id) {
               
                updateMesa(id, mesaObj).then((response) => {
                    console.log(response.data);

                    message = `Mesa N°${numero} en ${ubicacion} actualizada exitosamente.`;
                    navigateOptions = { state: { toastMessage: message, toastType: 'success' }, replace: true };
                    navegar('/mesa/lista', navigateOptions);

                    // navegar('/mesa/lista', { replace: true }); // Cambio de ruta

                }).catch(error => {
                    console.error("Error al actualizar Mesa:", error);
                })

            } else {
                
                crearMesa(mesaObj).then((response) => {
                    console.log(response.data);

                    message = `Mesa N°${numero} creada exitosamente.`;
                    navigateOptions = { state: { toastMessage: message, toastType: 'success' } };
                    navegar('/mesa/lista', navigateOptions);

                    // navegar('/mesa/lista'); // Cambio de ruta
                })
                    .catch(error => {
                        console.error("Error al crear Mesa:", error);
                    });
            }

        }

    }

    //Función para el truco del título dinámico si es edicion o agregar
    function pagTitulo() {
        if (id) {
        
            return <h2 className="text-center mb-0 titcard"> Editando Mesa </h2>
        } else {
            
            return <h2 className="text-center mb-0 titcard">
                Insertando Mesa
            </h2>
        }

    }

    //Obtener los datos de la mesa para precargarlos en la edición
    useEffect(() => {
        if (id) {
            
            getMesa(id).then((response) => { 
                setNumero(response.data.numero.toString()); 
                setCapacidad(response.data.capacidad.toString()); 
                setUbicacion(response.data.ubicacion);
                
                setEstatus(response.data.estatus);


            }).catch(error => {
                console.error("Error al cargar Mesa:", error);
            })
        }
    }, [id]

    )

    //Fin, comienza diseño e implementacion  
    return (

        <div className="container mt-5 mb-5">

            <div className="row">

                <div className="col-md-6 offset-md-3">
                    <div className="card shadow rounded-3">


                        {
                            pagTitulo()
                        }

                        <div className="card-body">

                            
                            <form className="text-start">

                                <div className="form-group mb-3">
                                    <label className="form-label">Número de Mesa:</label> 
                                    <input
                                        type="text"
                                        placeholder="Ingrese el número de mesa"
                                        name="numero" 
                                        value={numero}
                                        className={`form-control ${errors.numero ? 'is-invalid' : ''}`}
                                        onChange={actualizaNumero} 
                                    />
                                    {errors.numero && <div className='invalid-feedback'>{errors.numero}</div>}
                                </div>
                                
                                <div className="form-group mb-3">
                                    <label className="form-label">Capacidad:</label> 
                                    <input
                                        type="text"
                                        placeholder="Ingrese la capacidad de personas"
                                        name="capacidad" 
                                        value={capacidad}
                                        className={`form-control ${errors.capacidad ? 'is-invalid' : ''}`}
                                        onChange={actualizaCapacidad} 
                                    />
                                    {errors.capacidad && <div className='invalid-feedback'>{errors.capacidad}</div>}
                                </div>

                                <div className="form-group mb-3">
                                    <label className="form-label">Ubicación (Ej: Terraza, Piso 1, Balcón):</label> 
                                    <input
                                        type="text"
                                        placeholder="Ingrese la ubicación de la mesa"
                                        name="ubicacion" 
                                        value={ubicacion}
                                        className={`form-control ${errors.ubicacion ? 'is-invalid' : ''}`}
                                        onChange={actualizaUbicacion} 
                                    />
                                    {errors.ubicacion && <div className='invalid-feedback'>{errors.ubicacion}</div>}
                                </div>


                                <button className="btn btn-success" onClick={saveMesa}>Guardar</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}