import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrarCliente } from '../services/ClienteService';
import { checkUsernameExists } from '../services/AuthService'; //Importar el nuevo servicio

export const RegistroComponent = () => {
    // Definimos el color principal para los títulos y botones
    const primaryColor = { color: '#5C0000' };

    // Estados para los campos del formulario
    const [nombrecliente, setNombrecliente] = useState('');
    const [telefono, setTelefono] = useState('');
    const [correo, setCorreo] = useState('');
    const [usuario, setUsuario] = useState(''); // Estado para el username
    const [contrasena, setContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');

    // Estados de Feedback
    const [loading, setLoading] = useState(false);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false); // NUEVO: Controla la validación asíncrona
    const [registrationError, setRegistrationError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Estado para los mensajes de error
    const [errors, setErrors] = useState({
        nombrecliente: '',
        telefono: '',
        correo: '',
        usuario: '',
        contrasena: '',
        confirmarContrasena: ''
    });

    // Hook para la navegación
    const navigate = useNavigate();

    // Función para el botón "Volver"
    const handleVolver = () => {
        // Regresa a la página de login
        navigate('/');
    };

    // Función para la validación SINCRÓNICA del formulario
    function validaForm() {
        let valida = true;
        const errorsCopy = { ...errors }; // Usamos los errores actuales como base

        // 1. Validar Nombre del cliente
        if (nombrecliente.trim()) {
            errorsCopy.nombrecliente = '';
        } else {
            errorsCopy.nombrecliente = 'El nombre del cliente es requerido';
            valida = false;
        }

        // 2. Validar Teléfono
        if (telefono.trim()) {
            errorsCopy.telefono = '';
        } else {
            errorsCopy.telefono = 'El teléfono es requerido';
            valida = false;
        }

        // 3. Validar Correo
        if (correo.trim()) {
            errorsCopy.correo = '';
        } else {
            errorsCopy.correo = 'El correo electrónico es requerido';
            valida = false;
        }

        // 4. Validar Usuario (Solo el campo requerido)
        if (usuario.trim()) {
            // Aseguramos que solo se limpie el error si era el error de "requerido"
            if (errorsCopy.usuario === 'El nombre de usuario es requerido') {
                errorsCopy.usuario = '';
            }
        } else {
            errorsCopy.usuario = 'El nombre de usuario es requerido';
            valida = false;
        }

        // 5. Validar Contraseña
        if (contrasena.trim()) {
            errorsCopy.contrasena = '';
        } else {
            errorsCopy.contrasena = 'La contraseña es requerida';
            valida = false;
        }

        // 6. Validar Confirmar Contraseña (y que coincida con la contraseña)
        if (confirmarContrasena.trim()) {
            errorsCopy.confirmarContrasena = '';
            if (contrasena !== confirmarContrasena) {
                errorsCopy.confirmarContrasena = 'Las contraseñas no coinciden';
                valida = false;
            }
        } else {
            errorsCopy.confirmarContrasena = 'Debe confirmar su contraseña';
            valida = false;
        }

        setErrors(errorsCopy);
        return valida;
    }

    // Función que se ejecutará al enviar el formulario (ASÍNCRONA)
    const handleRegistro = async (e) => {
        e.preventDefault();

        //Limpiar mensajes de feedback anteriores
        setRegistrationError('');
        setSuccessMessage('');

        //1. Validación SINCRÓNICA
        if (!validaForm()) {
            return; //Detener si la validación del formulario falla
        }

        //2. Validación de unicidad de usuario
        setIsCheckingUsername(true);
        setLoading(true);

        try {
            //Intenta buscar el usuario. Si resuelve (200 OK), el usuario ya existe.
            await checkUsernameExists(usuario); 
            
            //Si llegamos aquí, el usuario EXISTE.
            setErrors(prevErrors => ({ 
                ...prevErrors, 
                usuario: 'Este nombre de usuario ya está en uso. Escoge otro nombre de usuario.' 
            }));
            
            //Detenemos el proceso
            setLoading(false);
            setIsCheckingUsername(false);
            return; 

        } catch (error) {
            //Si la API devuelve 404 NOT FOUND, la promesa se rechaza y entramos al catch.
            if (error.response && error.response.status === 404) {
                //Éxito en la validación de unicidad (NO EXISTE), limpiamos el error
                setErrors(prevErrors => ({ ...prevErrors, usuario: '' }));
            } else if (error.response) {
                //Otro error de respuesta de la API (ej. 500)
                setRegistrationError('Error del servidor al verificar la disponibilidad del usuario.');
                setLoading(false);
                setIsCheckingUsername(false);
                return;
            } else {
                //Error de red, etc.
                setRegistrationError('Error de conexión. Verifica tu red.');
                setLoading(false);
                setIsCheckingUsername(false);
                return;
            }
        }
        
        //3. REGISTRO FINAL 
        setIsCheckingUsername(false);

        const registroData = {
            nombrecliente,
            telefono,
            correo,
            username: usuario, 
            password: contrasena
        };

        try {
            //Llamada al servicio de registro de cliente
            await registrarCliente(registroData);
            
            const toastMessage = `${nombrecliente}, tu usuario fue registrado exitosamente.`;
            
            setSuccessMessage(toastMessage);
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                navigate('/', { 
                    state: { 
                        toastMessage: toastMessage, 
                        toastType: 'success' 
                    },
                    replace: true
                });
            }, 2000);

        } catch (error) {
            //Manejo de errores de la API en el REGISTRO final
            console.error("Error en el registro:", error);
            
            let errorMessage = "Ocurrió un error al intentar registrar la cuenta.";
            
            if (error.response && error.response.status === 400) {
                //Mensaje genérico para 400
                errorMessage = "Error en los datos proporcionados. Revisa el formulario.";
            } else if (error.message) {
                 errorMessage = `Error de conexión: ${error.message}`;
            }

            setRegistrationError(errorMessage);

        } finally {
            setLoading(false);
        }
    };

    // La variable que deshabilita los inputs y el botón es 'loading' o 'isCheckingUsername'
    const isDisabled = loading || isCheckingUsername;

    return (
        // Contenedor principal: Centra vertical y horizontalmente en la vista (vh-100)
        <div className="login-container d-flex justify-content-center align-items-center mt-3">
            <div className="col-lg-6 container">
                {/* Usaremos la clase login-row pero le quitaremos la columna izquierda (col-lg-6) */}
                <div className="row login-row mx-auto custom-shadow">

                    {/* Columna Única: Formulario de Registro */}
                    <div className="col-lg-12 right-column d-flex flex-column align-items-center justify-content-center p-2">

                        <h4 className="text-center mt-1 mb-2 fw-bold" style={primaryColor}>Registrando su nuevo usuario</h4>
                        
                        {/* 💡 Mensaje de Error (ROJO) */}
                        {registrationError && (
                            <div className="alert alert-danger w-100 text-center fw-bold" role="alert">
                                {registrationError}
                            </div>
                        )}
                        
                        {/* 💡 Mensaje de Éxito (VERDE) */}
                        {successMessage && (
                            <div className="alert alert-success w-100 text-center fw-bold" role="alert">
                                {successMessage}
                            </div>
                        )}

                        <form id="registroForm" className="w-100 px-md-5 px-sm-3" noValidate onSubmit={handleRegistro}>

                            {/* Campo Nombre del Cliente */}
                            <div className="mb-2">
                                <div className="d-flex justify-content-start">
                                    <label htmlFor="nombrecliente" className="form-label fw-bold">Nombre</label>
                                </div>
                                <input
                                    type="text"
                                    id="nombrecliente"
                                    className={`form-control ${errors.nombrecliente ? 'is-invalid' : ''}`}
                                    placeholder="Ingrese su nombre completo"
                                    value={nombrecliente}
                                    onChange={(e) => setNombrecliente(e.target.value)}
                                    disabled={isDisabled}
                                />
                                {errors.nombrecliente && <div className='invalid-feedback text-start'>{errors.nombrecliente}</div>}
                            </div>

                            {/* Campo Teléfono */}
                            <div className="mb-2">
                                <div className="d-flex justify-content-start">
                                    <label htmlFor="telefono" className="form-label fw-bold">Teléfono</label>
                                </div>
                                <input
                                    type="text"
                                    id="telefono"
                                    className={`form-control w-75 ${errors.telefono ? 'is-invalid' : ''}`}
                                    placeholder="Ingrese su número de teléfono"
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                    disabled={isDisabled}
                                />
                                {errors.telefono && <div className='invalid-feedback text-start'>{errors.telefono}</div>}
                            </div>

                            {/* Campo Correo */}
                            <div className="mb-2">
                                <div className="d-flex justify-content-start">
                                    <label htmlFor="correo" className="form-label fw-bold">Correo</label>
                                </div>
                                <input
                                    type="email"
                                    id="correo"
                                    className={`form-control w-75 ${errors.correo ? 'is-invalid' : ''}`}
                                    placeholder="Ingrese su correo electrónico"
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                    disabled={isDisabled}
                                />
                                {errors.correo && <div className='invalid-feedback text-start'>{errors.correo}</div>}
                            </div>

                            <hr className="my-3" /> {/* Separador visual para datos de acceso */}

                            {/* Campo Usuario */}
                            <div className="mb-3">
                                <div className="d-flex justify-content-start">
                                    <label htmlFor="usuario" className="form-label fw-bold">Usuario</label>
                                </div>
                                <input
                                    type="text"
                                    id="usuario"
                                    className={`form-control ${errors.usuario ? 'is-invalid' : ''}`}
                                    placeholder="Defina un nombre de usuario"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    disabled={isDisabled} // Deshabilitado durante la validación o registro
                                />
                                {/* Feedback durante la verificación */}
                                {isCheckingUsername && <div className="text-info small mt-1 text-start">Verificando disponibilidad...</div>}
                                {errors.usuario && <div className='invalid-feedback text-start'>{errors.usuario}</div>}
                            </div>


                            {/* Inicio contra */}
                            <div className="row mb-4">
                                {/* Campo Contraseña (Columna 1) */}
                                <div className="col-md-6 mb-2">
                                    <div className="d-flex justify-content-start">
                                        <label htmlFor="contrasena" className="form-label fw-bold">Contraseña</label>
                                    </div>

                                    <input
                                        type="password"
                                        id="contrasena"
                                        className={`form-control ${errors.contrasena ? 'is-invalid' : ''}`}
                                        placeholder="Defina su contraseña"
                                        value={contrasena}
                                        onChange={(e) => setContrasena(e.target.value)}
                                        disabled={isDisabled}
                                    />
                                    {errors.contrasena && <div className='invalid-feedback text-start'>{errors.contrasena}</div>}
                                </div>

                                {/* Campo Confirmar Contraseña (Columna 2) */}
                                <div className="col-md-6 mb-2">
                                    <div className="d-flex justify-content-start">
                                        <label htmlFor="confirmarContrasena" className="form-label fw-bold">Confirmar Contraseña</label>
                                    </div>

                                    <input
                                        type="password"
                                        id="confirmarContrasena"
                                        className={`form-control ${errors.confirmarContrasena ? 'is-invalid' : ''}`}
                                        placeholder="Confirme su contraseña"
                                        value={confirmarContrasena}
                                        onChange={(e) => setConfirmarContrasena(e.target.value)}
                                        disabled={isDisabled}
                                    />
                                    {errors.confirmarContrasena && <div className='invalid-feedback text-start'>{errors.confirmarContrasena}</div>}
                                </div>
                            </div>
                            {/* Fin contra */}

                            <div className='mx-auto'>
                                {/* Botón Registrarse */}
                                <div className="d-grid mb-2 d-flex justify-content-center">
                                    <button 
                                        type="submit" 
                                        className="btn btn-login-primary py-1 fw-bold btn-busca-c"
                                        disabled={isDisabled} // Deshabilitado si hay carga o verificación
                                    >
                                        {loading || isCheckingUsername ? 'Procesando...' : 'Registrar Cuenta'}
                                    </button>
                                </div>

                                {/* Botón Volver */}
                                <div className="d-grid d-flex justify-content-center">
                                    <button
                                        type="button"
                                        className="btn btn-login-secondary py-1 fw-bold btn-reinicia-c"
                                        onClick={handleVolver}
                                        disabled={isDisabled}
                                    >
                                        Volver al menú
                                    </button>
                                </div>
                            </div>

                        </form>
                    </div> {/* Fin Columna Única */}

                </div>
            </div>
        </div>
    );
};