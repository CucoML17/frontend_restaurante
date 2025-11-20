import axios from 'axios';

// URL base para el controlador Atender en el microservicio de Reservaciones
const REST_API_BASE_URL = '/api/atender'; 

//Insertar Atender (Relación Empleado-Venta)
export const crearAtender = (atenderDto) => axios.post(REST_API_BASE_URL+'/guardar', atenderDto);

//Obtener todos los registros Atender
export const listAtender = () => axios.get(REST_API_BASE_URL+'/listat');

//Recupera un registro Atender con su llave compuesta (idEmpleado, idVenta)
export const getAtender = (idEmpleado, idVenta) => axios.get(REST_API_BASE_URL +'/buscaid'+ '/' + idEmpleado + '/' + idVenta);

//Update un registro Atender
export const updateAtender = (idEmpleado, idVenta, atenderDto) => axios.put(REST_API_BASE_URL+ '/actualizar' + '/' + idEmpleado + '/' + idVenta, atenderDto);

//Eliminar un registro Atender (normal)
export const deleteAtender = (idEmpleado, idVenta) => axios.delete(REST_API_BASE_URL + '/eliminar' + '/' + idEmpleado + '/' + idVenta);

export const getAtenderByReservaId = (idReserva) => {
    return axios.get(REST_API_BASE_URL + '/reservaEmpleado/' + idReserva);
}