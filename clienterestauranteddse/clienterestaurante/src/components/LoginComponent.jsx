import React, { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { loginService } from '../services/AuthService'; 
// import { useAuth } from '../context/AuthContext'; 
import { useAuth } from '../context/AuthContext';


export const LoginComponent = () => {
    const { login } = useAuth();


    const primaryColor = { color: '#5C0000' };
    const navigate = useNavigate();
    
    //Estados del formulario
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    //Estado para el feedback (errores, carga)
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleVolver = () => {
        navigate('/'); 
    };
    
    //Función principal de login
    const handleLogin = async (e) => {
        e.preventDefault();
        
        setErrorMessage(''); // Limpiar errores previos
        
        if (!username.trim() || !password.trim()) {
            setErrorMessage('Por favor, ingresa tu usuario y contraseña.');
            return;
        }

        setIsLoading(true);
        
        try {
            //Llama al servicio de autenticación
            const response = await loginService(username, password); 
            
            
            const { token, idUsuario, username: returnedUsername, perfiles } = response.data;
            const perfilPrincipal = perfiles && perfiles.length > 0 ? perfiles[0] : 'Desconocido';

            console.log('Login Exitoso. Token:', token);
            console.log('ID Usuario:', idUsuario, 'Perfil:', perfilPrincipal); // <-- Imprimimos el Perfil
                        
            //USAR EL CONTEXTO: Llama a la función global 'login'
            //para guardar el estado en React y en localStorage.
            login(token, idUsuario, returnedUsername, perfiles);


            //Redirigir al índice
            navigate('/', {
                 state: { 
                     toastMessage: `¡Bienvenido, ${returnedUsername}! Sesión iniciada como ${perfilPrincipal}.`, 
                     toastType: 'success' 
                 },
                 replace: true
             });

        } catch (error) {
            console.error("Error de Login:", error);

            //Manejo de errores 401 (Unauthorized) o 403 (Forbidden)
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                setErrorMessage('Credenciales inválidas. Verifica tu usuario y/o contraseña.');
            } else {
                setErrorMessage('Error al conectar con el servidor. Intenta de nuevo.');
            }

        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="login-container d-flex justify-content-center align-items-center mt-5">
            <div className="container">
                <div className="row login-row mx-auto custom-shadow">
                    
                    {/* Columna Izquierda: Mensaje de Bienvenida/Instrucción */}
                    <div className="col-lg-6 left-column d-flex align-items-center justify-content-center text-center p-2">
                        <div className="content-wrapper">
                            <p className="display-6 fw-bold text-center" style={primaryColor}>
                                Por favor, ingresa tus credenciales de acceso para comenzar
                            </p>
                        </div>
                    </div>

                    {/* Columna Derecha: Formulario de Login */}
                    <div className="col-lg-6 right-column d-flex flex-column align-items-center justify-content-center p-4">
                        
                        <h2 className="text-center mb-4 fw-bold" style={primaryColor}>Inicia sesión</h2>
                        
                        {/* Formulario con el handler de submit */}
                        <form id="loginForm" className="w-100 px-md-5 px-sm-3" noValidate onSubmit={handleLogin}>
                            
                            {/* Mensaje de Error */}
                            {errorMessage && (
                                <div className="alert alert-danger text-center small p-2" role="alert">
                                    {errorMessage}
                                </div>
                            )}

                            {/* Campo Usuario */}
                            <div className="mb-3">
                                <div className="d-flex justify-content-start">
                                    <label htmlFor="usuario" className="form-label fw-bold">Usuario</label>
                                </div>
                                <div className="input-group custom-input-login">
                                    <span className="input-group-text"><i className="fas fa-user"></i></span>
                                    {/* Estado y Handler */}
                                    <input 
                                        type="text" 
                                        id="usuario" 
                                        className="form-control" 
                                        placeholder="Ingrese su usuario..." 
                                        required 
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    <div className="invalid-feedback">Ingrese su usuario.</div>
                                </div>
                            </div>

                            {/* Campo Contraseña */}
                            <div className="mb-4">
                                <div className="d-flex justify-content-start">
                                    <label htmlFor="contrasena" className="form-label fw-bold">Contraseña</label>
                                </div>
                                <div className="input-group custom-input-login">
                                    <span className="input-group-text"><i className="fas fa-lock"></i></span>
                                    {/* Estado y Handler */}
                                    <input 
                                        type="password" 
                                        id="contrasena" 
                                        className="form-control" 
                                        placeholder="Ingrese su contraseña..." 
                                        required 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    <div className="invalid-feedback">Ingrese su contraseña.</div>
                                </div>
                            </div>

                            {/* Enlace de Registro */}
                            <div className="text-center mb-4">
                                <a href="/registro" className="text-danger small fw-bold text-decoration-underline" style={{ color: '#5C0000' }}>
                                    No tengo una cuenta
                                </a>
                            </div>

                            <div className='mx-auto'>
                                {/* Botón Iniciar Sesión */}
                                <div className="d-grid mb-3 d-flex justify-content-center">
                                    <button 
                                        type="submit" 
                                        className="btn btn-login-primary py-1 fw-bold btn-busca-c"
                                        disabled={isLoading} // Deshabilitar si está cargando
                                    >
                                        {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                                    </button>
                                </div>

                                {/* Botón Volver */}
                                <div className="d-grid d-flex justify-content-center">
                                    <button 
                                        type="button" 
                                        className="btn btn-login-secondary py-1 fw-bold btn-reinicia-c" 
                                        onClick={handleVolver}
                                        disabled={isLoading}
                                    >
                                        Volver
                                    </button>
                                </div>

                            </div>

                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};