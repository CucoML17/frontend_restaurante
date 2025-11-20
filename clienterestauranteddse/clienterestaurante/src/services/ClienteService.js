import axios from "axios";

const REST_API_BASE_URL = '/api/cliente'


export const listClientes = () => axios.get(REST_API_BASE_URL+'/listat');

export const crearCliente = (cliente) => axios.post(REST_API_BASE_URL+ '/guardar', cliente);

//Recupera el cliente
export const getCliente = (clienteId) => axios.get(REST_API_BASE_URL + '/buscaid' + '/' + clienteId);

//El método que modifica/update
export const updateCliente = (clienteId, cliente) =>  axios.put(REST_API_BASE_URL + '/actualizar' + '/' + clienteId, cliente);

//Eliminar, checa la diferencia que aparte del nombre del método, usas axios.delete
export const deleteCliente = (clienteId) => axios.delete(REST_API_BASE_URL +'/eliminar' + '/' + clienteId);


//Para el filtro
export const buscaClientesByName = (nombre) => {
    const consulta = nombre ? `?nombre=${encodeURIComponent(nombre)}` : '';
    return axios.get(REST_API_BASE_URL + '/busca' + consulta);
};


//Para registrar CLIENTES:
export const registrarCliente = (clienteData) => axios.post(REST_API_BASE_URL + '/registro', clienteData);



export const getClienteByUserId = (idUsuario) => {
    // La URL es /api/cliente/usuario/{idUsuario}
    return axios.get(REST_API_BASE_URL + '/usuario/' + idUsuario);
};