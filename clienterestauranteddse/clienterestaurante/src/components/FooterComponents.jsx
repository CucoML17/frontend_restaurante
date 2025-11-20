import React from 'react'

export const FooterComponents = () => {
    
    const customBgStyle = {
        backgroundColor: '#5C0000',
    };

    return (
        <footer className="p-3 text-light text-center mt-auto" style={customBgStyle}>
            <p className="mb-0">
                Mejía López Carlos Abel<br />
                Número de control: 21520390 <br />
                Carrera: Ingeniería en Sistemas Computacionales
            </p>
        </footer>
    )
}