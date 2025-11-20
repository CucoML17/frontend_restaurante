import React, { useEffect, useRef } from 'react'; //Añadimos useEffect y useRef
import { useLocation, useNavigate } from 'react-router-dom'; //Añadimos useLocation y useNavigate
import ToastNotification from '../toast/ToastComponent'; //Asegúrate que la ruta sea correcta


export const IndiceComponent = () => {

    //Hooks necesarios
    const location = useLocation();
    const navigate = useNavigate();
    const toastRef = useRef(null);

    //Lógica para mostrar el Toast en la carga inicial
    useEffect(() => {
        //1. Checar si hay un mensaje de toast en el estado de navegación
        if (location.state && location.state.toastMessage && toastRef.current) {

            const { toastMessage, toastType } = location.state;

            //2. Mostrar el toast
            toastRef.current.show(toastMessage, toastType || 'success', 3000);

            //3.Limpiar el estado de navegación inmediatamente
            //Esto previene que el toast se muestre de nuevo si el usuario recarga o navega a la misma ruta
            navigate(location.pathname, { 
                replace: true, 
                state: {} //Se pasa un objeto vacío para limpiar el estado
            });
        }
    
    }, [location.state, navigate, location.pathname]);

    

    //para las tarjetas de información
    const FeatureCard = ({ title, text }) => (
        
        <div className="col-md-4 mb-4">
            <div className="card shadow-lg p-3 h-100 transition duration-300 hover-shadow-xl">
                <div className="text-center mb-3">
                    {/*  Sustitución del ícono: un círculo naranja usando Bootstrap y estilos inline */}
                    <div
                        className="mx-auto rounded-circle d-flex align-items-center justify-content-center"
                        style={{ 
                            width: '4rem', height: '4rem', backgroundColor: '#f97316', color: 'white', fontSize: '1.5rem' }}
                    >
                        {/* Placeholder visual o si usas Bootstrap Icons, lo pones aquí */}
                        
                    </div>
                </div>
                <h3 className="h5 font-weight-bold text-dark mb-2">{title}</h3>
                <p className="text-muted">{text}</p>

            </div>
        </div>
    );



    return (
        <div className="d-flex flex-column min-vh-100">
            <ToastNotification ref={toastRef} />
            {/* -------------------- CABECERA TIPO 'HERO' CON IMAGEN SIMULADA -------------------- */}
            <div
                className="position-relative w-100 d-flex align-items-center justify-content-center text-center p-5 bg-cover bg-center"
                style={{
                    // Simulación del fondo (ver punto 2 para la gestión de la URL)
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("/images/fondorestaurante.jpg")',
                    height: '400px',
                    backgroundSize: 'cover',        
                    backgroundRepeat: 'no-repeat'                    
                }}
            >
                <div className="text-white z-10">
                    <h1 className="display-3 font-weight-bolder mb-2 text-shadow-lg textologo">
                        Restaurante Cuco Corporation
                    </h1>
                    <p className="lead font-weight-light font-italic text-shadow-lg mt-2 font-15">
                        Enfrenta el hambre, construye la experiencia
                    </p>
                </div>
            </div>

            {/* -------------------- SECCIÓN SOBRE NOSOTROS -------------------- */}
            <div className="container px-4 py-2">
                <div className="card-sobre-nosotros card border-start shadow-md rounded-lg p-1 w-100">
                    <h2 className="h3 font-weight-bold text-dark mb-2 mt-2">Sobre nosotros</h2>
                    <p className="text-secondary-emphasis leading-relaxed">
                        En Cuco Corporation, nuestra misión es transformar cada comida en una experiencia memorable.
                        Desde nuestro inicio, nos hemos dedicado a ofrecer platillos de la más alta calidad,
                        preparados con ingredientes frescos y servidos con una calidez inigualable. Más que un restaurante,
                        somos un destino donde la pasión por el buen comer y el servicio excepcional se encuentran.
                        Nuestra visión es simple: ser líderes en hospitalidad y sabor.
                    </p>
                </div>
            </div>

            {/* -------------------- SECCIÓN DE CARACTERÍSTICAS (3 CARDS ALARGADAS) -------------------- */}
            <div className="bg-light py-2">
                <div className="container px-4">
                    <h3 className="h3 font-weight-bold text-center text-dark mb-3">Más información</h3>
                    <div className="row">

                       
                        <FeatureCard
                            title="Calidad"
                            text="Seleccionamos solo los mejores ingredientes del mercado, garantizando frescura y un sabor inigualable en cada plato que servimos."
                        />

                        
                        <FeatureCard
                            title="Servicio excepcional"
                            text="Nuestro equipo está entrenado para anticipar sus necesidades, asegurando una experiencia fluida, rápida y siempre atenta."
                        />

                        
                        <FeatureCard
                            title="Variedad gastronómica"
                            text="Desde platillos tradicionales hasta creaciones innovadoras, nuestro menú ofrece una amplia gama de opciones para satisfacer cualquier paladar."
                        />

                    </div>
                </div>
            </div>

            <div className="py-5 bg-white">
                <div className="container px-4">
                    <h3 className="h4 font-semibold text-center text-muted">¡Visítanos pronto!</h3>
                </div>
            </div>

        </div>
    );
}
