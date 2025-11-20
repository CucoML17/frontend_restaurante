import React, {useState, useEffect} from 'react'
// 💡 Importar listTipos del servicio (asumo que está en TipoService)
import { crearTipo, getTipo, updateTipo, listTipos } from '../services/TipoService' 
import { useNavigate, useParams} from 'react-router-dom'

export const TipoComponent = () => {

    //Atributos
    const[tipo, setTipo] = useState('')
    const[descripcion, setDescripcion] = useState('')
    
    // 💡 NUEVOS ESTADOS para la validación de unicidad
    const [tiposExistentes, setTiposExistentes] = useState([]); // Almacena todos los tipos
    const [loadingList, setLoadingList] = useState(true); // Para manejar el estado de carga de la lista
    const [isSaving, setIsSaving] = useState(false); // Para deshabilitar el botón mientras se guarda/valida
    
    //La id que llega para editar
    const {id} = useParams();

    //Actualizaciones
    const actualizaTipo = (e) =>{ 
        setTipo(e.target.value);
    }
    const actualizaDescripcion = (e) =>{ 
        setDescripcion(e.target.value);
    }


    // Constante de error - - - - - - - -
    const[errors, setErrors] = useState({
        tipo: '',
        descripcion: ''
    })
    // - - - - - - - -

    //Función para validar (Ahora solo Sincrónico)
    function validaFormBase(){
        let valida = true;
        const errorsCopy = {...errors}

        // 1. Validación de campo requerido para 'tipo'
        if(tipo.trim()){
            errorsCopy.tipo = '';
        }else{
            errorsCopy.tipo = 'El Tipo es requerido';
            valida = false;
        }

        // 2. Validación de campo requerido para 'descripcion'
        if(descripcion.trim()){
            errorsCopy.descripcion = '';
        }else{
            errorsCopy.descripcion = 'La descripción es requerida';
            valida = false;
        }
            
        // Los errores de unicidad se manejan en saveTipo (Validación asíncrona)
        setErrors(errorsCopy);
        
        return valida;
    }

    //Navegación
    const navegar = useNavigate();


    // 💡 Hook para cargar la lista de tipos existentes al inicio
    useEffect(() => {
        listTipos()
            .then(response => {
                setTiposExistentes(response.data);
                setLoadingList(false);
            })
            .catch(error => {
                console.error("Error al cargar la lista de tipos:", error);
                setLoadingList(false);
                // Aquí podrías establecer un error general si la lista no carga
            });

        // Lógica existente para cargar datos en edición
        if(id){
            getTipo(id).then((response) => {
                setTipo(response.data.tipo);
                setDescripcion(response.data.descripcion);
            }).catch(error =>{
                console.error("Error al obtener Tipo para edición:", error);
            })
        }
    }, [id]);


    //Momento CRUD (Ahora es ASÍNCRONA)
    //Guardado y editado
    async function saveTipo(e){
        e.preventDefault();
        
        // 1. Ejecutar validación sincrónica base
        if(!validaFormBase()){
            return;
        }
        
        // 2. Validación de UNICIDAD ASÍNCRONA
        // Deshabilitar el botón y mostrar loading
        setIsSaving(true); 
        
        const tipoTrimmed = tipo.trim(); // Usar el tipo limpio
        let errorsCopy = {...errors};

        // Encontramos si existe otro tipo con el mismo nombre (ignorando mayús/minús)
        // La lógica: Coincide el nombre Y el ID es diferente al que estamos editando (id)
        const tipoDuplicado = tiposExistentes.find(t => 
            t.tipo.toLowerCase() === tipoTrimmed.toLowerCase() && 
            t.idtipo != id // 🔑 CLAVE: Ignorar si es el mismo registro que estamos editando
        );

        if(tipoDuplicado){
            errorsCopy.tipo = 'Ya existe un Tipo con este nombre. Escoge otro.';
            setErrors(errorsCopy);
            setIsSaving(false);
            return; // Detenemos la ejecución si hay duplicado
        } else {
            // Si la validación de unicidad pasa, limpiamos el error de unicidad si existía.
            errorsCopy.tipo = '';
            setErrors(errorsCopy);
        }

        // 3. CONTINUAR CON EL CRUD (Si no hubo errores)
        const tipoObj = {tipo: tipoTrimmed, descripcion} 
        console.log(tipoObj)

        let message = '';
        let navigateOptions = {};          

        try {
            if(id){
                await updateTipo(id, tipoObj);
                message = 'Tipo actualizado exitosamente.';
                navigateOptions = { state: { toastMessage: message, toastType: 'success' }, replace: true };
            } else {
                await crearTipo(tipoObj);
                message = 'Tipo creado exitosamente.';
                navigateOptions = { state: { toastMessage: message, toastType: 'success' } };
            }

            // Navegación exitosa
            navegar('/tipo/lista', navigateOptions);

        } catch(error) {
            console.error("Error en la operación CRUD:", error);
            // Manejo de errores de la API (ej. un 500)
            alert("Ocurrió un error en el servidor al guardar el Tipo.");
        } finally {
            setIsSaving(false); // Detenemos el indicador de guardado
        }
    }

    //Función para el truco del título dinámico si es edicion o agregar
    function pagTitulo(){
        if(id){
            return <h2 className="text-center mb-0 titcard"> Editando Tipo </h2>        
        }else{
            return <h2 className="text-center mb-0 titcard"> Insertando Tipo </h2>
        }
    }

    // El indicador de carga general
    if(loadingList){
        return <div className="text-center mt-5">Cargando lista de tipos para validación...</div>
    }

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
                                    <label className="form-label">Nombre del Tipo:</label>
                                    <input
                                        type="text"
                                        placeholder="Ingrese el nombre del tipo"
                                        name="tipo"
                                        value = {tipo}
                                        className={`form-control ${errors.tipo ? 'is-invalid': ''}`}
                                        onChange={actualizaTipo}
                                        disabled={isSaving}
                                    />
                                    {errors.tipo && <div className='invalid-feedback'>{errors.tipo}</div>}
                                </div>
                                
                                
                                <div className="form-group mb-3">
                                    <label className="form-label">Descripción:</label>
                                    <input
                                        type="text"
                                        placeholder="Ingrese la descripción del tipo"
                                        name="descripcion"
                                        value = {descripcion}
                                        className={`form-control ${errors.descripcion ? 'is-invalid': ''}`}
                                        onChange={actualizaDescripcion}
                                        disabled={isSaving}
                                    />
                                    {errors.descripcion && <div className='invalid-feedback'>{errors.descripcion}</div>}
                                </div>

                        
                                <button 
                                    className="btn btn-success" 
                                    onClick={saveTipo}
                                    disabled={isSaving} // Deshabilitado durante la validación y guardado
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