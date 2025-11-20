import axios from "axios";

const REST_API_BASE_URL = '/api/puestos'

//Lista de todos los puestos
export const listPuestos = () => axios.get(REST_API_BASE_URL + '/listat');

//Crear
export const crearPuesto = (puesto) => axios.post(REST_API_BASE_URL + '/guardar', puesto);

//Tomar especifico
export const getPuesto = (puestoId) => axios.get(REST_API_BASE_URL + '/buscaid' + '/' + puestoId);

//Editar
export const updatePuesto = (puestoId, puesto) => axios.put(REST_API_BASE_URL + '/actualizar' + '/' + puestoId, puesto);

//Eliminar (normal)
export const deletePuesto = (puestoId) => axios.delete(REST_API_BASE_URL + '/eliminar' + '/' + puestoId);