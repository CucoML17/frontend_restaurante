import React, { useState, forwardRef, useImperativeHandle } from 'react';

const ToastNotification = forwardRef((props, ref) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState('success'); // success, warning, danger
    


    useImperativeHandle(ref, () => ({
        show: (msg, type = 'success', delay = 3000) => {
            setMessage(msg);
            setType(type);
            
            setVisible(true);

            //Temporizador para auto-ocultar
            if (delay > 0) {
                const timer = setTimeout(() => {
                    setVisible(false);
                }, delay);
                return () => clearTimeout(timer);
            }
        },
        hide: () => {
            setVisible(false);
        }
    }));

  
    const getToastClasses = () => {
        switch (type) {
            case 'warning':
                
                return 'bg-warning text-dark fw-bold'; 
            case 'danger':
                
                return 'bg-danger text-white fw-bold';
            case 'success':
            default:
                
                return 'bg-success text-white fw-bold';
        }
    };
    
    if (!visible) {
        return null;
    }


    const toastStyle = {
        position: 'fixed',
        top: '70px',
        right: '20px',
        zIndex: 1050,
        minWidth: '350px',
        padding: '10px',
        borderRadius: '5px',
        whiteSpace: 'pre-line'
    };


    return (
        
        <div 
            className={`toast show ${getToastClasses()}`} 
            role="alert" 
            aria-live="assertive" 
            aria-atomic="true"
            style={toastStyle}
        >
            
            <div className="d-flex align-items-center justify-content-between">
                
                
                <div className="p-2">
                    {message}
                </div>

                
                <button 
                    type="button" 
                    className={`btn-close m-2 ${type === 'warning' ? 'btn-close-dark' : 'btn-close-white'}`} 
                    //btn-close-dark es necesario para el fondo amarillo (warning)
                    data-bs-dismiss="toast" 
                    aria-label="Close" 
                    onClick={() => setVisible(false)}
                ></button>
            </div>
        </div>
    );
});

export default ToastNotification;