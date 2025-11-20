import axios from "axios";


const REST_API_BASE_URL = '/api/mesas'

//Todas las mesas
export const listMesas = () => axios.get(REST_API_BASE_URL+'/listat');

//Insertar
export const crearMesa = (mesa) => axios.post(REST_API_BASE_URL+ '/guardar', mesa);

//Recuperar específica con id
export const getMesa = (mesaId) => axios.get(REST_API_BASE_URL + '/buscaid' + '/' + mesaId);

//Editar
export const updateMesa = (mesaId, mesa) => axios.put(REST_API_BASE_URL + '/actualizar' + '/' + mesaId, mesa);

//Eliminar (normal)
export const deleteMesa = (mesaId) => axios.delete(REST_API_BASE_URL + '/eliminar' + '/' + mesaId);