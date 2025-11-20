import React, { useState, useEffect } from 'react'

import { crearEmpleado, getEmpleado, updateEmpleado, listPuestos, registerEmpleadoCompleto } from '../services/EmpleadoService'
import { getAllPerfiles, checkUsernameExists } from '../services/AuthService';
import { useNavigate, useParams } from 'react-router-dom'

export const EmpleadoComponent = () => {

    // Los atributos base
    const [nombre, setNombre] = useState('')
    const [idPuesto, setIdPuesto] = useState('')

    // Atributos para la autenticación condicional
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // La lista de puestos y perfiles
    const [Puestos, setPuestos] = useState([])
    const [perfilesData, setPerfilesData] = useState([]); // 💡 NUEVO: Objetos completos de perfiles {idperfil, nombre}
    const [perfilesProtegidos, setPerfilesProtegidos] = useState([]); // Nombres de perfiles para check condicional

    // La id para editar de una
    const { id } = useParams();

    // ESTADOS DE CONTROL
    const [isSaving, setIsSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(true);


    // Actualizaciones
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


    // FUNCIÓN CLAVE: Determina si el puesto actual tiene un perfil de acceso
    const isPuestoConPerfil = () => {
        if (!idPuesto) return false;

        const puestoSeleccionado = Puestos.find(p => p.idPuesto.toString() === idPuesto);
        if (!puestoSeleccionado) return false;

        const nombrePuestoLower = puestoSeleccionado.nombrePuesto.toLowerCase().trim();

        // Comprueba si el nombre del puesto está en la lista de perfiles
        return perfilesProtegidos.some(perfil => perfil.toLowerCase().trim() === nombrePuestoLower);
    };

    //FUNCIÓN DE APOYO: Obtiene el idPerfil necesario para el DTO
    const getIdPerfilForCurrentPuesto = () => {
        if (!idPuesto) return null;

        const puestoSeleccionado = Puestos.find(p => p.idPuesto.toString() === idPuesto);
        if (!puestoSeleccionado) return null;

        const nombrePuestoLower = puestoSeleccionado.nombrePuesto.toLowerCase().trim();

        //Buscamos el objeto perfil que coincida con el nombre del puesto
        const perfilCoincidente = perfilesData.find(perfil =>
            perfil.nombre.toLowerCase().trim() === nombrePuestoLower
        );

        
        return perfilCoincidente ? perfilCoincidente.id : null;
    };


    // Validación del Formulario (Sincrónica y Asíncrona)
    async function validaForm() {
        let valida = true;
        const errorsCopy = { ...errors };

        // 1. Validación de campo requerido: Nombre
        if (nombre.trim()) {
            errorsCopy.nombre = '';
        } else {
            errorsCopy.nombre = 'El nombre del empleado es requerido';
            valida = false;
        }

        // 2. Validación de campo requerido: Puesto
        if (idPuesto) {
            errorsCopy.idPuesto = '';
        } else {
            errorsCopy.idPuesto = 'El puesto es requerido';
            valida = false;
        }

        // 3. Validación de campos de Usuario/Contraseña (SOLO SI APLICA)
        if (isPuestoConPerfil()) {

            // a. Username requerido
            if (username.trim()) {
                errorsCopy.username = '';
            } else {
                errorsCopy.username = 'El nombre de usuario es requerido para este puesto';
                valida = false;
            }

            // b. Password requerido y coincidencia
            if (password.trim()) {
                errorsCopy.password = '';
            } else {
                errorsCopy.password = 'La contraseña es requerida';
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

            // c. Validación Asíncrona de Username (si la validación sincrónica pasó y estamos insertando)
            if (valida && !id) {
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


    //Para navegar
    const navegar = useNavigate();

    //Guardar Empleado
    async function saveEmpleado(e) {
        e.preventDefault();

        setIsSaving(true);

        //1. Ejecutar la validación completa
        if (!(await validaForm())) {
            setIsSaving(false);
            return;
        }

        const idPuestoInteger = parseInt(idPuesto);
        const nombreTrimmed = nombre.trim();
        let message = '';
        let navigateOptions = {};

        try {
            if (isPuestoConPerfil()) {
                //Registro completo (Empleado + Usuario)

                //Obtener el ID del Perfil
                const idPerfil = getIdPerfilForCurrentPuesto();

                if (idPerfil === null) {
                    throw new Error("Error interno: No se pudo encontrar el ID de Perfil.");
                }

                if (!id) {
                    //Inserción
                    const empleadoRegistroRequest = {
                        nombre: nombreTrimmed,
                        idPuesto: idPuestoInteger,
                        username: username.trim(),
                        password: password.trim(),
                        idPerfil: idPerfil
                    };

                    await registerEmpleadoCompleto(empleadoRegistroRequest);
                    message = `Empleado ${nombreTrimmed} y usuario creados exitosamente.`;
                } else {
                    //Edición (se actualiza solo el DTO de Empleado, 
                    //la cuenta de usuario se deja intacta)
                    const empleado = { nombre: nombreTrimmed, idPuesto: idPuestoInteger, idUsuario: null };
                    await updateEmpleado(id, empleado);
                    message = `Empleado ${nombreTrimmed} y puesto actualizados.`;
                }

            } else {
                //Registro simple (Solo Empleado)
                const empleado = { nombre: nombreTrimmed, idPuesto: idPuestoInteger, idUsuario: 0 };

                if (id) {
                    await updateEmpleado(id, empleado);
                    message = `Empleado ${nombreTrimmed} actualizado exitosamente.`;
                } else {
                    await crearEmpleado(empleado);
                    message = `Empleado ${nombreTrimmed} creado exitosamente.`;
                }
            }

            navigateOptions = { state: { toastMessage: message, toastType: 'success' }, replace: true };
            navegar('/empleado/lista/0', navigateOptions);

        } catch (error) {
            console.error("Error al guardar Empleado:", error);
            alert(`Error al guardar: ${error.response?.data?.message || 'Ocurrió un error en el servidor. Revise la consola para detalles.'}`);
        } finally {
            setIsSaving(false);
        }
    }

    //Función para el truco del título dinámico si es edicion o agregar
    function pagTitulo() {
        if (id) {
            return <h2 className="text-center mb-0 titcard"> Editando Empleado </h2>
        } else {
            return <h2 className="text-center mb-0 titcard"> Nuevo empleado </h2>
        }
    }


    // La precarga de datos y perfiles
    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingData(true);
            try {
                // 1. Cargar lista de Puestos y Perfiles
                const [puestosResponse, perfilesResponse] = await Promise.all([
                    listPuestos(),
                    getAllPerfiles()
                ]);

                const puestosData = puestosResponse.data;
                setPuestos(puestosData);

                // 2. Cargar Perfiles y sus IDs
                const perfilesRawData = perfilesResponse.data;
                setPerfilesData(perfilesRawData); // Guardamos el objeto completo
                const perfilesNombres = perfilesRawData.map(p => p.nombre);
                setPerfilesProtegidos(perfilesNombres);

                // 3. Preseleccionar/Cargar datos en edición
                if (id) {
                    const empleadoResponse = await getEmpleado(id);
                    const empleadoData = empleadoResponse.data;

                    setNombre(empleadoData.nombre);
                    setIdPuesto(empleadoData.idPuesto.toString());

                } else if (puestosData.length > 0) {
                    setIdPuesto(puestosData[0].idPuesto.toString());
                }

            } catch (error) {
                console.error("Error al cargar datos iniciales:", error);
            } finally {
                setLoadingData(false);
            }
        };

        loadInitialData();

    }, [id])


    // ... (renderizado del componente)

    // Si los datos aún se están cargando
    if (loadingData) {
        return <div className="text-center mt-5">Cargando datos iniciales...</div>
    }

    // Deshabilitar UI si está guardando o cargando datos iniciales
    const isDisabled = isSaving || loadingData;

    // Si la lista de puestos está vacía, no se puede continuar
    if (Puestos.length === 0) {
        return <div className="text-center mt-5 alert alert-warning">No hay puestos registrados. Por favor, registre puestos antes de crear empleados.</div>
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


                                {/* 💡 CAMPOS DE ACCESO CONDICIONALES */}
                                {isPuestoConPerfil() && !id && ( // Solo muestra en INSERCIÓN. La edición es más compleja.
                                    <>
                                        <hr className="my-3" />
                                        <h5 className="mb-3 text-secondary">Credenciales de Acceso al Sistema</h5>

                                        {/* Campo Usuario */}
                                        <div className="form-group mb-3">
                                            <label className="form-label">Usuario:</label>
                                            <input
                                                type="text"
                                                placeholder="Defina un nombre de usuario"
                                                name="username"
                                                value={username}
                                                className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                                                onChange={actualizaUsername}
                                                disabled={isDisabled}
                                            />
                                            {errors.username && <div className='invalid-feedback'>{errors.username}</div>}
                                        </div>

                                        {/* Campo Contraseña */}
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

                                        {/* Campo Confirmar Contraseña */}
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

                                <button
                                    className="btn btn-success mt-3"
                                    onClick={saveEmpleado}
                                    disabled={isDisabled}
                                >
                                    {isSaving ? 'Procesando...' : 'Guardar'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}