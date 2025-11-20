import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { listMesas } from '../services/MesaService';
import { crearReservacion, getReservacion, updateReservacion } from '../services/ReservarService';

export const ReservarComponent = () => {

    //Navegación y parámetros pasados por la URL
    const navegar = useNavigate();
    const { idReserva, idcliente } = useParams();

    const [clienteId, setClienteId] = useState(idcliente || '');

    //Estados y constantes
    const [idMesa, setIdMesa] = useState('');
    const [mesas, setMesas] = useState([]);


    const [fechaReservacion, setFechaReservacion] = useState('');
    const [horaReservacion, setHoraReservacion] = useState('');


    const [fechaSistema, setFechaSistema] = useState('');
    const [horaSistema, setHoraSistema] = useState('');

    //Manejo de errores
    const [errors, setErrors] = useState({
        idMesa: '',
        fechaReservacion: '',
        horaReservacion: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    //Funciones de inicialización y actualización

    //Función para obtener y fijar la fecha/hora actual
    const setDateTime = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const mi = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');

        const fechaHoy = `${yyyy}-${mm}-${dd}`;
        const horaAhora = `${hh}:${mi}:${ss}`;

        setFechaSistema(fechaHoy);
        setHoraSistema(horaAhora);

        //Inicializar los campos con la hora actual (HH:mm)
        setFechaReservacion(fechaHoy);
        setHoraReservacion(`${hh}:${mi}`);
    }

    const actualizaIdMesa = (e) => {
        setIdMesa(e.target.value);
    }

    const actualizaFechaReservacion = (e) => {
        setFechaReservacion(e.target.value);
    }

    const actualizaHoraReservacion = (e) => {
        //Guardamos el valor HH:mm del input
        setHoraReservacion(e.target.value);
    }

    //Validación y lógica principal del flujo

    function validaForm() {
        let valida = true;
        const errorsCopy = { ...errors };

        //Validación de Mesa
        if (idMesa.trim()) {
            errorsCopy.idMesa = '';
        } else {
            errorsCopy.idMesa = 'Debe seleccionar una mesa para la reservación.';
            valida = false;
        }

        //Validación de Fecha
        if (!fechaReservacion.trim()) {
            errorsCopy.fechaReservacion = 'Debe ingresar una fecha de reservación.';
            valida = false;
        } else if (fechaReservacion < fechaSistema) {
            errorsCopy.fechaReservacion = 'La fecha de reservación no puede ser anterior a la fecha actual.';
            valida = false;
        } else {
            errorsCopy.fechaReservacion = '';
        }

        //Validación de Hora
        if (!horaReservacion.trim()) {
            errorsCopy.horaReservacion = 'Debe ingresar una hora de reservación.';
            valida = false;
        } else if (valida && fechaReservacion === fechaSistema) {

            const horaActualHHMM = horaSistema.substring(0, 5);

            if (horaReservacion < horaActualHHMM) {
                errorsCopy.horaReservacion = 'Si la fecha es hoy, la hora no puede ser anterior a la hora actual.';
                valida = false;
            } else {
                errorsCopy.horaReservacion = '';
            }
        } else {
            errorsCopy.horaReservacion = '';
        }

        setErrors(errorsCopy);
        return valida;
    }

    //Función para el registro de la Reservación
    function realizarReservacion(e) {
        e.preventDefault();

        setIsSubmitting(true);

        if (validaForm()) {

            const idMesaInt = parseInt(idMesa);
            const idClienteInt = parseInt(idcliente);

            //Agregamos los segundos en '00' internamente
            const horaFinal = horaReservacion + ':00';

            //Crear el objeto Reservación (Mesa-Cliente-Fecha/Hora)
            const reservarRequest = {
                fecha: fechaReservacion,
                hora: horaFinal,
                idMesa: idMesaInt,
                idCliente: idClienteInt,

            };

            //El insert
            crearReservacion(reservarRequest)
                .then(responseReservacion => {
                    console.log("Registro de Reservación exitoso:", responseReservacion.data);

                    navegar('/cliente/lista/0');
                })
                .catch(error => {
                    console.error("Error al intentar registrar la reservación:", error.response ? error.response.data : error.message);
                    alert("Ocurrió un error al intentar registrar la reservación. Verifique la consola.");
                })
                .finally(() => {
                    setIsSubmitting(false);
                });
        } else {
            setIsSubmitting(false);

        }
    }

    function manejarReservacion(e) {
        e.preventDefault();

        setIsSubmitting(true);

        if (validaForm()) {

            // Se re-evalúa el perfil aquí para usar la lógica de ajuste.
            const perfiles = localStorage.getItem('perfiles');
            const esCliente = perfiles && perfiles.includes('Cliente');

            const idMesaInt = parseInt(idMesa);
            const idClienteFinal = clienteId ? parseInt(clienteId) : null;

            // Variables para la fecha y hora que realmente se enviarán al backend
            let fechaParaBackend = fechaReservacion;
            let horaParaBackend = horaReservacion;

            // 1. Lógica de DOBLE AJUSTE CONDICIONAL (SOLO EN EDICIÓN)
            if (idReserva) {

                // AJUSTE PARA NO-CLIENTES (Administrador/Empleado)
                if (!esCliente) {
                    console.log("[AJUSTE NO-CLIENTE] Editando: Sumando +1 día y restando -6 horas.");

                    // --- AJUSTE DE FECHA (+1 día) ---
                    // Tomamos la fecha del input (fechaReservacion) y le sumamos 1 día antes de guardar.
                    const fechaObj = new Date(fechaReservacion + 'T00:00:00'); // Usar T00:00:00 para evitar TZ issues
                    fechaObj.setDate(fechaObj.getDate()); // Suma el día

                    const yyyy = fechaObj.getFullYear();
                    const mm = String(fechaObj.getMonth() + 1).padStart(2, '0');
                    const dd = String(fechaObj.getDate()).padStart(2, '0');
                    fechaParaBackend = `${yyyy}-${mm}-${dd}`; // La fecha ajustada para el backend

                    // --- AJUSTE de HORA (-6 horas) ---
                    const fechaHoraStr = `${fechaReservacion}T${horaReservacion}:00`;
                    const fechaHoraObj = new Date(fechaHoraStr);

                    fechaHoraObj.setHours(fechaHoraObj.getHours() - 6);

                    const newHH = String(fechaHoraObj.getHours()).padStart(2, '0');
                    const newMM = String(fechaHoraObj.getMinutes()).padStart(2, '0');

                    horaParaBackend = `${newHH}:${newMM}`;

                    console.log(`[AJUSTE NO-CLIENTE] Fecha Original Input: ${fechaReservacion}, Hora Original Input: ${horaReservacion}`);
                    console.log(`[AJUSTE NO-CLIENTE] Fecha Enviada (+1 día): ${fechaParaBackend}, Hora Enviada (-6h): ${horaParaBackend}`);
                } else {
                    console.log("[AJUSTE CLIENTE] Editando: Restando -6 horas (el ajuste de fecha ya está en el input).");

                    // --- AJUSTE de HORA (-6 horas) --- (Lógica de la solicitud anterior)
                    const fechaHoraStr = `${fechaReservacion}T${horaReservacion}:00`;
                    const fechaHoraObj = new Date(fechaHoraStr);

                    fechaHoraObj.setHours(fechaHoraObj.getHours() - 6);

                    const newHH = String(fechaHoraObj.getHours()).padStart(2, '0');
                    const newMM = String(fechaHoraObj.getMinutes()).padStart(2, '0');

                    horaParaBackend = `${newHH}:${newMM}`;

                    console.log(`[AJUSTE CLIENTE] Hora original: ${horaReservacion}, Hora ajustada (-6h): ${horaParaBackend}. Fecha enviada: ${fechaParaBackend}`);
                }
            }
            // NOTA IMPORTANTE: La corrección de fecha (+1 día para No-Cliente) debe estar **sincronizada** // con la lógica de precarga en `useEffect`. Asumimos que `fechaReservacion` ya tiene la fecha correcta 
            // que debe ser enviada (con el +1 o +2 días).


            // 2. Agregar los segundos '00' para el backend
            const horaFinal = horaParaBackend + ':00'; // 👈 Se usa la hora ajustada o la original

            //Crear el objeto Reservación
            const reservarRequest = {
                fecha: fechaParaBackend, // 👈 Se usa la fecha ajustada/visible
                hora: horaFinal,        // 👈 Se usa la hora ajustada/visible
                idMesa: idMesaInt,

                idCliente: idClienteFinal,
                estatus: 0
            };

            let promise;
            let successMessage;

            //Decidir si es editar o crear
            if (idReserva) {
                //Editar
                console.log(`Actualizando Reservación ID ${idReserva}:`, reservarRequest);
                promise = updateReservacion(idReserva, reservarRequest);
                successMessage = "Reservación actualizada exitosamente.";
            } else {
                //Crear
                console.log("Creando nueva Reservación:", reservarRequest);
                promise = crearReservacion(reservarRequest);
                successMessage = "Reservación registrada exitosamente.";
            }

            promise.then(response => {
                console.log(successMessage, response.data);

                if (idReserva) {

                    // La lógica de redirección se mantiene igual
                    if (esCliente) {
                        // 🟢 Redirección para el Cliente
                        console.log("Perfil Cliente detectado, redirigiendo a /clientevista/susreservas");
                        navegar('/clientevista/susreservas', {
                            replace: true,
                            state: { toastMessage: successMessage, toastType: 'success' }
                        });
                    } else {
                        // 🟡 Redirección para el Empleado/Administrador (flujo original)
                        console.log("Perfil Empleado/Admin detectado, redirigiendo a /reserva/lista/0");
                        navegar('/reserva/lista/0', {
                            replace: true,
                            state: { toastMessage: successMessage, toastType: 'success' }
                        });
                    }

                } else {

                    navegar('/cliente/lista/0', { state: { toastMessage: successMessage, toastType: 'success' } })
                }
            })
                .catch(error => {
                    console.error(`Error al ${idReserva ? 'actualizar' : 'registrar'} la reservación:`, error.response ? error.response.data : error.message);
                    alert("Ocurrió un error. Verifique la consola.");
                })
                .finally(() => {
                    setIsSubmitting(false);
                });

        } else {
            setIsSubmitting(false);
        }
    }


    //El use effect
    useEffect(() => {
        //Inicializa la fecha y hora
        setDateTime();

        //Cargar la lista de todas las Mesas
        listMesas().then((response) => {
            const data = response.data;
            setMesas(data);
            if (data.length > 0) {
                if (!idReserva && idMesa === '' && data.length > 0) {
                    setIdMesa(data[0].idMesa.toString());
                }
            }
        }).catch(error => {
            console.error("Error al cargar la lista de Mesas:", error);
        });

        //Cargar la reservación si estamos editando
        if (idReserva) {
            getReservacion(idReserva).then((response) => {
                const reserva = response.data;

                // Lógica para determinar cuántos días sumar
                const perfiles = localStorage.getItem('perfiles');
                // La variable `diasASumar` será 2 si es Cliente, de lo contrario será 1.
                const diasASumar = perfiles && perfiles.includes('Cliente') ? 1 : 1;

                console.log(`Perfil detectado. Días a sumar a la fecha de edición: ${diasASumar}`);

                // 1. Obtener la fecha de la reserva
                // Se utiliza el constructor Date con el formato YYYY-MM-DD para evitar problemas de zona horaria.
                const fechaReservaOriginal = new Date(reserva.fecha + 'T00:00:00');

                // 2. Sumarle el número de días condicional
                fechaReservaOriginal.setDate(fechaReservaOriginal.getDate() + diasASumar);

                // 3. Formatear la nueva fecha a YYYY-MM-DD
                const yyyy = fechaReservaOriginal.getFullYear();
                const mm = String(fechaReservaOriginal.getMonth() + 1).padStart(2, '0');
                const dd = String(fechaReservaOriginal.getDate()).padStart(2, '0');
                const fechaMasDias = `${yyyy}-${mm}-${dd}`;

                // 4. Obtener la hora
                const horaHHMM = reserva.hora ? reserva.hora.substring(0, 5) : '';

                // 5. Asignar los valores a los estados
                setIdMesa(reserva.idMesa.toString());
                setFechaReservacion(fechaMasDias); // 👈 ¡Fecha con los días condicionales sumados!
                setHoraReservacion(horaHHMM);

                if (reserva.idCliente) {
                    setClienteId(reserva.idCliente.toString());
                }

            }).catch(error => {
                console.error(`Error al cargar la reservación ID ${idReserva}:`, error);
            });
        }

    }, [idReserva]);

    function pagTitulo() {
        if (idReserva) {
            return <h4 className="text-center mb-0 titcard">Editando Reservación ID: {idReserva}</h4>;
        }
        return <h4 className="text-center mb-0 titcard">Registrar nueva reservación</h4>;
    }

    return (
        <div className="container mt-2 mb-3">
            <div className="row">
                <div className="col-md-8 offset-md-2">
                    <div className="card shadow rounded-3">

                        {pagTitulo()}
                        <hr />

                        <div className="card-body">
                            <form className="text-start" onSubmit={manejarReservacion}>


                                <div className="row mb-4 border-bottom pb-3 d-none">
                                    <div className="col-md-4 mx-auto">
                                        <div className="w-100 mx-auto">
                                            <label className="form-label fw-bold text-start">Cliente:</label>
                                            <input
                                                type="text"
                                                className="form-control text-center bg-light"
                                                value={clienteId}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                </div>


                                <div className="row mb-4">
                                    <div className="col-md-6 mb-3 mb-md-0">
                                        <div className="form-group">
                                            <label className="form-label fw-bold">Fecha de la Reservación:</label>
                                            <input
                                                type="date"
                                                name="fechaReservacion"
                                                className={`form-control ${errors.fechaReservacion ? 'is-invalid' : ''}`}
                                                value={fechaReservacion}
                                                onChange={actualizaFechaReservacion}
                                                required
                                            />
                                            {errors.fechaReservacion && <div className='invalid-feedback'>{errors.fechaReservacion}</div>}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label fw-bold">Hora de la Reservación:</label>
                                            <input
                                                type="time"
                                                name="horaReservacion"
                                                className={`form-control ${errors.horaReservacion ? 'is-invalid' : ''}`}
                                                value={horaReservacion} //Contiene solo HH:mm
                                                onChange={actualizaHoraReservacion}

                                                required
                                            />
                                            {errors.horaReservacion && <div className='invalid-feedback'>{errors.horaReservacion}</div>}
                                        </div>
                                    </div>
                                </div>


                                <div className="form-group mb-4">
                                    <label className="form-label fw-bold">3. Elija la Mesa a Reservar:</label>
                                    <select
                                        name="idMesa"
                                        value={idMesa}
                                        className={`form-select ${errors.idMesa ? 'is-invalid' : ''}`} onChange={actualizaIdMesa} required>

                                        {mesas.length === 0 ? (
                                            <option value="" disabled>Cargando mesas...</option>
                                        ) : (
                                            mesas.map(mesa => (
                                                <option key={mesa.idMesa} value={mesa.idMesa.toString()}>
                                                    No. de mesa: {mesa.numero} | Capacidad: {mesa.capacidad} personas
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {errors.idMesa && <div className='invalid-feedback'>{errors.idMesa}</div>}
                                </div>



                                <div className="d-grid mt-5">
                                    <button
                                        className="btn btn-princi btn-lg"
                                        type="submit"
                                        disabled={isSubmitting || !idMesa || !fechaReservacion || !horaReservacion}>
                                        {isSubmitting
                                            ? (idReserva ? 'Actualizando...' : 'Registrando...')
                                            : (idReserva ? 'Confirmar Actualización' : 'Confirmar Reservación')}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};