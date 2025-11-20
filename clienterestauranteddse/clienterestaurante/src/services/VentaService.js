import axios from "axios";

const REST_API_BASE_URL = '/api/ventas'


//La lista de todas las ventas
export const listVentas = () => axios.get(REST_API_BASE_URL + '/listat');

//Crear una venta
export const crearVenta = (ventaRequest) => axios.post(REST_API_BASE_URL + '/guardar', ventaRequest);

//Obtener una venta específica
export const getVenta = (ventaId) => axios.get(REST_API_BASE_URL + '/buscaid' + '/' + ventaId);

//Eliminación (normal)
export const deleteVenta = (ventaId) => axios.delete(REST_API_BASE_URL + '/eliminar' + '/' + ventaId);

//Para el ticket PDF
export const descargarTicketPDF = (ventaId) => axios.get(REST_API_BASE_URL + '/ticket/' + ventaId, { responseType: 'blob' });


//Obtener detalle completo de la venta
export const getDetalleCompletoVenta = (ventaId) => axios.get(REST_API_BASE_URL + '/detallecompleto/' + ventaId);


export const buscarVentasPorFecha = (fecha) => {

    if (!fecha) {
        return axios.get(REST_API_BASE_URL+ '/listaf'); 
    }
    
    //El endpoint es /api/ventas. Axios agrega automáticamente el parámetro de consulta.
    return axios.get(REST_API_BASE_URL + '/listaf', { params: { fecha: fecha } });
};



export const getVentasAtendidas = (idEmpleado, fecha) => {
    //Definimos los parámetros de consulta
    const params = {};
    if (fecha) {
        params.fecha = fecha;
    }

    //La URL es /api/ventas/atendidas/{idEmpleado}?fecha=yyyy-mm-dd
    return axios.get(REST_API_BASE_URL + '/atendidas/' + idEmpleado, { params });
};


export const getVentasByClienteIdAndFecha = (idCliente, fecha) => {
    const fechaParam = fecha ? `?fecha=${fecha}` : '';
    return axios.get(REST_API_BASE_URL + '/cliente/' + idCliente + fechaParam);
};

export const updateVentaSimple = (ventaId, ventaUpdateDto) => {
    return axios.put(REST_API_BASE_URL + '/actualizar/' + ventaId, ventaUpdateDto);
};

export const updateVentaCompleta = (idVenta, ventaRequest) => {
    return axios.put(REST_API_BASE_URL + `/actualizar/completa/${idVenta}`, ventaRequest);
};
