import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Importar el contexto de autenticación
import { getEmpleadoByUserId, listPuestos, updateEmpleado } from '../../services/EmpleadoService';
import { getAllPerfiles, getUsuarioById, checkUsernameExists, updateUsuarioWithoutPassword, updateUsuarioWithCredentials } from '../../services/AuthService';

export const PerfilEmpleadoComponent = () => { // Usamos el nombre del componente de Perfil
    // --- ESTADOS DE AUTENTICACIÓN Y DATOS ---
    const { idUsuario: loggedInIdUsuario, username: loggedInUsername, logout } = useAuth(); // Obtener el ID del usuario logueado
    const navigate = useNavigate();

    // Atributos base del Empleado (para el DTO)
    const [idEmpleado, setIdEmpleado] = useState(0); // El ID del Empleado que vamos a editar
    const [nombre, setNombre] = useState('');
    const [idPuesto, setIdPuesto] = useState('');
    
    // Atributos de Usuario
    const [username, setUsername] = useState(loggedInUsername); // Usamos el username del contexto como inicial
    const [password, setPassword] = useState(''); // Contraseña nueva
    const [confirmPassword, setConfirmPassword] = useState(''); // Confirmación de contraseña
    const [originalUsername, setOriginalUsername] = useState(loggedInUsername); // Para validación
    
    // Listas (Puestos)
    const [Puestos, setPuestos] = useState([]);
    const [perfilesData, setPerfilesData] = useState([]);
    const [perfilesProtegidos, setPerfilesProtegidos] = useState([]);

    // ESTADOS DE CONTROL
    const [isSaving, setIsSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [currentPuestoName, setCurrentPuestoName] = useState(''); // Para mostrar el Puesto actual

    // --- Handlers ---
    const actualizaNombre = (e) => {
        setNombre(e.target.value);
    }
    // NOTA: El idPuesto no se cambia en Mi Perfil
    const actualizaUsername = (e) => setUsername(e.target.value);
    const actualizaPassword = (e) => setPassword(e.target.value);
    const actualizaConfirmPassword = (e) => setConfirmPassword(e.target.value);

    // Manejo de errores
    const [errors, setErrors] = useState({
        nombre: '',
        username: '',
        password: '',
        confirmPassword: ''
    });

    // --- Funciones de Utilidad ---
    // En este componente, el rol es fijo para el usuario logueado.
    const isPuestoConPerfil = () => {
        // Asume que si llega a este componente (PerfilEmpleadoComponent), es porque tiene un perfil de acceso.
        return true; 
    };
    
    // Función para obtener el ID de Perfil (usado si el backend lo requiere)
    const getIdPerfilForCurrentPuesto = (puestoId) => {
        const puestoSeleccionado = Puestos.find(p => p.idPuesto.toString() === puestoId);
        if (!puestoSeleccionado) return null;

        const nombrePuestoLower = puestoSeleccionado.nombrePuesto.toLowerCase().trim();

        const perfilCoincidente = perfilesData.find(perfil =>
            perfil.nombre.toLowerCase().trim() === nombrePuestoLower
        );

        return perfilCoincidente ? perfilCoincidente.id : null;
    };
    

    // --- VALIDACIÓN DE FORMULARIO (Simplificada para Mi Perfil) ---
    async function validaForm() {
        let valida = true;
        const errorsCopy = { ...errors };
        
        // 1. Validación de Nombre
        if (nombre.trim()) {
            errorsCopy.nombre = '';
        } else {
            errorsCopy.nombre = 'Tu nombre es requerido';
            valida = false;
        }

        // 2. Validación de Username
        if (username.trim()) {
            errorsCopy.username = '';
        } else {
            errorsCopy.username = 'El nombre de usuario es requerido';
            valida = false;
        }

        // a. Validación Asíncrona de Username (solo si el username ha cambiado)
        const usernameChanged = username.trim() !== originalUsername.trim();
        if (valida && usernameChanged) {
            try {
                await checkUsernameExists(username.trim());
                // Si resuelve (200), el usuario ya existe
                errorsCopy.username = 'Este nombre de usuario ya está en uso. Escoge otro.';
                valida = false;
            } catch (error) {
                // Si falla con 404 (lo esperado si no existe), es correcto.
                if (error.response && error.response.status === 404) {
                    errorsCopy.username = '';
                } else if (error.response) {
                    console.error("Error al verificar username:", error);
                    alert("Error de servidor al verificar el usuario.");
                    valida = false;
                }
            }
        }
        
        // 3. Validación de Contraseñas (Solo si el usuario intenta cambiar la contraseña)
        const isChangingPassword = password.trim() !== '';

        if (isChangingPassword) {
            if (password.trim().length < 0) { // Añade tu propia regla de longitud
                errorsCopy.password = 'La contraseña debe tener al menos 6 caracteres.';
                valida = false;
            } else {
                errorsCopy.password = '';
            }

            if (confirmPassword.trim()) {
                errorsCopy.confirmPassword = '';
            } else {
                errorsCopy.confirmPassword = 'Debe confirmar su contraseña.';
                valida = false;
            }

            if (password.trim() !== confirmPassword.trim()) {
                errorsCopy.password = 'Las contraseñas no coinciden.';
                errorsCopy.confirmPassword = 'Las contraseñas no coinciden.';
                valida = false;
            }
        } else {
             // Limpiar errores si no se está intentando cambiar la contraseña
            errorsCopy.password = '';
            errorsCopy.confirmPassword = '';
        }

        setErrors(errorsCopy);
        return valida;
    }


    // --- FUNCIÓN DE GUARDADO (PENDIENTE) ---
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

        // DTO de Empleado (siempre se actualiza el nombre)
        const empleadoDto = {
            idEmpleado,
            nombre: nombre.trim(),
            idPuesto: parseInt(idPuesto, 10), // Usamos el idPuesto cargado (no editable)
            idUsuario: loggedInIdUsuario 
        };

        // Identificar si la contraseña está cambiando
        const isChangingPassword = password.trim() !== '';

        // Determinar el idPerfil (lo necesitamos para ambos casos de Usuario)
        const idPerfil = getIdPerfilForCurrentPuesto(idPuesto);

        if (!idPerfil) {
             throw new Error(`Error: No se encontró el ID de Perfil para el Puesto ${currentPuestoName}.`);
        }

        // --- 3. Actualizar Empleado ---
        await updateEmpleado(idEmpleado, empleadoDto);
        console.log(`Empleado ID ${idEmpleado} actualizado.`);


        // --- 4. Actualizar Usuario (Condicional) ---

        let userUpdateResponse;
        let successMessage = `Perfil de ${nombre.trim()} actualizado exitosamente.`;

        if (isChangingPassword) {
            // Caso A: Cambiando Username y/o Contraseña
            const credencialesDto = {
                username: username.trim(),
                password: password.trim()
            };
            userUpdateResponse = await updateUsuarioWithCredentials(loggedInIdUsuario, credencialesDto);
            successMessage += ' (Incluye nueva contraseña)';

        } else {
            // Caso B: Cambiando solo Username (o solo Nombre de Empleado)
            const usuarioSinContraDto = {
                username: username.trim(),
                idPerfil: idPerfil
            };
            userUpdateResponse = await updateUsuarioWithoutPassword(loggedInIdUsuario, usuarioSinContraDto);
        }
        
        console.log(`Usuario ID ${loggedInIdUsuario} actualizado.`);

        // --- 5. Lógica de Éxito Final ---

        // Si se cambió el username, necesitamos forzar el re-logueo para actualizar el contexto.
        const usernameChanged = username.trim() !== originalUsername.trim();
        
        if (usernameChanged || isChangingPassword) {
            // Si las credenciales cambiaron, el token podría ser inválido o el contexto obsoleto.
            alert("Su perfil de acceso fue modificado. Deberá iniciar sesión de nuevo.");
            logout(); // Cierra sesión para que se apliquen los cambios de credenciales
            navigate('/login', { replace: true });
        } else {
            // Solo se cambió el nombre. Podemos actualizar el estado de "originalUsername" y navegar.
            setOriginalUsername(username.trim()); // Aseguramos que el estado refleje el nuevo username si solo se cambió el nombre
            
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
        
        // Manejo de error de username (aunque la validación lo previene, por seguridad)
        if (error.response && error.response.status === 400 && error.response.data.message?.includes('Username ya en uso')) {
            errorMessage = 'El nombre de usuario ya está en uso. Escoge otro.';
            setErrors(prev => ({ ...prev, username: errorMessage }));
        } else if (error.message.includes('No se encontró el ID de Perfil')) {
             errorMessage = error.message;
             alert(errorMessage);
        } else {
             // Error genérico del servidor
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
                // Si no hay idUsuario, algo salió mal o el usuario no debería estar aquí.
                logout(); 
                navigate('/login', { replace: true });
                return;
            }

            setLoadingData(true);
            try {
                // 1. Cargar Puestos y Perfiles (para mapear nombres a IDs)
                const [puestosResponse, perfilesResponse] = await Promise.all([
                    listPuestos(),
                    getAllPerfiles()
                ]);

                const puestosData = puestosResponse.data;
                setPuestos(puestosData);
                
                const perfilesRawData = perfilesResponse.data;
                setPerfilesData(perfilesRawData);
                const perfilesNombres = perfilesRawData.map(p => p.nombre);
                setPerfilesProtegidos(perfilesNombres);

                // 2. Cargar datos del Empleado a partir del ID de Usuario
                const empleadoResponse = await getEmpleadoByUserId(loggedInIdUsuario);
                const empleadoData = empleadoResponse.data;
                
                // 3. Establecer datos de Empleado
                setIdEmpleado(empleadoData.idEmpleado);
                setNombre(empleadoData.nombre);
                setIdPuesto(empleadoData.idPuesto.toString());

                // 4. Determinar el nombre del puesto para mostrar
                const currentPuesto = puestosData.find(p => p.idPuesto === empleadoData.idPuesto);
                if (currentPuesto) {
                    setCurrentPuestoName(currentPuesto.nombrePuesto);
                }

                // 5. Cargar datos del Usuario (aunque el username ya está en el contexto, lo cargamos para asegurar)
                const usuarioResponse = await getUsuarioById(loggedInIdUsuario);
                const loadedUsername = usuarioResponse.data.username;
                
                setUsername(loadedUsername);
                setOriginalUsername(loadedUsername);
                
            } catch (error) {
                console.error("Error al cargar datos iniciales:", error);
                // Si hay un error grave (ej. no encuentra al empleado), forzar logout.
                alert("No se pudieron cargar los datos del perfil. La sesión será cerrada.");
                logout();
            } finally {
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [loggedInIdUsuario, navigate, logout]); // Dependencias

    
    // --- Renderizado ---
    
    function pagTitulo() {
        return <h2 className="text-center mb-0 titcard"> Mi perfil de empleado </h2>
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

                                {/* Campo Puesto (De solo lectura) */}
                                <div className="form-group mb-3 d-none">
                                    <label className="form-label fw-bold text-primary">Puesto Actual:</label> 
                                    <input
                                        type="text"
                                        name="puesto"
                                        value={currentPuestoName}
                                        className="form-control"
                                        disabled={true} // Siempre deshabilitado
                                    />
                                    <small className="form-text text-muted">Tu puesto no puede ser editado desde este perfil.</small>
                                </div>

                                {/* Campo Nombre */}
                                <div className="form-group mb-3">
                                    <label className="form-label">Nombre:</label> 
                                    <input
                                        type="text"
                                        placeholder="Ingresa tu nombre completo"
                                        name="nombre"
                                        value={nombre}
                                        className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                                        onChange={actualizaNombre}
                                        disabled={isDisabled}
                                    />
                                    {errors.nombre && <div className='invalid-feedback'>{errors.nombre}</div>}
                                </div>


                                {/* BLOQUE DE CREDENCIALES */}
                                <hr className="my-2"/>
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
                                <blockquote className="blockquote text-info d-none">
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
                                    className="btn btn-success mt-3" 
                                    onClick={savePerfil} 
                                    disabled={isDisabled}
                                >
                                    {isSaving ? 'Validando...' : 'Actualizar Perfil'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}