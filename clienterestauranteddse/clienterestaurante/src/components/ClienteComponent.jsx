import React, { useState, useEffect } from 'react'
import { crearCliente, getCliente, updateCliente, registrarCliente } from '../services/ClienteService' // 💡 Importar registrarCliente
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'; // Para acceder al ID del usuario si fuera necesario, aunque no lo usaremos aquí.
import { checkUsernameExists } from '../services/AuthService';


export const ClienteComponent = () => {

    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    // -----------------------------------------------------
    // 1. ESTADOS DE CLIENTE
    // -----------------------------------------------------
    const [nombrecliente, setNombrecliente] = useState('')
    const [telefono, setTelefono] = useState('')
    const [correo, setCorreo] = useState('')

    // -----------------------------------------------------
    // 2. NUEVOS ESTADOS DE AUTENTICACIÓN (Solo para Registro)
    // -----------------------------------------------------
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // La id para editar
    const { id } = useParams();
    const navegar = useNavigate();

    // Actualizaciones de campos
    const actualizaNombreCliente = (e) => { setNombrecliente(e.target.value); }
    const actualizaTelefono = (e) => { setTelefono(e.target.value); }
    const actualizaCorreo = (e) => { setCorreo(e.target.value); }
    // Nuevas funciones de actualización
    const actualizaUsername = (e) => { setUsername(e.target.value); }
    const actualizaPassword = (e) => { setPassword(e.target.value); }
    const actualizaConfirmPassword = (e) => { setConfirmPassword(e.target.value); }

    // Constante de error
    const [errors, setErrors] = useState({
        nombrecliente: '',
        telefono: '',
        correo: '',
        username: '', // Nuevo campo de error
        password: '', // Nuevo campo de error
        confirmPassword: '' // Nuevo campo de error
    })

    // -----------------------------------------------------
    // 3. FUNCIÓN DE VALIDACIÓN DINÁMICA
    // -----------------------------------------------------
    function validaFormBase() {
        // Esta función solo hace las validaciones SIN la llamada a la API
        let valida = true;
        const errorsCopy = { ...errors };

        // Validaciones base (requeridas en Creación y Edición)
        if (nombrecliente.trim()) { errorsCopy.nombrecliente = ''; } else { errorsCopy.nombrecliente = 'El nombre es requerido'; valida = false; }
        if (correo.trim()) { errorsCopy.correo = ''; } else { errorsCopy.correo = 'El correo es requerido'; valida = false; }
        if (telefono.trim()) { errorsCopy.telefono = ''; } else { errorsCopy.telefono = 'El telefono es requerido'; valida = false; }

        // Validaciones de Usuario y Contraseña (solo si estamos en modo CREAR)
        if (!id) {
            // Validación sincrónica de campos requeridos
            if (username.trim()) { errorsCopy.username = ''; } else { errorsCopy.username = 'El nombre de usuario es requerido'; valida = false; }
            if (password.trim()) { errorsCopy.password = ''; } else { errorsCopy.password = 'La contraseña es requerida'; valida = false; }
            if (confirmPassword.trim()) {
                if (password !== confirmPassword) {
                    errorsCopy.confirmPassword = 'Las contraseñas no coinciden';
                    valida = false;
                } else {
                    errorsCopy.confirmPassword = '';
                }
            } else {
                errorsCopy.confirmPassword = 'La confirmación de contraseña es requerida';
                valida = false;
            }
        } else {
            // Limpiamos errores de campos no usados en Edición
            errorsCopy.username = '';
            errorsCopy.password = '';
            errorsCopy.confirmPassword = '';
        }

        setErrors(errorsCopy);
        return valida;
    }

    // -----------------------------------------------------
    // 4. MOMENTO CRUD (Guardar/Editar)
    // -----------------------------------------------------
    async function saveCliente(e) {
        e.preventDefault();

        // 1. Ejecutar validación sincrónica base (campos vacíos, contraseñas no coinciden, etc.)
        // Asume que validaFormBase() maneja los errorsCopy y retorna true/false.
        if (!validaFormBase()) {
            console.log("Fallo la validación sincrónica base.");
            return;
        }

        let message = '';
        let route = '/cliente/lista/0';

        // 💡 MODO EDICIÓN (id existe)
        if (id) {
            const cliente = { nombrecliente, telefono, correo }

            updateCliente(id, cliente).then((response) => {
                console.log("Cliente actualizado:", response.data);
                message = 'Cliente actualizado exitosamente.';
                navegar(route, { state: { toastMessage: message, toastType: 'success' }, replace: true });
            }).catch(error => {
                console.error("Error al actualizar cliente:", error);
                // Podrías mostrar un toast de error genérico aquí
            })

            // 💡 MODO CREACIÓN / REGISTRO (id no existe)
        } else {
            // 2. INICIO de la VALIDACIÓN ASÍNCRONA de USERNAME
            setIsCheckingUsername(true); // Muestra el loading/deshabilita el botón

            try {
                // Intentamos buscar el usuario. Si lo encuentra, la promesa se resuelve (200 OK).
                const response = await checkUsernameExists(username);

                // Si llegamos aquí, el usuario EXISTE (200 OK)
                console.log("Usuario existente encontrado:", response.data);

                // Actualizamos el error de username y detenemos el proceso
                setErrors(prevErrors => ({
                    ...prevErrors,
                    username: 'Este nombre de usuario ya está en uso. Escoge otro.'
                }));

                setIsCheckingUsername(false);
                return; // Salimos de la función sin registrar

            } catch (error) {
                // Si la API devuelve 404 NOT FOUND (lo que significa que NO existe),
                // la promesa se rechaza, y entramos al catch.
                if (error.response && error.response.status === 404) {
                    // 🔑 Éxito: El usuario NO existe, limpiamos error de UI y continuamos.
                    setErrors(prevErrors => ({ ...prevErrors, username: '' }));
                    console.log("Nombre de usuario disponible (404 recibido).");
                } else if (error.response) {
                    // Captura otros errores de respuesta de la API (ej. 500)
                    console.error("Error inesperado de API al verificar usuario:", error);
                    setErrors(prevErrors => ({ ...prevErrors, username: 'Error de servidor al verificar disponibilidad.' }));
                    setIsCheckingUsername(false);
                    return;
                } else {
                    // Captura errores de red (e.g., servidor apagado)
                    console.error("Error de red/conexión al verificar usuario:", error);
                    setErrors(prevErrors => ({ ...prevErrors, username: 'Error de conexión. Inténtalo de nuevo.' }));
                    setIsCheckingUsername(false);
                    return;
                }
            }

            // 3. REGISTRO (Solo se llega aquí si la validación asíncrona fue exitosa (404))
            setIsCheckingUsername(false); // Detenemos el loading antes de la llamada final

            const clienteData = { nombrecliente, telefono, correo, username, password }

            registrarCliente(clienteData).then((response) => {
                console.log("Registro de cliente exitoso:", response.data);
                message = 'Cliente y Usuario creados exitosamente.';
                navegar(route, { state: { toastMessage: message, toastType: 'success' } });

            }).catch(error => {
                console.error("Error al registrar cliente:", error);
                // Manejo de errores de registro (ej. otra validación de backend)
                if (error.response && error.response.data.message) {
                    alert(`Error al registrar: ${error.response.data.message}`);
                }
            })
        }
    }

    // -----------------------------------------------------
    // 5. EFECTO para Cargar datos en Edición
    // -----------------------------------------------------
    useEffect(() => {
        if (id) {
            getCliente(id).then((response) => {
                setNombrecliente(response.data.nombrecliente);
                setTelefono(response.data.telefono);
                setCorreo(response.data.correo);
                // NOTA: No cargamos username/password ya que solo se usan en la creación
            }).catch(error => {
                console.error(error)
            })
        }
    }, [id]
    )

    // Función para el truco del título dinámico
    function pagTitulo() {
        if (id) {
            return <h2 className="text-center mb-0 titcard">Editando cliente </h2>
        } else {
            return <h2 className="text-center mb-0 titcard">Nuevo cliente</h2>
        }
    }

    // -----------------------------------------------------
    // 6. DISEÑO E IMPLEMENTACIÓN
    // -----------------------------------------------------
    return (
        <div className="container mt-5">
            <div className="row">
                <div className="col-md-6 offset-md-3">
                    <div className="card shadow rounded-3">
                        {pagTitulo()}

                        <div className="card-body">
                            <form className="text-start">
                                {/* Campos de Cliente */}
                                <div className="form-group mb-3">
                                    <label className="form-label">Nombre Cliente:</label>
                                    <input
                                        type="text"
                                        placeholder="Ingrese nombre del cliente"
                                        name="nombrecliente"
                                        value={nombrecliente}
                                        className={`form-control ${errors.nombrecliente ? 'is-invalid' : ''}`}
                                        onChange={actualizaNombreCliente}
                                    />
                                    {errors.nombrecliente && <div className='invalid-feedback'>{errors.nombrecliente}</div>}
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label">Teléfono:</label>
                                    <input
                                        type="text"
                                        placeholder="Ingrese número de teléfono"
                                        name="telefono"
                                        value={telefono}
                                        className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                                        onChange={actualizaTelefono}
                                    />
                                    {errors.telefono && <div className='invalid-feedback'>{errors.telefono}</div>}
                                </div>
                                <div className="form-group mb-3">
                                    <label className="form-label">Correo:</label>
                                    <input
                                        type="email"
                                        placeholder="Ingrese correo electrónico"
                                        name="correo"
                                        value={correo}
                                        className={`form-control ${errors.correo ? 'is-invalid' : ''}`}
                                        onChange={actualizaCorreo}
                                    />
                                    {errors.correo && <div className='invalid-feedback'>{errors.correo}</div>}
                                </div>

                                {/* 🔑 NUEVOS CAMPOS: Solo se muestran en modo CREAR */}
                                {!id && (
                                    <>
                                        <hr className="my-4" />
                                        <h5 className="text-center mb-3 text-muted">Datos de Usuario para Acceso</h5>

                                        <div className="form-group mb-3">
                                            <label className="form-label">Nombre de Usuario:</label>
                                            <input
                                                type="text"
                                                placeholder="Cree un nombre de usuario"
                                                name="username"
                                                value={username}
                                                // Deshabilitamos el input mientras se verifica
                                                disabled={isCheckingUsername}
                                                className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                                                onChange={actualizaUsername}
                                            />
                                            {/* Mensaje de feedback mientras verifica */}
                                            {isCheckingUsername && <div className="text-info">Verificando disponibilidad...</div>}
                                            {errors.username && <div className='invalid-feedback'>{errors.username}</div>}
                                        </div>

                                        <div className="form-group mb-3">
                                            <label className="form-label">Contraseña:</label>
                                            <input
                                                type="password"
                                                placeholder="Contraseña"
                                                name="password"
                                                value={password}
                                                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                                onChange={actualizaPassword}
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
                                            />
                                            {errors.confirmPassword && <div className='invalid-feedback'>{errors.confirmPassword}</div>}
                                        </div>
                                    </>
                                )}

                                <button className="btn btn-success" onClick={saveCliente} disabled={isCheckingUsername}>
                                            {isCheckingUsername ? 'Verificando Usuario...' : 'Guardar'}
                                        </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <br />
        </div>
    )
}