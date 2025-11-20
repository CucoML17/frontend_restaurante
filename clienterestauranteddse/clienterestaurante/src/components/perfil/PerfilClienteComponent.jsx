import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Importar el contexto de autenticación
import { getClienteByUserId, updateCliente } from '../../services/ClienteService'; // Servicios de Cliente
import { 
    checkUsernameExists, 
    updateUsuarioWithoutPassword, 
    updateUsuarioWithCredentials 
} from '../../services/AuthService'; // Servicios de Auth

// ID de Perfil fijo para Clientes
const ID_PERFIL_CLIENTE = 5; 

export const PerfilClienteComponent = () => {
    // --- ESTADOS DE AUTENTICACIÓN Y DATOS ---
    const { idUsuario: loggedInIdUsuario, username: loggedInUsername, logout } = useAuth(); // Obtener el ID del usuario logueado
    const navigate = useNavigate();

    // Atributos base del Cliente (para el DTO)
    const [idCliente, setIdCliente] = useState(0); // El ID del Cliente que vamos a editar
    const [nombrecliente, setNombrecliente] = useState('');
    const [telefono, setTelefono] = useState('');
    const [correo, setCorreo] = useState('');
    
    // Atributos de Usuario
    const [username, setUsername] = useState(loggedInUsername); // Usamos el username del contexto como inicial
    const [password, setPassword] = useState(''); // Contraseña nueva
    const [confirmPassword, setConfirmPassword] = useState(''); // Confirmación de contraseña
    const [originalUsername, setOriginalUsername] = useState(loggedInUsername); // Para validación

    // ESTADOS DE CONTROL
    const [isSaving, setIsSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // --- Handlers ---
    const actualizaNombre = (e) => setNombrecliente(e.target.value);
    const actualizaTelefono = (e) => setTelefono(e.target.value);
    const actualizaCorreo = (e) => setCorreo(e.target.value);
    const actualizaUsername = (e) => setUsername(e.target.value);
    const actualizaPassword = (e) => setPassword(e.target.value);
    const actualizaConfirmPassword = (e) => setConfirmPassword(e.target.value);

    // Manejo de errores
    const [errors, setErrors] = useState({
        nombrecliente: '',
        telefono: '',
        correo: '',
        username: '',
        password: '',
        confirmPassword: ''
    });

    // --- VALIDACIÓN DE FORMULARIO ---
    async function validaForm() {
        let valida = true;
        const errorsCopy = { 
            nombrecliente: '', 
            telefono: '', 
            correo: '', 
            username: '', 
            password: '', 
            confirmPassword: '' 
        };
        
        // 1. Validación de Nombre
        if (!nombrecliente.trim()) {
            errorsCopy.nombrecliente = 'Tu nombre es requerido';
            valida = false;
        }

        // 2. Validación de Teléfono
        if (!telefono.trim()) {
            errorsCopy.telefono = 'El teléfono es requerido';
            valida = false;
        }

        // 3. Validación de Correo
        if (!correo.trim()) {
            errorsCopy.correo = 'El correo es requerido';
            valida = false;
        }
        
        // 4. Validación de Username
        if (!username.trim()) {
            errorsCopy.username = 'El nombre de usuario es requerido';
            valida = false;
        }

        // a. Validación Asíncrona de Username (solo si el username ha cambiado y pasó la validación sincrónica)
        const usernameChanged = username.trim() !== originalUsername.trim();
        if (valida && usernameChanged && username.trim()) {
            try {
                // Intenta buscar el usuario. Si resuelve (200), ya existe.
                await checkUsernameExists(username.trim());
                errorsCopy.username = 'Este nombre de usuario ya está en uso. Escoge otro.';
                valida = false;
            } catch (error) {
                // Si falla con 404 (lo esperado si no existe), es correcto.
                if (!(error.response && error.response.status === 404)) {
                     console.error("Error al verificar username:", error);
                     alert("Error de servidor al verificar el usuario.");
                     valida = false;
                }
            }
        }
        
        // 5. Validación de Contraseñas (Solo si el usuario intenta cambiar la contraseña)
        const isChangingPassword = password.trim() !== '';

        if (isChangingPassword) {
            if (password.trim().length < 0) { // Regla de longitud
                errorsCopy.password = 'La contraseña debe tener al menos 6 caracteres.';
                valida = false;
            }

            if (!confirmPassword.trim()) {
                errorsCopy.confirmPassword = 'Debe confirmar su contraseña.';
                valida = false;
            } else if (password.trim() !== confirmPassword.trim()) {
                errorsCopy.password = 'Las contraseñas no coinciden.';
                errorsCopy.confirmPassword = 'Las contraseñas no coinciden.';
                valida = false;
            }
        }

        setErrors(errorsCopy);
        return valida;
    }


    // --- FUNCIÓN DE GUARDADO ---
    async function savePerfil(e) {
        e.preventDefault();
        
        setIsSaving(true);
        
        // 1. Validar el formulario
        if (!(await validaForm())) {
            setIsSaving(false);
            return;
        }

        try {
            // --- 2. Preparar DTOs ---

            // DTO de Cliente (siempre se actualiza)
            const clienteDto = {
                idcliente: idCliente,
                nombrecliente: nombrecliente.trim(),
                telefono: telefono.trim(),
                correo: correo.trim(),
                idUsuario: loggedInIdUsuario 
            };

            // Identificar si la contraseña está cambiando
            const isChangingPassword = password.trim() !== '';
            
            // --- 3. Actualizar Cliente ---
            await updateCliente(idCliente, clienteDto);
            console.log(` Cliente ID ${idCliente} actualizado.`);


            // --- 4. Actualizar Usuario (Condicional) ---

            let successMessage = `Perfil de ${nombrecliente.trim()} actualizado exitosamente.`;

            if (isChangingPassword) {
                // Caso A: Cambiando Username y Contraseña
                const credencialesDto = {
                    username: username.trim(),
                    password: password.trim()
                };
                await updateUsuarioWithCredentials(loggedInIdUsuario, credencialesDto);
                successMessage += ' (Incluye nueva contraseña)';

            } else if (username.trim() !== originalUsername.trim()) {
                // Caso B: Cambiando solo Username (sin cambiar contraseña)
                const usuarioSinContraDto = {
                    username: username.trim(),
                    idPerfil: ID_PERFIL_CLIENTE // ID 5 fijo para Cliente
                };
                await updateUsuarioWithoutPassword(loggedInIdUsuario, usuarioSinContraDto);
            }
            
            console.log(` Usuario ID ${loggedInIdUsuario} actualizado.`);

            // --- 5. Lógica de Éxito Final ---

            // Si se cambió el username o la contraseña, necesitamos forzar el re-logueo.
            const usernameChanged = username.trim() !== originalUsername.trim();
            
            if (usernameChanged || isChangingPassword) {
                alert("Su perfil de acceso fue modificado. Deberá iniciar sesión de nuevo.");
                logout(); // Cierra sesión para que se apliquen los cambios de credenciales
                navigate('/login', { replace: true });
            } else {
                // Solo se cambió el nombre/teléfono/correo del cliente.
                setOriginalUsername(username.trim()); // Aseguramos que el estado refleje el nuevo username 
                
                const navigateOptions = { 
                    state: { 
                        toastMessage: successMessage, 
                        toastType: 'success' 
                    }, 
                    replace: true 
                };
                navigate('/', navigateOptions);
            }

        } catch (error) {
            // --- 6. Manejo de Errores General ---
            console.error("Error al guardar el perfil:", error.response?.data || error.message);
            
            let errorMessage = 'Error desconocido al actualizar el perfil. Intenta de nuevo.';
            
            if (error.response && error.response.status === 400 && error.response.data.message?.includes('Username ya en uso')) {
                errorMessage = 'El nombre de usuario ya está en uso. Escoge otro.';
                setErrors(prev => ({ ...prev, username: errorMessage }));
            } else {
                 alert(`Error al guardar los datos. Revisa la consola para más detalles.`);
            }

        } finally {
            setIsSaving(false);
        }
    }

    // --- Precarga de Datos ---
    useEffect(() => {
        const loadInitialData = async () => {
            if (!loggedInIdUsuario) {
                logout(); 
                navigate('/login', { replace: true });
                return;
            }

            setLoadingData(true);
            try {
                // 1. Cargar datos del Cliente a partir del ID de Usuario
                const clienteResponse = await getClienteByUserId(loggedInIdUsuario);
                const clienteData = clienteResponse.data;
                
                // 2. Establecer datos de Cliente
                setIdCliente(clienteData.idcliente);
                setNombrecliente(clienteData.nombrecliente);
                setTelefono(clienteData.telefono);
                setCorreo(clienteData.correo);

                // 3. Establecer datos de Usuario (tomando el username del contexto como punto de partida)
                // Usamos el username que viene del contexto, ya que es el más fresco/confiable para el inicio.
                setUsername(loggedInUsername);
                setOriginalUsername(loggedInUsername);
                
            } catch (error) {
                console.error("Error al cargar datos iniciales del perfil de cliente:", error);
                alert("No se pudieron cargar los datos del perfil. La sesión será cerrada.");
                logout();
            } finally {
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [loggedInIdUsuario, loggedInUsername, navigate, logout]); // Dependencias

    
    // --- Renderizado ---
    
    function pagTitulo() {
        return <h2 className="text-center mb-0 titcard"> Mi Perfil de Cliente </h2>
    }

    if (loadingData) {
        return <div className="text-center mt-5">Cargando datos de tu perfil...</div>
    }
    
    const isDisabled = isSaving || loadingData;
    
    return (
        <div className="container mt-2 mb-5">
            <div className="row">
                <div className="col-md-6 offset-md-3">
                    <div className="card shadow rounded-3">
                        {pagTitulo()}

                        <div className="card-body">
                            <form className="text-start">

                                {/* Campo Nombre */}
                                <div className="form-group mb-3">
                                    <label className="form-label">Nombre:</label> 
                                    <input
                                        type="text"
                                        placeholder="Ingresa tu nombre completo"
                                        name="nombrecliente"
                                        value={nombrecliente}
                                        className={`form-control ${errors.nombrecliente ? 'is-invalid' : ''}`}
                                        onChange={actualizaNombre}
                                        disabled={isDisabled}
                                    />
                                    {errors.nombrecliente && <div className='invalid-feedback'>{errors.nombrecliente}</div>}
                                </div>
                                
                                {/* Campo Teléfono */}
                                <div className="form-group mb-3">
                                    <label className="form-label">Teléfono:</label> 
                                    <input
                                        type="text"
                                        placeholder="Ingresa tu número de teléfono"
                                        name="telefono"
                                        value={telefono}
                                        className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                                        onChange={actualizaTelefono}
                                        disabled={isDisabled}
                                    />
                                    {errors.telefono && <div className='invalid-feedback'>{errors.telefono}</div>}
                                </div>
                                
                                {/* Campo Correo */}
                                <div className="form-group mb-3">
                                    <label className="form-label">Correo Electrónico:</label> 
                                    <input
                                        type="email"
                                        placeholder="Ingresa tu correo electrónico"
                                        name="correo"
                                        value={correo}
                                        className={`form-control ${errors.correo ? 'is-invalid' : ''}`}
                                        onChange={actualizaCorreo}
                                        disabled={isDisabled}
                                    />
                                    {errors.correo && <div className='invalid-feedback'>{errors.correo}</div>}
                                </div>


                                {/* BLOQUE DE CREDENCIALES */}
                                <hr className="my-3"/>
                                <h5 className="mb-2 text-secondary">Credenciales de Acceso</h5>
                                
                                {/* Campo Usuario */}
                                <div className="form-group mb-3">
                                    <label className="form-label">Nombre de Usuario:</label>
                                    <input
                                        type="text"
                                        placeholder="Nombre de usuario"
                                        name="username"
                                        value={username}
                                        className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                                        onChange={actualizaUsername}
                                        disabled={isDisabled}
                                    />
                                    {errors.username && <div className='invalid-feedback'>{errors.username}</div>}
                                </div>

                                {/* Campos de Contraseña */}
                                <blockquote className="d-none blockquote text-info small border-start ps-3 mb-3">
                                    <p className="mb-0 small">Solo ingresa datos en los siguientes campos si deseas **cambiar tu contraseña**.</p>
                                </blockquote>
                                
                                <div className="form-group mb-3">
                                    <label className="form-label">Nueva Contraseña:</label>
                                    <input
                                        type="password"
                                        placeholder="Nueva contraseña"
                                        name="password"
                                        value={password}
                                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                        onChange={actualizaPassword}
                                        disabled={isDisabled}
                                    />
                                    {errors.password && <div className='invalid-feedback'>{errors.password}</div>}
                                </div>
                                
                                <div className="form-group mb-3">
                                    <label className="form-label">Confirmar Contraseña:</label>
                                    <input
                                        type="password"
                                        placeholder="Confirme la contraseña"
                                        name="confirmPassword"
                                        value={confirmPassword}
                                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                        onChange={actualizaConfirmPassword}
                                        disabled={isDisabled}
                                    />
                                    {errors.confirmPassword && <div className='invalid-feedback'>{errors.confirmPassword}</div>}
                                </div>
                                

                                <button 
                                    className="btn btn-success mt-3 w-100" 
                                    onClick={savePerfil} 
                                    disabled={isDisabled}
                                >
                                    {isSaving ? 'Actualizando...' : 'Actualizar Perfil'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}