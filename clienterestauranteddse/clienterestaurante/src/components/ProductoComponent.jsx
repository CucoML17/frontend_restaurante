import React, {useState, useEffect, useRef} from 'react' // 🟢 Importamos useRef
import { crearProducto, getProducto, updateProducto, listTipos } from '../services/ProductoService'
import { useNavigate, useParams} from 'react-router-dom'
import ToastNotification from '../toast/ToastComponent';

// URL base para mostrar las imágenes existentes (Asegúrate de que este puerto sea el correcto)
const IMAGE_BASE_URL = '/imagenes/productos'; 


export const ProductoComponent = () => {

    // Los atributos del formulario
    const[nombre, setNombre] = useState('')
    const[descripcion, setDescripcion] = useState('')
    const[precio, setPrecio] = useState('') 
    const[idTipo, setIdTipo] = useState('') 
    const[estatus, setEstatus] = useState('1')

    // ESTADO PARA MANEJAR LA IMAGEN SELECCIONADA
    const[imagenFile, setImagenFile] = useState(null)
    // ESTADO PARA PREVISUALIZAR LA IMAGEN (URL)
    const[imagenPreview, setImagenPreview] = useState(null)
    // ESTADO PARA GUARDAR EL NOMBRE DE LA IMAGEN EN DB (SOLO EN EDICIÓN)
    const[imgProductoDB, setImgProductoDB] = useState('') 
    
    // La lista de tipos
    const[Tipos, setTipos] = useState([]) 

    // La id para editar de una
    const {id} = useParams();     


    const nombreRef = useRef(null);
    const descripcionRef = useRef(null);
    const precioRef = useRef(null);
    const imagenRef = useRef(null);
    const toastRef = useRef(null); // Ref para el Toast
    
    // ------------------- MANEJADORES DE CAMBIO -------------------

    const actualizaNombre = (e) =>{ 
        setNombre(e.target.value); 
    }
    const actualizaDescripcion = (e) =>{ 
        setDescripcion(e.target.value); 
    }
    const actualizaPrecio = (e) =>{ 
        setPrecio(e.target.value); 
    } 
    const actualizaIdTipo = (e) =>{ 
        setIdTipo(e.target.value); 
    }
    const actualizaEstatus = (e) =>{ 
        setEstatus(e.target.value); 
    }
    
    // MANEJADOR PARA EL CAMPO DE ARCHIVO
    const actualizaImagen = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagenFile(file); // Guarda el objeto File para enviar al backend
            setImagenPreview(URL.createObjectURL(file)); // Crea URL temporal para previsualizar
        } else {
            setImagenFile(null);
            // Si estamos editando y el usuario quita el archivo, volvemos a mostrar la imagen de la DB
            if (imgProductoDB && id) {
                 setImagenPreview(`${IMAGE_BASE_URL}${imgProductoDB}`);
            } else {
                 setImagenPreview(null);
            }
        }
    }
    
    // ------------------- MANEJO DE ERRORES Y VALIDACIÓN -------------------
    
    // Constante de error - - - - - - - -
    const[errors, setErrors] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        imagen: ''
    })
    
    // Función para validar
    function validaForm(){
        let valida = true;
        const errorsCopy = {...errors}

        //Variable para guardar la referencia al primer campo con error
        let firstErrorFieldRef = null; 

        // Validación de Nombre
        if(nombre.trim()){
            errorsCopy.nombre = '';
        }else{
            errorsCopy.nombre = 'El nombre del producto es requerido';
            valida = false;
            if (!firstErrorFieldRef) firstErrorFieldRef = nombreRef; // Guardar ref
        }

        // Validación de Descripción
        if(descripcion.trim()){
            errorsCopy.descripcion = '';
        }else{
            errorsCopy.descripcion = 'La descripción del producto es requerida';
            valida = false;
            if (!firstErrorFieldRef) firstErrorFieldRef = descripcionRef; // Guardar ref
        }

        //MODIFICACIÓN 1: Validación de Precio (Requerido y Mayor que Cero)
        const precioNumero = parseFloat(precio.trim());
        if(!precio.trim()){
            errorsCopy.precio = 'El precio del producto es requerido';
            valida = false;
            if (!firstErrorFieldRef) firstErrorFieldRef = precioRef; // Guardar ref
        } else if (isNaN(precioNumero) || precioNumero <= 0) {
            errorsCopy.precio = 'El precio debe ser un número mayor que cero (0)';
            valida = false;
            if (!firstErrorFieldRef) firstErrorFieldRef = precioRef; // Guardar ref
        } else {
            errorsCopy.precio = '';
        }
        
        // Validación de imagen: solo requerida al crear
        if (!id && !imagenFile) {
            errorsCopy.imagen = 'La imagen del producto es requerida para un nuevo producto';
            valida = false;
            if (!firstErrorFieldRef) firstErrorFieldRef = imagenRef; // Guardar ref
        } else {
            errorsCopy.imagen = '';
        }

        setErrors(errorsCopy);
        
        //MODIFICACIÓN 2: Enfocar el primer campo con error
        if (firstErrorFieldRef && firstErrorFieldRef.current) {
            firstErrorFieldRef.current.focus();
        }
        
        return valida;
    }


    const navegar = useNavigate();

    // ------------------- FUNCIÓN PRINCIPAL DE GUARDADO -------------------
    
    // Ahora sí, guardar
    function saveProducto(e){
        e.preventDefault();
        
        if(validaForm()){

            const precioDouble = parseFloat(precio);
            const idTipoInteger = parseInt(idTipo); 
        
            // Espacial para el estatus
            let estatusAEnviar;
            if (id) {
                estatusAEnviar = parseInt(estatus); 
            } else {
                estatusAEnviar = 1; // Por defecto Activo al crear
            }
            
            // Crea el objeto Producto (sin la imagen)
            const producto = {
                nombre, 
                descripcion, 
                precio: precioDouble, 
                estatus: estatusAEnviar,
                idTipo: idTipoInteger 
            }
            
            console.log("Datos a enviar:", producto);

            let message = ''; 
            let navigateOptions = {}; 
            
            // LLAMADA AL SERVICIO CON EL ARCHIVO DE IMAGEN
            if(id){
                // UPDATE: Pasamos el producto, el ID y el archivo de imagen.
                updateProducto(id, producto, imagenFile).then((response)=>{
                    console.log(response.data);
                    
                    message = `Producto ${nombre} actualizado exitosamente.`;
                    navigateOptions = { state: { toastMessage: message, toastType: 'success' }, replace: true };
                    navegar('/producto/lista', navigateOptions); 

                }).catch(error =>{
                    console.error("Error al actualizar Producto:", error);
                })
                
            }else{
                // CREATE: Pasamos el producto y el archivo de imagen.
                crearProducto (producto, imagenFile).then((response)=>{
                    console.log(response.data);

                    message = `Producto ${nombre} creado exitosamente.`;
                    navigateOptions = { state: { toastMessage: message, toastType: 'success' } };
                    navegar('/producto/lista', navigateOptions);
                }).catch(error => {
                    console.error("Error al guardar Producto:", error);
                }); 
            }
        } else {
            //MODIFICACIÓN 3: Mostrar Toast de error
            if (toastRef.current) {
                toastRef.current.show('Hubo un error, revisa los campos', 'danger');
            }
        }
    }

    // ------------------- LÓGICA DE INTERFAZ -------------------
    
    // Función para el truco del título dinámico
    function pagTitulo(){
        if(id){
            return <h4 className="text-center mb-0 titcard"> Editando Producto </h4>         
        }else{
            return <h4 className="text-center mb-0 titcard"> Insertar Producto</h4>
        }
    }     
    
    //La precarga de datos
    useEffect(() => {
        window.scrollTo(0, 0);
        //Cargar la lista de Tipos
        listTipos().then((response) => {
            const data = response.data;
            setTipos(data);
            
            if (!id && data.length > 0) { 
                setIdTipo(data[0].idtipo.toString()); 
            }
        }).catch(error =>{
            console.error("Error al cargar la lista de Tipos:", error);
        })

        // Cargar los datos en los campos si es edición:
        if(id){
            getProducto(id).then((response) => {
                const productoData = response.data;

                setNombre(productoData.nombre);
                setDescripcion(productoData.descripcion);
                setPrecio(productoData.precio.toString()); 
                setIdTipo(productoData.idTipo.toString());
                
                // Lo de estatus:
                if (productoData.estatus !== undefined && productoData.estatus !== null) {
                    setEstatus(productoData.estatus.toString());
                } 
                
                // Cargar datos de imagen existente
                if (productoData.imgProducto) {
                    setImgProductoDB(productoData.imgProducto);
                    setImagenPreview(`${IMAGE_BASE_URL}${productoData.imgProducto}`);
                }
        
            }).catch(error =>{
                console.error("Error al cargar el Producto:", error);
            })
        } 
        
        // Limpiar la URL de previsualización al desmontar
        return () => {
            if (imagenPreview && !imagenFile) {
                URL.revokeObjectURL(imagenPreview);
            }
        };

    }, [id]) // Dependencia [id] para recargar si la URL cambia

    // ------------------- RENDERIZADO -------------------

    return (
        <div className="container mt-2 mb-5">
         
            <ToastNotification ref={toastRef} />
            
            <div className="row">
                <div className="col-md-6 offset-md-3">
                    <div className="card shadow rounded-3">
                        {
                            pagTitulo()
                        }

                        <div className="card-body">
                            <form className="text-start" onSubmit={saveProducto}> 
                                
                                <div className="form-group mb-2">
                                    <label className="form-label">Nombre del Producto:</label>
                                    <input
                                        type="text"
                                        placeholder="Ingrese nombre del producto"
                                        name="nombre"
                                        value = {nombre}
                                        className={`form-control ${errors.nombre ? 'is-invalid': ''}`}
                                        onChange={actualizaNombre}
                                        ref={nombreRef}
                                    />
                                    {errors.nombre && <div className='invalid-feedback'>{errors.nombre}</div>}
                                </div>

                                <div className="form-group mb-2">
                                    <label className="form-label">Descripción:</label>
                                    <input
                                        type="text"
                                        placeholder="Ingrese la descripción"
                                        name="descripcion"
                                        value = {descripcion}
                                        className={`form-control ${errors.descripcion ? 'is-invalid': ''}`}
                                        onChange={actualizaDescripcion} 
                                        ref={descripcionRef} 
                                    />
                                    {errors.descripcion && <div className='invalid-feedback'>{errors.descripcion}</div>}
                                </div>
                                
                                <div className="form-group mb-2">
                                    <label className="form-label">Precio:</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        
                                        placeholder="Ingrese el precio (ej: 15.50)"
                                        name="precio"
                                        value = {precio}
                                        className={`form-control ${errors.precio ? 'is-invalid': ''}`}
                                        onChange={actualizaPrecio} 
                                        ref={precioRef}
                                    />
                                    {errors.precio && <div className='invalid-feedback'>{errors.precio}</div>}
                                </div>

                                <div className="form-group mb-2">
                                    <label className="form-label">Tipo de Producto:</label>
                                    <select
                                        name="idTipo"
                                        value = {idTipo}
                                        className="form-select"
                                        onChange={actualizaIdTipo}>
                                        
                                        {
                                            Tipos.map(tipo => (
                                                <option key={tipo.idtipo} value={tipo.idtipo.toString()}>
                                                    {tipo.tipo} 
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                                
                                {/* CAMPO PARA LA IMAGEN */}
                                <div className="form-group mb-2 border p-3 rounded">
                                    <label className="form-label fw-bold">Imagen del Producto:</label>
                                    {/* Indicación en modo edición */}
                                    {id && <p className="text-muted small mb-2">Deje vacío para conservar la imagen actual.</p>}
                                    <input
                                        type="file"
                                        name="imagenFile"
                                        className={`form-control ${errors.imagen ? 'is-invalid': ''}`}
                                        onChange={actualizaImagen}
                                        accept="image/*" 
                                        ref={imagenRef} 
                                    />
                                    {errors.imagen && <div className='invalid-feedback'>{errors.imagen}</div>}
                                    
                                    

                                    {/* Previsualización de la imagen */}
                                    {imagenPreview && (
                                        <div className="mb-2 text-center mt-3">
                                            <img 
                                                src={imagenPreview} 
                                                alt="Previsualización" 
                                                style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px' }}
                                                className="img-thumbnail"
                                            />
                                            {/* Mensaje de estado */}
                                            {id && !imagenFile && <p className="text-muted mt-1 small menormagbt">Imagen actual.</p>}
                                            {imagenFile && <p className="text-success mt-1 small menormagbt">Nueva imagen seleccionada.</p>}
                                        </div>
                                    )}
                                </div>

                                {/* Botón centrado */}
                                <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                                    <button className="btn btn-success" type="submit" disabled={!idTipo}>
                                        Guardar
                                    </button>
                                </div>
                                
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}