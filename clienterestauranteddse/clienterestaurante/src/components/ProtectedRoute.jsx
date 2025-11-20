import React from 'react'
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorPermisosComponent } from './ErrorPermisosComponent';



//Componente de ruta protegida, este rendirazá todo su contenido si el usurio tiene acceso y
//un rol específico
export const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, hasRole } = useAuth();
    
    //1. Manejar si el usuario no está autenticado
    if (!isAuthenticated) {
        //Redirigir a la página de login si no hay sesión
        //El 'replace: true' es para evitar que la página protegida quede en el historial
        return <Navigate to="/login" replace={true} />;
    }

    //2. Manejar la Autorización (Roles)
    if (allowedRoles) {
        //Separar los roles permitidos en un array
        const requiredRoles = allowedRoles.split(',').map(role => role.trim());
        
        //Verificar si el usuario tiene los roles requeridos
        const userHasRequiredRole = requiredRoles.some(role => hasRole(role));

        if (!userHasRequiredRole) {
            //Si está autenticado pero no tiene el rol:
            //Mostramos la página de error de permisos
            return <ErrorPermisosComponent />;
        }
    }

    //3. Si el usuario está autenticado Y tiene el rol correcto (o no se requiere rol):
    //Renderizamos el componente solicitado
    return children;
};
