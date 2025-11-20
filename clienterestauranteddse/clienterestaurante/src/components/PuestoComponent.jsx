import React, { useState, useEffect } from 'react'
import { crearPuesto, getPuesto, updatePuesto, listPuestos } from '../services/PuestoService' // 💡 Importar listPuestos
import { useNavigate, useParams } from 'react-router-dom'

export const PuestoComponent = () => {

    //Atributos: Solo necesitamos el nombre del puesto
    const [nombrePuesto, setNombrePuesto] = useState('')

    // 💡 NUEVOS ESTADOS para la validación de unicidad
    const [puestosExistentes, setPuestosExistentes] = useState([]); // Almacena todos los puestos
    const [loadingData, setLoadingData] = useState(true); // Controla la carga inicial de datos (puestos y edición)
    const [isSaving, setIsSaving] = useState(false); // Para deshabilitar el botón mientras se guarda/valida


    //La id que llega para editar
    const { id } = useParams();

    //Actualizaciones
    const actualizaNombrePuesto = (e) => {
        setNombrePuesto(e.target.value);
    }



    // Constante de error - - - - - - - -
    const [errors, setErrors] = useState({
        nombrePuesto: '',
        
    })
    // - - - - - - - -

    //Función para validar (Solo requeridos)
    function validaFormBase() {
        let valida = true;
        const errorsCopy = { ...errors }

        if (nombrePuesto.trim()) {
            // Asegurarse de no sobrescribir el error de unicidad si ya existe
            if (errorsCopy.nombrePuesto === 'El nombre del Puesto es requerido') {
                errorsCopy.nombrePuesto = '';
            }
        } else {
            errorsCopy.nombrePuesto = 'El nombre del Puesto es requerido';
            valida = false;
        }

        setErrors(errorsCopy);

        return valida;

    }

    //Navegación
    const navegar = useNavigate();


    // 💡 Hook para cargar la lista de puestos existentes y los datos en modo edición
    useEffect(() => {
        const loadPuestoData = async () => {
            setLoadingData(true);
            try {
                // 1. Cargar lista de puestos para validación de unicidad
                const listResponse = await listPuestos();
                setPuestosExistentes(listResponse.data);

                // 2. Cargar datos si es edición
                if (id) {
                    const puestoResponse = await getPuesto(id);
                    setNombrePuesto(puestoResponse.data.nombrePuesto);
                }
            } catch (error) {
                console.error("Error al cargar datos del puesto:", error);
                // Aquí podrías mostrar una alerta o mensaje de error al usuario
            } finally {
                setLoadingData(false);
            }
        };

        loadPuestoData();

    }, [id]);


    //Momento CRUD (Ahora es ASÍNCRONA)
    //Guardado y editado
    async function savePuesto(e) { 
        e.preventDefault();
        
        // 1. Validación de campos requeridos
        if (!validaFormBase()) {
            return;
        }
        
        // 2. Validación de UNICIDAD
        setIsSaving(true); 
        
        const nombrePuestoTrimmed = nombrePuesto.trim();
        let errorsCopy = { ...errors };

        // Buscamos si existe otro puesto con el mismo nombre (ignorando mayús/minús)
        // La condición: Coincide el nombre Y el ID es diferente al que estamos editando
        const puestoDuplicado = puestosExistentes.find(p => 
            p.nombrePuesto.toLowerCase().trim() === nombrePuestoTrimmed.toLowerCase() && 
            p.idPuesto != id // 🔑 CLAVE: Ignorar si es el mismo registro (Modo Edición)
        );

        if(puestoDuplicado){
            errorsCopy.nombrePuesto = 'Ya existe un Puesto con este nombre. Escoge otro.';
            setErrors(errorsCopy);
            setIsSaving(false);
            return; // Detenemos la ejecución si hay duplicado
        } else {
            // Si la validación de unicidad pasa, limpiamos el error de unicidad
            errorsCopy.nombrePuesto = '';
            setErrors(errorsCopy);
        }


        // 3. CONTINUAR CON EL CRUD (Si no hubo errores)
        const puestoObj = { nombrePuesto: nombrePuestoTrimmed } 
        console.log(puestoObj)

        let message = '';
        let navigateOptions = {};          

        try {
            if (id) {
                // Modo Edición
                await updatePuesto(id, puestoObj);
                message = 'Puesto actualizado exitosamente.';
                navigateOptions = { state: { toastMessage: message, toastType: 'success' }, replace: true };
            } else {
                // Modo Creación
                await crearPuesto(puestoObj);
                message = 'Puesto creado exitosamente.';
                navigateOptions = { state: { toastMessage: message, toastType: 'success' } };
            }

            navegar('/puesto/lista', navigateOptions);

        } catch (error) {
            console.error("Error en la operación CRUD:", error);
            alert("Ocurrió un error en el servidor al guardar el Puesto.");

        } finally {
            setIsSaving(false); // Detenemos el indicador de guardado
        }

    }

    //Función para el truco del título dinámico si es edicion o agregar
    function pagTitulo() {
        if (id) {
        
            return <h2 className="text-center mb-0 titcard"> Editando Puesto </h2>
        } else {
            
            return <h2 className="text-center mb-0 titcard">
                Insertando Puesto
            </h2>
        }

    }

    // Si los datos aún se están cargando
    if(loadingData){
        return <div className="text-center mt-5">Cargando datos...</div>
    }


    //Fin, comienza diseño e implementacion  
    const isDisabled = isSaving || loadingData; // Deshabilitar si se está guardando o cargando datos iniciales
    
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
                                    <label className="form-label">Nombre del Puesto:</label> 
                                    <input
                                        type="text"
                                        placeholder="Ingrese el nombre del puesto"
                                        name="nombrePuesto" 
                                        value={nombrePuesto}
                                        className={`form-control ${errors.nombrePuesto ? 'is-invalid' : ''}`}
                                        onChange={actualizaNombrePuesto} 
                                        disabled={isDisabled}
                                    />
                                    {errors.nombrePuesto && <div className='invalid-feedback'>{errors.nombrePuesto}</div>}
                                </div>

                                <button 
                                    className="btn btn-success" 
                                    onClick={savePuesto}
                                    disabled={isDisabled} // Controla el estado del botón
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}