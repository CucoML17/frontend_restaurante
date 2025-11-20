import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const NavbarUsuarioComponent = () => {
    
    // Acceder al estado global de autenticación
    const { isAuthenticated, username, perfiles, logout } = useAuth();
    const navigate = useNavigate();

    // Estilo para los enlaces de sesión:
    const linkClass = "nav-link text-white text-decoration-underline py-0 px-2";
    
    // Estilo para el texto de usuario/rol:
    const userPlaceholderClass = "text-white small fw-bold"; 

    // Obtener el rol principal para mostrar (el primer elemento del array)
    const primaryRole = perfiles && perfiles.length > 0 ? perfiles[0] : 'Sin Rol';

    // Función de utilidad para determinar si el rol principal es de Empleado
    const isEmployeeRole = (role) => {
        // Normalizamos a minúsculas para una comparación flexible
        const employeeRoles = ['administrador', 'cajero', 'mesero', 'supervisor'];
        return employeeRoles.includes(role.toLowerCase());
    }

    // Determinar la ruta a usar para "Mi Perfil"
    const miPerfilRoute = isEmployeeRole(primaryRole) 
        ? "/miperfil/empleado" 
        : "/miperfil/cliente";

    // Función para manejar el cierre de sesión
    const handleLogout = (e) => {
        e.preventDefault();
        logout(); // Llama a la función logout del contexto
        
        // Opcional: Redirigir y mostrar una notificación
        navigate('/', {
            state: { 
                toastMessage: 'Sesión cerrada con éxito.', 
                toastType: 'info' 
            }
        });
    };

    return (
        <nav className="navbar navbar-expand navbar-dark bg-dark sticky-top" style={{ height: '35px', lineHeight: '10px' }}>
            <div className="container-fluid d-flex justify-content-between align-items-center h-100">
                
                {/* Lado IZQUIERDO: Placeholder de Nombre y Rol */}
                <div className="d-flex align-items-center">
                    {isAuthenticated ? (
                        // SI ESTÁ AUTENTICADO: Mostrar Nombre y Rol
                        <span className={userPlaceholderClass}>
                            <i className="fas fa-user-circle me-1"></i> {username} - {primaryRole}
                        </span>
                    ) : (
                        // SI NO ESTÁ AUTENTICADO: Mostrar mensaje por defecto o nada
                        <span className={userPlaceholderClass}>
                            Bienvenido
                        </span>
                    )}
                </div>

                {/* Enlaces de Sesión Condicionales */}
                <ul className="navbar-nav d-flex flex-row align-items-center">
                    
                    {isAuthenticated ? (
                        <>
                            {/* 💡 NUEVO ENLACE: MI PERFIL */}
                            <li className="nav-item">
                                <NavLink to={miPerfilRoute} className={linkClass} aria-label="Ir a Mi Perfil">
                                    <i className="fas fa-id-card me-1"></i> Mi Perfil
                                </NavLink>
                            </li>

                            {/* Enlace de SALIR */}
                            <li className="nav-item">
                                <a 
                                    href="#" 
                                    className={linkClass} 
                                    onClick={handleLogout} 
                                    aria-label="Cerrar sesión"
                                >
                                    <i className="fas fa-sign-out-alt me-1"></i> Salir
                                </a>
                            </li>
                        </>
                    ) : (
                        <>
                            {/* SI NO ESTÁ AUTENTICADO: Mostrar Iniciar Sesión y Registrarme */}
                            <li className="nav-item">
                                <NavLink to="/login" className={linkClass} aria-label="Ir a Iniciar sesión">
                                    <i className="fas fa-sign-in-alt me-1"></i> Iniciar sesión
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink to="/registro" className={linkClass} aria-label="Ir a Registrarse">
                                    Registrarme
                                </NavLink>
                            </li>
                        </>
                    )}

                </ul>

            </div>
        </nav>
    );
};