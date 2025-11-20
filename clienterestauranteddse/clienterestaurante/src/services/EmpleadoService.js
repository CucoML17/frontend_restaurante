import axios from "axios";

const REST_API_BASE_URL = '/api/empleados'
const REST_API_BASE_URL_PUESTO = '/api/puestos';


//Todos los empleados
export const listEmpleados = () => axios.get(REST_API_BASE_URL+'/listat');

//Insertar empleado
export const crearEmpleado = (empleado) => axios.post(REST_API_BASE_URL+'/guardar', empleado);

//Recupera un empleado con su id
export const getEmpleado = (empleadoId) => axios.get(REST_API_BASE_URL + '/buscaid' + '/' + empleadoId);

//Modificar
export const updateEmpleado = (empleadoId, empleado) => axios.put(REST_API_BASE_URL + '/actualizar' + '/' + empleadoId, empleado);

//Eliminar (normal)
export const deleteEmpleado = (empleadoId) => axios.delete(REST_API_BASE_URL + '/eliminar' + '/' + empleadoId);


//Para la relación:
export const listPuestos = () => axios.get(REST_API_BASE_URL_PUESTO + '/listat');


//Obtener empleado según su puesto:
export const getEmpleadosByPuestoId = (idPuesto) => axios.get( REST_API_BASE_URL + '/puesto', { params: { idPuesto: idPuesto }}
);

/*
export const getEmpleadosByPuestoId = (idPuesto) => axios.get(
    REST_API_BASE_URL + '/puesto?idPuesto=' + idPuesto
);
*/

export const buscarEmpleados = (nombre, idPuesto) => {
    // Crear un objeto de parámetros. Axios ignorará los valores 'null' o 'undefined' en 'params'.
    const params = {};
    if (nombre) {
        params.nombre = nombre;
    }

    if (idPuesto && idPuesto > 0) {
        params.idPuesto = idPuesto;
    }
    // Axios agrega automáticamente los parámetros de consulta (?nombre=X&idPuesto=Y) si existen.
    return axios.get(REST_API_BASE_URL + '/buscarEmpleado', { params });
};


export const registerEmpleadoCompleto = (empleadoRegistroRequest) => {
    //La URL completa es /api/empleados/registrocompleto
    return axios.post(REST_API_BASE_URL + '/registrocompleto', empleadoRegistroRequest);
};


export const updateEmpleadoCompleto = (empleadoId, empleadoRequest) => {
    return axios.put(REST_API_BASE_URL + '/actualiza/completo/' + empleadoId, empleadoRequest);
}

export const updateEmpleadoEspecial = (empleadoId, empleadoRequest) => {
    return axios.put(REST_API_BASE_URL + '/actualizarespecial/' + empleadoId, empleadoRequest);
}



export const getEmpleadoByUserId = (idUsuario) => {
    // La URL es /api/empleados/usuario/{idUsuario}
    return axios.get(REST_API_BASE_URL + '/usuario/' + idUsuario);
};