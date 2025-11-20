import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios'; // 💡 IMPORTANTE: Importamos Axios

//1. Crear el Contexto
const AuthContext = createContext(null);

//2. Hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
    return useContext(AuthContext);
};

//3. Proveedor del Contexto (El componente principal)
export const AuthProvider = ({ children }) => {

    const [isContextReady, setIsContextReady] = useState(false);

    //Estado donde se guardará la información de autenticación
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        token: null,
        idUsuario: null,
        username: null,
        perfiles: [], //Array de roles/perfiles
    });

    //Función de utilidad para configurar el header Authorization
    const setAuthHeader = (token) => {
        if (token) {
            //Configuramos el header Authorization por defecto en Axios, es como si fuera en
            //postman
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            console.log("Axios: Authorization header configurado.");
        } else {
            //Limpiar el header si no hay token
            delete axios.defaults.headers.common['Authorization'];
            console.log("Axios: Authorization header limpiado.");
        }
    };

    const setupAxiosInterceptor = (logoutFunction) => {
        //Removemos cualquier interceptor existente antes de añadir uno nuevo
        axios.interceptors.response.eject(axios.interceptors.response.handlers.find(handler => handler.fulfilled === null));
        
        axios.interceptors.response.use(
            //Respuesta exitosa: no hacemos nada, la pasamos
            response => response,
            
            //Respuesta con error: chequeamos el código de estado
            async error => {
                const status = error.response ? error.response.status : null;
                
                //Si el error es 403 (No Autorizado, probablemente por token expirado)
                if (status === 40) {
                    console.log("Token expirado o no autorizado. Cerrando sesión...");
                    
                    // 1. Llamamos a la función logout que tenemos acceso a través del cerrado
                    logoutFunction(); 
                    
                    return Promise.reject(error);
                }
                
                //Para cualquier otro error (404, 500, CORS, etc.), lo devolvemos
                return Promise.reject(error);
            }
        );
        console.log("Axios Interceptor 401 configurado.");
    };

    //Cargar el estado desde localStorage al montar el componente
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedIdUsuario = localStorage.getItem('idUsuario');
        const storedUsername = localStorage.getItem('username');
        const storedPerfiles = localStorage.getItem('perfiles'); 

        if (storedToken) {
            const perfilesData = storedPerfiles ? JSON.parse(storedPerfiles) : [];
            
            setAuthState({
                isAuthenticated: true,
                token: storedToken,
                idUsuario: storedIdUsuario,
                username: storedUsername,
                perfiles: perfilesData,
            });
            
            //Configurar Axios con el token restaurado
            setAuthHeader(storedToken);

        }

        setupAxiosInterceptor(logout);
        setIsContextReady(true);
    }, []);

    //Manejar el inicio de sesión
    const login = (token, idUsuario, username, perfiles) => {
        // Guardar en el estado de React
        setAuthState({
            isAuthenticated: true,
            token,
            idUsuario,
            username,
            perfiles,
        });

        //Guardar en el almacenamiento persistente (localStorage)
        localStorage.setItem('token', token);
        localStorage.setItem('idUsuario', idUsuario);
        localStorage.setItem('username', username);
        localStorage.setItem('perfiles', JSON.stringify(perfiles)); 

        //Configurar Axios con el nuevo token
        setAuthHeader(token);
    };

    //Manejar el cierre de sesión
    const logout = () => {
        // Limpiar el estado de React
        setAuthState({
            isAuthenticated: false,
            token: null,
            idUsuario: null,
            username: null,
            perfiles: [],
        });

        //Limpiar el almacenamiento persistente
        localStorage.removeItem('token');
        localStorage.removeItem('idUsuario');
        localStorage.removeItem('username');
        localStorage.removeItem('perfiles');

        //Limpiar la configuración de Axios
        setAuthHeader(null); 
    };
    
    //Función de utilidad para chequear roles
    const hasRole = (requiredRole) => {
        if (!authState.isAuthenticated || !authState.perfiles) return false;
        return authState.perfiles.includes(requiredRole);
    };


    const value = {
        ...authState,
        login,
        logout,
        hasRole,
        isContextReady
    };

    if (!isContextReady) {
        //Retornar un indicador de carga mientras se restaura la sesión
        return (
             <div className="text-center mt-5 pt-5">
                 <div className="spinner-border" role="status">
                     <span className="visually-hidden">Cargando sesión...</span>
                 </div>
                 <p className="mt-2">Cargando sesión...</p>
             </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};