import axios from 'axios';


const REST_API_BASE_URL = '/api/reservaciones'; 

//Insertar Reservación
export const crearReservacion = (reservarDto) => axios.post(REST_API_BASE_URL + '/guardar', reservarDto);

//Obtener todas las Reservaciones
// export const listReservaciones = () => axios.get(REST_API_BASE_URL);

//Recupera una Reservación con su id
export const getReservacion = (id) => axios.get(REST_API_BASE_URL + '/buscaid' + '/' + id);

//Editar una Reservación
export const updateReservacion = (id, reservarDto) => axios.put(REST_API_BASE_URL + '/actualizar' + '/' + id, reservarDto);

//Eliminar una Reservación
export const deleteReservacion = (id) => axios.delete(REST_API_BASE_URL + '/eliminar' + '/' + id);


export const listReservaciones = (fecha = null) => {
    let url = REST_API_BASE_URL + '/completa';
    
    // Si se proporciona una fecha, la añadimos como parámetro de consulta
    if (fecha) {
        // Axios automáticamente serializa los parámetros en un objeto 'params'
        return axios.get(url, { params: { fecha: fecha } });
    }
    
    // Si no hay fecha, llamamos al endpoint sin parámetros, que devuelve todos.
    return axios.get(url);
};


export const getReservasByCliente = (idCliente, fecha) => {
    let url = `${REST_API_BASE_URL}/cliente/${idCliente}`;
    
    if (fecha) {
        
        url += `?fecha=${fecha}`;
    }
    
    return axios.get(url);
}