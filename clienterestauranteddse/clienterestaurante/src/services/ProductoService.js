import axios from "axios";

const REST_API_BASE_URL = '/api/producto'
const REST_API_BASE_URL_TIPO = '/api/tipo';

export const listProductos  = () => axios.get(REST_API_BASE_URL + '/listat');

export const listTipos  = () => axios.get(REST_API_BASE_URL_TIPO + '/listat');

// export const crearProducto = (producto) => axios.post(REST_API_BASE_URL, producto);

export const crearProducto = (producto, imagenFile) => {
    
    const formData = new FormData();
    
    // 1. Agregar los datos del producto como RequestParams
    formData.append('nombre', producto.nombre);
    formData.append('descripcion', producto.descripcion);
    formData.append('precio', producto.precio);
    formData.append('estatus', producto.estatus);
    formData.append('idTipo', producto.idTipo);

    // 2. Agregar el archivo de imagen (solo si existe)
    if (imagenFile) {
        // 'imagenFile' debe coincidir con el @RequestParam("imagenFile") de tu Controller
        formData.append('imagenFile', imagenFile); 
    }

    // 3. Enviar el FormData. Axios establecerá automáticamente el Content-Type: multipart/form-data
    return axios.post(REST_API_BASE_URL + '/guardar', formData);
};


//Recupera
export const getProducto = (productoId) => axios.get(REST_API_BASE_URL + '/buscaid' + '/' + productoId);

//El método que modifica/update
//export const updateProducto = (productoId, producto) =>  axios.put(REST_API_BASE_URL+ '/' + productoId, producto);
export const updateProducto = (productoId, producto, imagenFile) => {
    
    const formData = new FormData();
    
    // 1. Agregar los datos del producto como RequestParams
    formData.append('nombre', producto.nombre);
    formData.append('descripcion', producto.descripcion);
    formData.append('precio', producto.precio);
    formData.append('estatus', producto.estatus);
    formData.append('idTipo', producto.idTipo);

    //2. Agregar el archivo de imagen (solo si existe)
    //Si no se selecciona un archivo nuevo, 'imagenFile' será null y no se enviará. 
    if (imagenFile) {
        
        formData.append('imagenFile', imagenFile); 
    } else {
        //Si no hay archivo nuevo, enviamos un campo vacío. Tu backend (updateServiceImpl) 
        //tiene lógica para ignorar esto si el nombre de archivo es null/vacío.
        formData.append('imagenFile', new Blob([]), '');
    }
    
    //3. Enviar el FormData.
    return axios.put(REST_API_BASE_URL + '/actualizar' + '/' + productoId, formData);
};

//Eliminar
export const deleteProducto = (productoId) => axios.delete(REST_API_BASE_URL + '/eliminar' + '/' + productoId);

//Cambia el estado
export const cambiarEstadoProducto = (idProducto) => axios.patch(REST_API_BASE_URL+ '/cambiar' + '/' + idProducto + '/cambiaEstatus');

//Consultas
//Llama a /api/producto/filtro (sin parámetros, retorna los activos)
export const listActiveProductos = () => axios.get(REST_API_BASE_URL + '/filtro'); 


export const filtrarProductos = (nombre, idTipo, precioMin, precioMax) => {
    // Construye la URL de la petición con los parámetros que no son nulos/vacíos
    const params = new URLSearchParams();
    
    // 1. Nombre
    if (nombre && nombre.trim() !== "") {
        params.append('nombre', nombre.trim());
    }

    //2. Tipo (siempre y cuando sea un idTipo válido y no la opción "Todos" 
    //(que sería un valor de 0 o nulo))
    //idTipo > 0 para filtrar, 0 o nulo para "Todos"
    if (idTipo && idTipo > 0) {
        params.append('idTipo', idTipo);
    }

    //3. Rango de Precios
    if (precioMin != null && precioMax != null) {
        params.append('precioMin', precioMin);
        params.append('precioMax', precioMax);
    }
    
    return axios.get(`${REST_API_BASE_URL}/filtro?${params.toString()}`);
};