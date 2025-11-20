import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import { getEmpleadosByPuestoId } from '../services/EmpleadoService'; 
import { listMesas } from '../services/MesaService'; 
import { crearAtender } from '../services/AtenderService';
import { crearReservacion } from '../services/ReservarService';

export const AtenderReservarComponent = () => {

    const navegar = useNavigate();
    //useParams para obtener idcliente y el idventa
    const { idcliente, idventa } = useParams();
    const location = useLocation();

    //-------------------Estados y constantes------------------
    //IDs a registrar
    const [idEmpleado, setIdEmpleado] = useState('');
    const [idMesa, setIdMesa] = useState('');

    //Las listas
    const [empleados, setEmpleados] = useState([]); 
    const [mesas, setMesas] = useState([]);        

    //Manejo de la Fecha/Hora (Para la Reservación)
    const [fechaActual, setFechaActual] = useState('');
    const [horaActual, setHoraActual] = useState('');

    //Manejo de errores
    const [errors, setErrors] = useState({
        idEmpleado: '',
        idMesa: ''
    });

    //Manejare doble clicl
    const [isSubmitting, setIsSubmitting] = useState(false); 

    // -------------------Actualizaciones-------------------
    const setDateTime = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0'); // Mes empieza en 0
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const mi = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');

        setFechaActual(`${yyyy}-${mm}-${dd}`);
        setHoraActual(`${hh}:${mi}:${ss}`);
    }

    const actualizaIdEmpleado = (e) => {
        setIdEmpleado(e.target.value);
    }

    const actualizaIdMesa = (e) => {
        setIdMesa(e.target.value);
    }
    
    // -------------------Validación y lógica principal del flujo-------------------

    //Función para validar
    function validaForm() {
        let valida = true;
        const errorsCopy = { ...errors };

        if (idEmpleado.trim()) {
            errorsCopy.idEmpleado = '';
        } else {
            errorsCopy.idEmpleado = 'Debe seleccionar un empleado para atender la venta.';
            valida = false;
        }

        if (idMesa.trim()) {
            errorsCopy.idMesa = '';
        } else {
            errorsCopy.idMesa = 'Debe seleccionar una mesa para la reservación.';
            valida = false;
        }

        setErrors(errorsCopy);
        return valida;
    }

    //Función para el registro
    function realizarRegistro(e) {
        e.preventDefault();

        setIsSubmitting(true);


        if (validaForm()) {

            const idEmpleadoInt = parseInt(idEmpleado);
            const idMesaInt = parseInt(idMesa);
            const idClienteInt = parseInt(idcliente); 
            const idVentaInt = parseInt(idventa);     
            
            //1. Crear el objeto Atender (Empleado-Venta)
            const atenderRequest = {
                idEmpleado: idEmpleadoInt,
                idVenta: idVentaInt
            };

            //2. Crear el objeto Reservación (Mesa-Cliente-Venta)
            const reservarRequest = {
                fecha: fechaActual, 
                hora: horaActual,   
                idMesa: idMesaInt,
                idCliente: idClienteInt,
                idVenta: idVentaInt 
            };

            
            //3. El insert
            crearAtender(atenderRequest)
                .then(responseAtender => {
                    console.log("Registro Atender exitoso:", responseAtender.data);
                    
                    //Después de atender, ahora sí, reservar
                    return crearReservacion(reservarRequest);
                })
                .then(responseReservacion => {
                
                    console.log("Registro Reservación exitoso:", responseReservacion.data);
                    alert(`Venta #${idVentaInt} atendida por Empleado #${idEmpleadoInt} y Mesa #${idMesaInt} reservada con éxito.`);
                    
                    
                    navegar('/venta/lista'); 
                })
                .catch(error => {
                    
                    console.error("Error en la secuencia de registro (Atender/Reservar):", error.response ? error.response.data : error.message);
                    alert("Ocurrió un error al intentar registrar la atención y/o la reservación. Verifique la consola.");
                });
        }
    }


    //El use effect

    useEffect(() => {
        //Inicializar la fecha y hora
        setDateTime();

        //1. Cargar la lista de Empleados con Puesto ID = 1 (Meseros)
        getEmpleadosByPuestoId(1).then((response) => {
            const data = response.data;
            setEmpleados(data);
            if (data.length > 0) {
                setIdEmpleado(data[0].idEmpleado.toString()); 
            }
        }).catch(error => {
            console.error("Error al cargar la lista de Empleados (Puesto 1):", error);
        });

        //2. Cargar la lista de todas las Mesas
        listMesas().then((response) => {
            const data = response.data;
            setMesas(data);
            if (data.length > 0) {
               
                setIdMesa(data[0].idMesa.toString()); 
            }
        }).catch(error => {
            console.error("Error al cargar la lista de Mesas:", error);
        });

    }, []); 

    // ------------------- RENDERIZADO DEL COMPONENTE -------------------

    function pagTitulo() {
        return <h4 className="text-center mb-0 titcard">Atender y Reservar Venta</h4>;
        
    }

    return (
        <div className="container mt-2 mb-3">
            <div className="row">
                <div className="col-md-8 offset-md-2">
                    <div className="card shadow rounded-3">
                        
                        {pagTitulo()}
                        <hr />

                        <div className="labelpad">
                        <div className="row mb-1">
                           
                            <div className="col-md-6 mb-3">
                               
                                <div className="w-75 mx-auto">
                                    <label className="form-label fw-bold text-start">ID Cliente:</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={idcliente} 
                                        disabled 
                                    />
                                </div>
                            </div>
                            
                           
                            <div className="col-md-6 mb-3">
                               
                                <div className="w-75 mx-auto">
                                    <label className="form-label fw-bold text-start">ID Venta:</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={idventa} 
                                        disabled 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="row mb-2 border-bottom pb-3">
                          
                            <div className="col-md-6 mb-3 mb-md-0">
                               
                                <div className="w-75 mx-auto">
                                    <label className="form-label fw-bold text-start">Fecha:</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={fechaActual} 
                                        disabled 
                                    />
                                </div>
                            </div>
                            
                           
                            <div className="col-md-6">
                               
                                <div className="w-75 mx-auto">
                                    <label className="form-label fw-bold text-start">Hora:</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={horaActual} 
                                        disabled 
                                    />
                                </div>
                            </div>
                        </div>                   
                        </div>

                        <div className="card-body">
                            <form className="text-start"> 
                                
                             
                                <div className="form-group mb-3">
                                    <label className="form-label fw-bold">1. Elija el Empleado que atenderá (Mesero):</label>
                                    <select
                                        name="idEmpleado"
                                        value={idEmpleado}
                                        className={`form-select ${errors.idEmpleado ? 'is-invalid' : ''}`}
                                        onChange={actualizaIdEmpleado}>
                                        {empleados.length === 0 && <option value="">Cargando empleados...</option>}
                                        {empleados.map(empleado => (
                                            <option key={empleado.idEmpleado} value={empleado.idEmpleado.toString()}>
                                                {empleado.nombre} {empleado.apellido}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.idEmpleado && <div className='invalid-feedback'>{errors.idEmpleado}</div>}
                                </div>
                                
                                <hr className="my-4"/>

                                
                                <div className="form-group mb-4">
                                    <label className="form-label fw-bold">2. Elija la Mesa a ocupar:</label>
                                    <select
                                        name="idMesa"
                                        value={idMesa}
                                        className={`form-select ${errors.idMesa ? 'is-invalid' : ''}`} onChange={actualizaIdMesa}>
                                        {mesas.length === 0 && <option value="">Cargando mesas...</option>}
                                        {mesas.map(mesa => (
                                            <option key={mesa.idMesa} value={mesa.idMesa.toString()}>
                                                No. de mesa: {mesa.idMesa} con capacidad: {mesa.capacidad}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.idMesa && <div className='invalid-feedback'>{errors.idMesa}</div>}
                                </div>


                                
                                <div className="d-grid">
                                    <button className="btn btn-success btn-lg" onClick={realizarRegistro} 
                                    disabled={!idEmpleado || !idMesa || isSubmitting}>
                                        Confirmar Atención y Reservar Mesa
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