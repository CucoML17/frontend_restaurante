import React, { useState, forwardRef, useImperativeHandle } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';


const ConfirmDialog = forwardRef((props, ref) => {
    
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState('');
    // Almacena la función de callback que se ejecuta al presionar Aceptar
    const [onConfirmCallback, setOnConfirmCallback] = useState(null);

    // 🔄 Expone la función `show` a través del ref (el sustituto de window.confirm)
    useImperativeHandle(ref, () => ({
        /**
         * Muestra el diálogo de confirmación.
         * @param {string} msg El mensaje a mostrar al usuario.
         * @param {function} callback La función a ejecutar si el usuario presiona "Aceptar".
         */
        show: (msg, callback) => {
            setMessage(msg);
            setOnConfirmCallback(() => callback); // Usamos un setter para almacenar la función
            setShow(true);
        }
    }));

    // Manejador para el botón "Aceptar"
    const handleConfirm = () => {
        if (onConfirmCallback) {
            onConfirmCallback(); // Ejecuta la función de la lógica de negocio (finalizar venta, etc.)
        }
        setShow(false);
    };

    // Manejador para el botón "Cancelar"
    const handleCancel = () => {
        setShow(false);
        // NO se llama al callback, que es el comportamiento esperado de `window.confirm` cuando es falso/cancelado.
    };

    // Si `show` es false, no renderizamos nada
    if (!show) return null;

    return (
        // Modal de Bootstrap
        <div 
            className="modal show d-block" 
            tabIndex="-1" 
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-warning text-dark">
                        <h5 className="modal-title">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            Confirmación
                        </h5>
                        <button type="button" className="btn-close" onClick={handleCancel}></button>
                    </div>

                    <div className="modal-body">
                        <p className="lead">{message}</p>
                    </div>

                    <div className="modal-footer">
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={handleCancel}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-primary" 
                            onClick={handleConfirm}
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ConfirmDialog;