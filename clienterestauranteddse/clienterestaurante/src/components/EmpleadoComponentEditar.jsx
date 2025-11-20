// EmpleadoComponentEditar.jsx

import React, { useState, useEffect } from 'react'

import { getEmpleado, updateEmpleado, listPuestos, updateEmpleadoCompleto, updateEmpleadoEspecial } from '../services/EmpleadoService'
import { getAllPerfiles, checkUsernameExists, getUsuarioById, registerUsuario, updateUsuarioSimple } from '../services/AuthService';
import { useNavigate, useParams } from 'react-router-dom'

export const EmpleadoComponentEditar = () => { // 💡 Nombre cambiado

    // Los atributos base del Empleado
    const [nombre, setNombre] = useState('')
    const [idPuesto, setIdPuesto] = useState('')
    
    // El ID del empleado de la URL
    const { id } = useParams(); 

    // Atributos para la autenticación condicional (Edición)
    const [idUsuario, setIdUsuario] = useState(0); // El ID del Usuario (0 si no tiene)
    const [originalIdUsuario, setOriginalIdUsuario] = useState(0); // Para saber si tenía usuario al cargar
    const [username, setUsername] = useState(''); // Se carga si ya tiene usuario
    const [password, setPassword] = useState(''); // Solo se requiere si NO tenía usuario y ahora sí tiene.
    const [confirmPassword, setConfirmPassword] = useState('');

    const [originalUsername, setOriginalUsername] = useState('');

    // Listas
    const [Puestos, setPuestos] = useState([])
    const [perfilesData, setPerfilesData] = useState([]); 
    const [perfilesProtegidos, setPerfilesProtegidos] = useState([]); 

    // ESTADOS DE CONTROL
    const [isSaving, setIsSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(true);


    // --- Handlers ---
    const actualizaNombre = (e) => {
        setNombre(e.target.value);
    }
    const actualizaIdPuesto = (e) => {
        setIdPuesto(e.target.value);
    }
    const actualizaUsername = (e) => setUsername(e.target.value);
    const actualizaPassword = (e) => setPassword(e.target.value);
    const actualizaConfirmPassword = (e) => setConfirmPassword(e.target.value);


    // Manejo de errores
    const [errors, setErrors] = useState({
        nombre: '',
        idPuesto: '',
        username: '',
        password: '',
        confirmPassword: ''
    })


    // --- Funciones de Utilidad ---

    // FUNCIÓN CLAVE: Determina si el puesto actual tiene un perfil de acceso
    const isPuestoConPerfil = () => {
        if (!idPuesto) return false;

        const puestoSeleccionado = Puestos.find(p => p.idPuesto.toString() === idPuesto);
        if (!puestoSeleccionado) return false;

        const nombrePuestoLower = puestoSeleccionado.nombrePuesto.toLowerCase().trim();

        // Comprueba si el nombre del puesto está en la lista de perfiles
        return perfilesProtegidos.some(perfil => perfil.toLowerCase().trim() === nombrePuestoLower);
    };

    // FUNCIÓN DE APOYO: Obtiene el idPerfil necesario para el DTO
    const getIdPerfilForCurrentPuesto = () => {
        if (!idPuesto) return null;

        const puestoSeleccionado = Puestos.find(p => p.idPuesto.toString() === idPuesto);
        if (!puestoSeleccionado) return null;

        const nombrePuestoLower = puestoSeleccionado.nombrePuesto.toLowerCase().trim();

        const perfilCoincidente = perfilesData.find(perfil =>
            perfil.nombre.toLowerCase().trim() === nombrePuestoLower
        );

        return perfilCoincidente ? perfilCoincidente.id : null;
    };
    
    // Para navegar
    const navegar = useNavigate();


    // --- Validación de Formulario (Adaptada para Edición) ---
    async function validaForm() {
        let valida = true;
        const errorsCopy = { ...errors };

        // 1. Validación de campos de Empleado (nombre, puesto)
        // ... (Tu lógica de validación de nombre y puesto existente, que es la misma)
        if (nombre.trim()) {
            errorsCopy.nombre = '';
        } else {
            errorsCopy.nombre = 'El nombre del empleado es requerido';
            valida = false;
        }
        if (idPuesto) {
            errorsCopy.idPuesto = '';
        } else {
            errorsCopy.idPuesto = 'El puesto es requerido';
            valida = false;
        }
        // ...

        // 2. Validación de campos de Usuario (SOLO SI EL PUESTO ACTUAL REQUIERE PERFIL)
        if (isPuestoConPerfil()) {
            
            // a. Username requerido
            if (username.trim()) {
                errorsCopy.username = '';
            } else {
                errorsCopy.username = 'El nombre de usuario es requerido para este puesto';
                valida = false;
            }
            
            // b. Contraseñas (Solo se requieren si PASA de SIN USUARIO a CON USUARIO)
            const isAddingUser = originalIdUsuario === 0 && idUsuario === 0; // Si el ID original era 0 y aún no tiene uno (se va a crear)

            if (isAddingUser) {
                if (password.trim()) {
                    errorsCopy.password = '';
                } else {
                    errorsCopy.password = 'La contraseña es requerida para el nuevo usuario';
                    valida = false;
                }

                if (confirmPassword.trim()) {
                    errorsCopy.confirmPassword = '';
                } else {
                    errorsCopy.confirmPassword = 'Debe confirmar su contraseña';
                    valida = false;
                }

                if (password !== confirmPassword) {
                    errorsCopy.password = 'Las contraseñas no coinciden';
                    errorsCopy.confirmPassword = 'Las contraseñas no coinciden';
                    valida = false;
                }
            } else {
                // Si ya tiene usuario o si el cambio es de CON USUARIO a CON USUARIO, no se pide contraseña.
                errorsCopy.password = '';
                errorsCopy.confirmPassword = '';
            }
            
            // c. Validación Asíncrona de Username (solo si estamos insertando un nuevo usuario o si el username ha cambiado)
            const isUsernameBeingChecked = (originalIdUsuario === 0) || 
                (originalIdUsuario !== 0 && username.trim() !== originalUsername.trim());
            if (valida && isUsernameBeingChecked) {
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

        } else {
             // Limpiar errores de usuario si no se requieren
             errorsCopy.username = '';
             errorsCopy.password = '';
             errorsCopy.confirmPassword = '';
        }

        setErrors(errorsCopy);
        return valida;
    }


    // --- Guardar Empleado (ASÍNCRONO - Lógica de Edición Compleja) ---
    async function saveEmpleado(e) {
        e.preventDefault();

        setIsSaving(true);

        if (!(await validaForm())) {
            setIsSaving(false);
            return;
        }

        const idPuestoInteger = parseInt(idPuesto);
        const nombreTrimmed = nombre.trim();
        let message = '';

        // 1. Estados inicial y final del Puesto
        const puestoActualConPerfil = isPuestoConPerfil(); // ¿El puesto seleccionado ahora requiere usuario?
        const puestoOriginalConPerfil = originalIdUsuario !== 0; // ¿Tenía usuario al cargar?

        try {
            // --- CASO 1: CON USUARIO -> CON USUARIO (Incluye cambio de puesto con perfil) ---
            if (puestoOriginalConPerfil && puestoActualConPerfil) {
                // Actualización COMPLETA (Empleado DTO + Username + idPerfil)
                const idPerfil = getIdPerfilForCurrentPuesto();
                if (idPerfil === null) throw new Error("Error interno: No se pudo encontrar el ID de Perfil.");
                
                const empleadoUpdateRequest = {
                    nombre: nombreTrimmed,
                    idPuesto: idPuestoInteger,
                    username: username.trim(),
                    idPerfil: idPerfil 
                };

                await updateEmpleadoCompleto(id, empleadoUpdateRequest); // Nuevo endpoint
                message = `Empleado ${nombreTrimmed} y usuario actualizados exitosamente.`;
            } 
            
            // --- CASO 2: CON USUARIO -> SIN USUARIO ---
            else if (puestoOriginalConPerfil && !puestoActualConPerfil) {
                // a) Desactivar el usuario antiguo (asignarle idPerfil=5 / Cliente)
                const usuarioDesactivacionRequest = {
                    username: username.trim(), // Mantenemos el username original
                    idPerfil: 5 // 💡 ID del perfil "Cliente" o "No Usable"
                };
                await updateUsuarioSimple(originalIdUsuario, usuarioDesactivacionRequest);
                
                // b) Actualizar el empleado para quitarle la asociación (idUsuario = 0)
                const empleadoSimpleUpdate = { 
                    nombre: nombreTrimmed, 
                    idPuesto: idPuestoInteger, 
                    idUsuario: 0 
                };
                
                await updateEmpleadoEspecial(id, empleadoSimpleUpdate);

                message = `Empleado ${nombreTrimmed} actualizado. Se desvinculó su cuenta de usuario.`;
            } 
            
            // --- CASO 3: SIN USUARIO -> CON USUARIO (Requiere creación de usuario) ---
            else if (!puestoOriginalConPerfil && puestoActualConPerfil) {
                
                // a) Registrar el nuevo Usuario
                const idPerfil = getIdPerfilForCurrentPuesto();
                if (idPerfil === null) throw new Error("Error interno: No se pudo encontrar el ID de Perfil para registrar.");

                const registroRequest = {
                    username: username.trim(),
                    password: password.trim(),
                    idPerfil: idPerfil
                };
                
                // 💡 Paso 1: Crear el usuario y OBTENER su ID de la respuesta
                const newUsuarioResponse = await registerUsuario(registroRequest);
                const newIdUsuario = newUsuarioResponse.data.id; // ¡Obtenemos el ID!

                // b) Paso 2: Actualizar el Empleado usando el endpoint SIMPLE, pero enviando el nuevo ID de Usuario
                const empleadoSimpleUpdate = { 
                    nombre: nombreTrimmed, 
                    idPuesto: idPuestoInteger, 
                    idUsuario: newIdUsuario // <--- ¡Esto es lo que faltó en tu intento anterior!
                };
                
                // 💡 USAMOS updateEmpleado para actualizar el DTO, incluyendo el nuevo ID de Usuario
                // Este endpoint debe estar configurado en el backend para aceptar y persistir idUsuario.
                await updateEmpleadoEspecial(id, empleadoSimpleUpdate);

                message = `Empleado ${nombreTrimmed} actualizado. Se le creó y asoció una nueva cuenta de usuario.`;
            }
                        
            // --- CASO 4: SIN USUARIO -> SIN USUARIO ---
            else {
                // Actualizar Empleado (simple)
                const empleadoSimpleUpdate = { 
                    nombre: nombreTrimmed, 
                    idPuesto: idPuestoInteger, 
                    idUsuario: 0 
                };
                //----------------------------------------------Chefi------
                await updateEmpleado(id, empleadoSimpleUpdate); // Endpoint de actualización normal

                message = `Empleado ${nombreTrimmed} actualizado exitosamente.`;
            }

            // Navegación final
            const navigateOptions = { state: { toastMessage: message, toastType: 'success' }, replace: true };
            navegar('/empleado/lista/0', navigateOptions);

        } catch (error) {
            console.error("Error al guardar Empleado:", error);
            alert(`Error al guardar: ${error.response?.data?.message || 'Ocurrió un error en el servidor. Revise la consola para detalles.'}`);
        } finally {
            setIsSaving(false);
        }
    }


    // --- Precarga de Datos (Carga Empleado y, si aplica, su Usuario) ---
    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingData(true);
            try {
                // 1. Cargar Puestos y Perfiles
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

                // 2. Cargar datos del Empleado a Editar
                if (id) {
                    const empleadoResponse = await getEmpleado(id);
                    const empleadoData = empleadoResponse.data;
                    
                    setNombre(empleadoData.nombre);
                    setIdPuesto(empleadoData.idPuesto.toString());
                    
                    // a. Cargar ID de Usuario
                    const currentIdUsuario = empleadoData.idUsuario || 0; // Usar 0 si es null/undefined
                    setIdUsuario(currentIdUsuario);
                    setOriginalIdUsuario(currentIdUsuario); // Guardar estado original
                    
                    // b. Si tiene usuario, cargamos su username
                    if (currentIdUsuario !== 0) {
                        try {
                            const usuarioResponse = await getUsuarioById(currentIdUsuario);
                            const loadedUsername = usuarioResponse.data.username; // Guardar el valor cargado
                            
                            setUsername(loadedUsername);
                            setOriginalUsername(loadedUsername); // 💡 GUARDAR EL USERNAME ORIGINAL
                        } catch (userError) {
                            console.warn(`Usuario con ID ${currentIdUsuario} no encontrado. Se asume eliminado/inactivo.`, userError);
                            // Mantener idUsuario y originalIdUsuario para no cambiar el flujo de edición drásticamente
                        }
                    }
                    
                } else {
                    // Si no hay ID en URL, regresar a lista (esto es un componente de EDICIÓN)
                    navegar('/empleado/lista/0', { replace: true });
                    return;
                }

            } catch (error) {
                console.error("Error al cargar datos iniciales:", error);
            } finally {
                setLoadingData(false);
            }
        };

        loadInitialData();

    }, [id, navegar]) // Dependencia de ID y Navegar


    // --- Renderizado (Igual que el componente de inserción, pero adaptando el título) ---
    
    function pagTitulo() {
        return <h2 className="text-center mb-0 titcard"> Editando empleado </h2>
    }

    if (loadingData) {
        return <div className="text-center mt-5">Cargando datos iniciales...</div>
    }
    
    const isDisabled = isSaving || loadingData;
    
    if (Puestos.length === 0) {
        return <div className="text-center mt-5 alert alert-warning">No hay puestos registrados.</div>
    }
    
    // Verificación de estado
    const puestoActualConPerfil = isPuestoConPerfil();
    const puestoOriginalConPerfil = originalIdUsuario !== 0;
    const isAddingUser = !puestoOriginalConPerfil && puestoActualConPerfil;
    
    // Renderizado condicional del bloque de credenciales
    let showCredentialsBlock = puestoActualConPerfil || puestoOriginalConPerfil;
    
    // Si pasa de CON USUARIO a SIN USUARIO, mostramos el mensaje de que el usuario será desactivado.
    if(puestoOriginalConPerfil && !puestoActualConPerfil) {
        showCredentialsBlock = true; // Forzamos mostrar el bloque para el mensaje.
    }

    return (
        <div className="container mt-5 mb-5">
            <div className="row">
                <div className="col-md-6 offset-md-3">
                    <div className="card shadow rounded-3">
                        {pagTitulo()}

                        <div className="card-body">
                            <form className="text-start">

                                {/* Campo Nombre */}
                                <div className="form-group mb-3">
                                    <label className="form-label">Nombre del Empleado:</label> 
                                    <input
                                        type="text"
                                        placeholder="Ingrese nombre del empleado"
                                        name="nombre"
                                        value={nombre}
                                        className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                                        onChange={actualizaNombre}
                                        disabled={isDisabled}
                                    />
                                    {errors.nombre && <div className='invalid-feedback'>{errors.nombre}</div>}
                                </div>


                                {/* Campo Puesto */}
                                <div className="form-group mb-3">
                                    <label className="form-label">Puesto:</label> 
                                    <select
                                        name="idPuesto"
                                        value={idPuesto}
                                        className={`form-select ${errors.idPuesto ? 'is-invalid' : ''}`}
                                        onChange={actualizaIdPuesto}
                                        disabled={isDisabled}
                                    >
                                        {Puestos.map(puesto => (
                                            <option key={puesto.idPuesto} value={puesto.idPuesto.toString()}>
                                                {puesto.nombrePuesto} 
                                            </option>
                                        ))}
                                    </select>
                                    {errors.idPuesto && <div className='invalid-feedback'>{errors.idPuesto}</div>}
                                </div>


                                {/* 💡 CAMPOS DE ACCESO CONDICIONALES (Modo Edición) */}
                                {showCredentialsBlock && ( 
                                    <>
                                        <hr className="my-3"/>
                                        <h5 className="mb-3 text-secondary">Credenciales de Acceso</h5>
                                        
                                        {/* Mensaje de Desvinculación */}
                                        {puestoOriginalConPerfil && !puestoActualConPerfil && (
                                            <blockquote className="blockquote text-danger">
                                                <p className="mb-0 small">Al guardar, la cuenta de usuario **{username}** se desvinculará del empleado y se deshabilitará.</p>
                                            </blockquote>
                                        )}
                                        
                                        {/* Campo Usuario (Siempre visible si está involucrado el usuario) */}
                                        {(puestoActualConPerfil || puestoOriginalConPerfil) && (
                                            <div className="form-group mb-3">
                                                <label className="form-label">Usuario:</label>
                                                <input
                                                    type="text"
                                                    placeholder="Nombre de usuario"
                                                    name="username"
                                                    value={username}
                                                    className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                                                    onChange={actualizaUsername}
                                                    disabled={isDisabled || !puestoActualConPerfil} // Deshabilitado si el nuevo puesto no requiere usuario
                                                />
                                                {errors.username && <div className='invalid-feedback'>{errors.username}</div>}
                                            </div>
                                        )}

                                        {/* Campos de Contraseña (Solo si estamos AÑADIENDO un nuevo usuario) */}
                                        {isAddingUser && ( 
                                            <>
                                                <blockquote className="blockquote text-info">
                                                    <p className="mb-0 small">El puesto seleccionado requiere credenciales. Ingrese la nueva contraseña.</p>
                                                </blockquote>
                                                <div className="form-group mb-3">
                                                    <label className="form-label">Contraseña:</label>
                                                    <input
                                                        type="password"
                                                        placeholder="Defina la contraseña"
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
                                            </>
                                        )}
                                    </>
                                )}

                                <button 
                                    className="btn btn-success mt-3" 
                                    onClick={saveEmpleado} 
                                    disabled={isDisabled}
                                >
                                    {isSaving ? 'Procesando...' : 'Actualizar'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}