import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { listMesas } from '../../services/MesaService';
import { crearReservacion, getReservacion, updateReservacion } from '../../services/ReservarService';

// Importación del nuevo servicio para obtener el cliente
import { getClienteByUserId } from '../../services/ClienteService';

// ----------------------------------------------------------------------
// 🕰️ FUNCIONES AUXILIARES DE FECHA/HORA
// ----------------------------------------------------------------------

// Función auxiliar para obtener la fecha/hora actual del sistema
const getFormattedDateTime = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
 
  const fechaHoy = `${yyyy}-${mm}-${dd}`;
  const horaAhora = `${hh}:${mi}:${String(now.getSeconds()).padStart(2, '0')}`;
  const horaInput = `${hh}:${mi}`; // Formato HH:mm

  return { fechaHoy, horaAhora, horaInput };
};

/**
 * Ajusta (suma o resta) un número de horas a una hora dada (HH:mm).
 * Esta función maneja el desborde (rollover) de las horas, es decir,
 * si sumar 6 horas a 23:00 resulta en 05:00 del día siguiente, devuelve 05:00.
 * La fecha final no es retornada, solo la hora.
 * @param {string} timeStr - Hora en formato 'HH:mm'.
 * @param {number} hoursToAdjust - Horas a sumar (positivo) o restar (negativo).
 * @returns {string} Hora ajustada en formato 'HH:mm:ss'.
 */
const adjustTimeByHours = (timeStr, hoursToAdjust) => {
    const [h, m] = timeStr.split(':').map(Number);
    
    // Usamos un objeto Date temporal para manipular el tiempo de forma robusta
    const tempDate = new Date();
    tempDate.setHours(h, m, 0, 0); // Establecer la hora y minutos (mantiene la fecha de hoy)

    // Sumar el ajuste en milisegundos
    const MS_IN_HOUR = 60 * 60 * 1000;
    const newTimestamp = tempDate.getTime() + (hoursToAdjust * MS_IN_HOUR);
    const newDate = new Date(newTimestamp);

    const newH = String(newDate.getHours()).padStart(2, '0');
    const newM = String(newDate.getMinutes()).padStart(2, '0');
    
    // Retornamos la hora ajustada con segundos
    return `${newH}:${newM}:00`;
};

/**
 * Ajusta una fecha dada (YYYY-MM-DD) sumando un número de días.
 * @param {string} dateStr - Fecha en formato 'YYYY-MM-DD'.
 * @param {number} daysToAdjust - Días a sumar.
 * @returns {string} Fecha ajustada en formato 'YYYY-MM-DD'.
 */
const adjustDateByDays = (dateStr, daysToAdjust) => {
    // Es crucial crear el objeto Date a medianoche UTC (T00:00:00Z) para evitar problemas
    // de zona horaria que podrían hacer que el día se desplace.
    const date = new Date(`${dateStr}T00:00:00Z`);
    date.setDate(date.getDate() + daysToAdjust);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
};


export const ReservarClienteComponent = () => {

  // Navegación y parámetros. Solo necesitamos idReserva para editar.
  const navegar = useNavigate();
  // idcliente ya NO viene en los params, solo idReserva
  const { idReserva } = useParams();

  // Estado para el ID del Cliente (se obtendrá del idUsuario en localStorage)
  const [clienteId, setClienteId] = useState(null);
  const [clienteNombre, setClienteNombre] = useState('Cargando...');

  // Estados y constantes
  const [idMesa, setIdMesa] = useState('');
  const [mesas, setMesas] = useState([]);

  const [fechaReservacion, setFechaReservacion] = useState('');
  const [horaReservacion, setHoraReservacion] = useState('');

  const [fechaSistema, setFechaSistema] = useState('');
  const [horaSistema, setHoraSistema] = useState('');

  // Manejo de errores
  const [errors, setErrors] = useState({
    idMesa: '',
    fechaReservacion: '',
    horaReservacion: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClientLoading, setIsClientLoading] = useState(true); // Nuevo estado de carga


  // Función para obtener y fijar la fecha/hora actual
  const setDateTime = () => {
    const { fechaHoy, horaAhora, horaInput } = getFormattedDateTime();

    setFechaSistema(fechaHoy);
    setHoraSistema(horaAhora);

    // Inicializar los campos con la fecha/hora actual si es una nueva reserva
    if (!idReserva) {
      setFechaReservacion(fechaHoy);
      setHoraReservacion(horaInput);
    }
  }
 
  const actualizaIdMesa = (e) => {
    setIdMesa(e.target.value);
  }
 
  const actualizaFechaReservacion = (e) => {
    setFechaReservacion(e.target.value);
  }

  const actualizaHoraReservacion = (e) => {
    // Guardamos el valor HH:mm del input
    setHoraReservacion(e.target.value);
  }

  // ----------------------------------------------------------------------
  // 🔒 VALIDACIÓN
  // ----------------------------------------------------------------------

  const validaForm = useCallback(() => {
    let valida = true;
    const errorsCopy = { ...errors };

    // Validación de Mesa
    if (idMesa.trim()) {
      errorsCopy.idMesa = '';
    } else {
      errorsCopy.idMesa = 'Debe seleccionar una mesa para la reservación.';
      valida = false;
    }

    // Validación de Cliente ID
    if (clienteId === null) {
      // Este error debería ser cubierto por isClientLoading, pero lo dejamos como fallback
      console.error("Error de validación: ID de cliente no disponible.");
      valida = false;
    }

    // Validación de Fecha
    if (!fechaReservacion.trim()) {
      errorsCopy.fechaReservacion = 'Debe ingresar una fecha de reservación.';
      valida = false;
    } else if (fechaReservacion < fechaSistema) {
      errorsCopy.fechaReservacion = 'La fecha de reservación no puede ser anterior a la fecha actual.';
      valida = false;
    } else {
      errorsCopy.fechaReservacion = '';
    }

    // Validación de Hora
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
  }, [idMesa, clienteId, fechaReservacion, fechaSistema, horaReservacion, horaSistema, errors]);


  // ----------------------------------------------------------------------
  // 🔄 MANEJO DE ENVÍO - RESTA 6 HORAS
  // ----------------------------------------------------------------------

  function manejarReservacion(e) {
    e.preventDefault();

    setIsSubmitting(true);

    // Asegurarse de que el cliente esté cargado y el formulario sea válido
    if (clienteId === null || isClientLoading) {
      alert("Error: ID de cliente no disponible. Intente de nuevo.");
      setIsSubmitting(false);
      return;
    }
   
    if (validaForm()) {
     
      const idMesaInt = parseInt(idMesa);
      const idClienteFinal = parseInt(clienteId);
     
      // 🚩 AJUSTE MANUAL: Restar 6 horas a la hora seleccionada (solo la hora)
            // Ejemplo: 23:30 -> 17:30:00
      const horaFinal = adjustTimeByHours(horaReservacion, -6);
     
      // Crear el objeto Reservación
      const reservarRequest = {
        // La fecha se mantiene la seleccionada por el usuario
        fecha: fechaReservacion, 
        hora: horaFinal, // La hora se envía con 6 horas restadas
        idMesa: idMesaInt,
        // Usamos el idCliente que obtuvimos del idUsuario
        idCliente: idClienteFinal,
        estatus: 0 // Nuevo estado por defecto para una nueva reserva
      };
     
      let promise;
      let successMessage;

      // Decidir si es editar o crear
      if (idReserva) {
        // Editar
        console.log(`Actualizando Reservación ID ${idReserva}:`, reservarRequest);
        promise = updateReservacion(idReserva, reservarRequest);
        successMessage = "Reservación actualizada exitosamente.";
      } else {
        // Crear
        console.log("Creando nueva Reservación:", reservarRequest);
        promise = crearReservacion(reservarRequest);
        successMessage = "Reservación registrada exitosamente.";
      }
     
      promise.then(response => {
        console.log(successMessage, response.data);
       
       
        navegar('/', { state: { toastMessage: successMessage, toastType: 'success' } });

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

  // ----------------------------------------------------------------------
  // 🚀 USE EFFECTS DE INICIALIZACIÓN - SUMA 6 HORAS Y 1 DÍA EN EDICIÓN
  // ----------------------------------------------------------------------

  useEffect(() => {
    // 1. Inicializa la fecha y hora
    setDateTime();

    // 2. Cargar la lista de todas las Mesas
    listMesas().then((response) => {
      const data = response.data;
      setMesas(data);
      if (data.length > 0) {
        // Seleccionar la primera mesa por defecto si es una nueva reserva y aún no hay mesa seleccionada
        if (!idReserva && idMesa === '') {
          setIdMesa(data[0].idMesa.toString());
        }
      }
    }).catch(error => {
      console.error("Error al cargar la lista de Mesas:", error);
    });
   
    // 3. Obtener el ID del cliente logueado
    const idUsuarioLogueado = localStorage.getItem('idUsuario');
    if (idUsuarioLogueado) {
      getClienteByUserId(Number(idUsuarioLogueado)).then(response => {
        const cliente = response.data;
        setClienteId(cliente.idcliente.toString());
        setClienteNombre(cliente.nombrecliente);
      }).catch(error => {
        console.error("Error al obtener el Cliente por idUsuario:", error);
        setClienteNombre('ERROR');
        // Podrías forzar una redirección o mostrar un error fatal aquí
      }).finally(() => {
        setIsClientLoading(false);
      });
    } else {
      console.error("ID de Usuario no encontrado en localStorage.");
      setClienteNombre('NO LOGUEADO');
      setIsClientLoading(false);
      // Si no hay idUsuario, el usuario no debería estar en esta página de cliente
    }


    // 4. Cargar la reservación si estamos editando
    if (idReserva) {
      getReservacion(idReserva).then((response) => {
        const reserva = response.data;
       
                // Extraer hora HH:mm del backend (HH:mm:ss)
        const horaBackendHHMM = reserva.hora ? reserva.hora.substring(0, 5) : '';

                // 🚩 AJUSTE MANUAL: Sumar 6 horas a la hora del backend
                // Ejemplo: 17:30 -> 23:30:00. Usamos substring(0, 5) para obtener HH:mm
                const horaLocalAjustada = adjustTimeByHours(horaBackendHHMM, 6).substring(0, 5);

                // 🚩 AJUSTE MANUAL: Sumar 1 día a la fecha del backend
                const fechaLocalAjustada = adjustDateByDays(reserva.fecha, 2);
        
        // Precarga de los datos con los valores ajustados
        setIdMesa(reserva.idMesa.toString());
        setFechaReservacion(fechaLocalAjustada); // Fecha + 1 día
        console.log(fechaLocalAjustada);
        setHoraReservacion(horaLocalAjustada); // Hora + 6 horas

        // Si la reserva tiene un idCliente asociado, lo precargamos si no viene del localStorage
        if (reserva.idCliente) {
          setClienteId(reserva.idCliente.toString());
          // Nota: En un caso real, validarías que este idCliente coincida con el del usuario logueado.
        }

      }).catch(error => {
        console.error(`Error al cargar la reservación ID ${idReserva}:`, error);
      });
    }

  }, [idReserva]);// Dependencia idMesa para el valor por defecto

  // ----------------------------------------------------------------------
  //RENDERIZADO
  // ----------------------------------------------------------------------

  function pagTitulo() {
    if (idReserva) {
      return <h4 className="text-center mb-0 titcard">Editando Mi Reservación</h4>;
    }
    return <h4 className="text-center mb-0 titcard">Haciendo reservación...</h4>;
  }

  // El formulario se deshabilita si los datos esenciales están cargando
  const isDisabled = isSubmitting || isClientLoading || !clienteId || !idMesa || !fechaReservacion || !horaReservacion;

  return (
    <div className="container mt-2 mb-3">
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="card shadow rounded-3">
           
            {pagTitulo()}
            <hr />

            <div className="card-body">
              <form className="text-start" onSubmit={manejarReservacion}>
               
                {/* Mostrar ID del Cliente Logueado */}
                <div className="row mb-4 border-bottom pb-3">
                  <div className="col-md-6 mx-auto">
                    <div className="w-100 mx-auto">
                      <label className="form-label fw-bold text-start">Cliente:</label>
                      <input
                        type="text"
                        className={`form-control text-center ${isClientLoading ? 'bg-warning-subtle' : 'bg-light'}`}
                        value={isClientLoading ? 'Cargando ID Cliente...' : `${clienteNombre}`}
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
                        value={horaReservacion} // Contiene solo HH:mm
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
                      <>
                        {/* Opción vacía si no hay idReserva y no se ha seleccionado nada aún */}
                        {!idReserva && <option value="" disabled>Seleccione una mesa</option>}
                        {mesas.map(mesa => (
                          <option key={mesa.idMesa} value={mesa.idMesa.toString()}>
                            No. de mesa: {mesa.numero} | Capacidad: {mesa.capacidad} personas
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {errors.idMesa && <div className='invalid-feedback'>{errors.idMesa}</div>}
                </div>
               

                <div className="d-grid mt-5">
                  <button
                    className="btn btn-princi btn-lg"
                    type="submit"
                    disabled={isDisabled}>
                    {isClientLoading ? 'Cargando datos...'
                      : isSubmitting
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