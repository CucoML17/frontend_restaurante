import axios from "axios";

const REST_API_BASE_URL = '/api/tipo'

export const listTipos = () => axios.get(REST_API_BASE_URL + '/listat');

export const crearTipo = (tipo) => axios.post(REST_API_BASE_URL +'/guardar', tipo);

//Recuperar
export const getTipo = (tipoId) => axios.get(REST_API_BASE_URL + '/buscaid' + '/' + tipoId);


//Editar
export const updateTipo = (tipoId, tipo) =>  axios.put(REST_API_BASE_URL + '/actualizar' + '/' + tipoId, tipo);

//Eliminar
export const deleteTipo = (tipoId) => axios.delete(REST_API_BASE_URL + '/eliminar' + '/' + tipoId);