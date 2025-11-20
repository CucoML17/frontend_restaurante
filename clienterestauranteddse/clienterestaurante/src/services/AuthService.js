import axios from "axios";

//URL BASE
const AUTH_API_BASE_URL = '/api/auth';

export const loginService = (username, password) => {
    //El backend espera un objeto LoginRequestDto con username y password.
    const loginData = { username, password }; 
    
    //La URL completa es /api/auth/login
    return axios.post(AUTH_API_BASE_URL + '/login', loginData);
};

export const checkUsernameExists = (username) => {
    //La URL completa es /api/auth/usuario/{username}
    return axios.get(AUTH_API_BASE_URL + '/usuario/' + username);
};

export const getAllPerfiles = () => {
    //La URL completa es /api/auth/perfiles
    return axios.get(AUTH_API_BASE_URL + '/perfiles');
};


//Obtener usuario por ID
export const getUsuarioById = (id) => {
    return axios.get(AUTH_API_BASE_URL + '/usuario/buscaid/' + id);
}

//(Actualizar usuario: solo username y idPerfil)
export const updateUsuarioSimple = (idUsuario, usuarioRequest) => {
    return axios.put(AUTH_API_BASE_URL + '/actualiza/sincontra/usuario/' + idUsuario, usuarioRequest);
}

//(Registrar usuario)
export const registerUsuario = (registroRequest) => {
    return axios.post(AUTH_API_BASE_URL + '/registrar', registroRequest);
}


//Activar y desactivar estatus
export const toggleUserEstatus = (idUsuario) => {
    //Usamos PATCH para alternar el estatus
    return axios.patch(AUTH_API_BASE_URL + '/toggle/estatus/' + idUsuario);
}


export const updateUsuarioWithoutPassword = (idUsuario, usuario) => {
    return axios.put(AUTH_API_BASE_URL + '/actualiza/sincontra/usuario/' + idUsuario, usuario);
};

// Nuevo DTO: { username: string, password: string }
export const updateUsuarioWithCredentials = (idUsuario, credenciales) => {
    return axios.put(AUTH_API_BASE_URL + '/actualiza/credenciales/usuario/' + idUsuario, credenciales);
};