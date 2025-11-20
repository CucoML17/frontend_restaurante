import React from 'react'
import { NavLink } from 'react-router-dom';

export const ErrorPermisosComponent = () => {
    return (
        <div className="container mt-5 mb-4 pt-5 text-center">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <i className="fas fa-user-times fa-4x mb-3" style={{ color: '#5C0000' }}></i>
                    <h1 className="display-4 fw-bold mb-3" style={{ color: '#5C0000' }}>
                        Acceso Denegado
                    </h1>
                    <p className="lead">
                        Lo sentimos, no tiene los permisos necesarios para acceder a esta sección.
                        <br/>
                        Si crees que esto es un error, contacta al administrador del sistema.
                    </p>
                    <hr/>
                    <NavLink to="/" className="btn btn-primary mt-3" style={{ backgroundColor: '#5C0000', borderColor: '#5C0000' }}>
                        Volver a la página principal
                    </NavLink>
                </div>
            </div>
        </div>
    );
};