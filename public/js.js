const cloud = document.getElementById("cloud");
const barraLateral = document.querySelector(".barra-lateral");
const spans = document.querySelectorAll("span");
const palanca = document.querySelector(".switch");
const circulo = document.querySelector(".circulo");
const menu = document.querySelector(".menu");
const main = document.querySelector("main");

menu.addEventListener("click", () => {
    barraLateral.classList.toggle("max-barra-lateral");
    if (barraLateral.classList.contains("max-barra-lateral")) {
        menu.children[0].style.display = "none";
        menu.children[1].style.display = "block";
    }
    else {
        menu.children[0].style.display = "block";
        menu.children[1].style.display = "none";
    }
    if (window.innerWidth <= 320) {
        barraLateral.classList.add("mini-barra-lateral");
        main.classList.add("min-main");
        spans.forEach((span) => {
            span.classList.add("oculto");
        })
    }
});

palanca.addEventListener("click", () => {
    let body = document.body;
    body.classList.toggle("dark-mode");

    circulo.classList.toggle("prendido");
});

cloud.addEventListener("click", () => {
    barraLateral.classList.toggle("mini-barra-lateral");
    main.classList.toggle("min-main");
    spans.forEach((span) => {
        span.classList.toggle("oculto");
    });
});
const links = document.querySelectorAll('.barra-lateral .navegacion a');
const sections = document.querySelectorAll('main section');

links.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('data-section');

        sections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.remove('oculto');
            } else {
                section.classList.add('oculto');
            }
        });
    });
});
// Función para gestionar la visibilidad de las secciones
document.addEventListener('DOMContentLoaded', () => {
    loadClientOptions()
    console.log('DOM completamente cargado y parseado.');

    // Selecciona todos los enlaces en la barra lateral
    const links = document.querySelectorAll('.barra-lateral a');
    console.log('Enlaces seleccionados:', links);

    links.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('Enlace clickeado:', link);

            // Obtiene el id de la sección desde el atributo href del enlace
            const sectionId = link.getAttribute('href').substring(1);
            console.log('ID de la sección:', sectionId);

            // Oculta todas las secciones
            document.querySelectorAll('section').forEach(section => {
                section.style.display = 'none';
            });
            console.log('Todas las secciones han sido ocultas.');

            // Muestra la sección correspondiente
            const sectionToShow = document.getElementById(sectionId);
            if (sectionToShow) {
                sectionToShow.style.display = 'block';
                console.log('Sección mostrada:', sectionToShow);
            } else {
                console.log('No se encontró la sección con ID:', sectionId);
            }

            // Opcional: Añade una clase activa al enlace seleccionado
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            console.log('Clase activa añadida al enlace:', link);
        });
    });
});

var animateButton = function (e) {

    e.preventDefault;
    e.target.classList.remove('animate');

    e.target.classList.add('animate');
    setTimeout(function () {
        e.target.classList.remove('animate');
    }, 700);
};

var bubblyButtons = document.getElementsByClassName("bubble-button");

for (var i = 0; i < bubblyButtons.length; i++) {
    bubblyButtons[i].addEventListener('click', animateButton, false);
}
function getCurrentDateFormatted() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}


// Uso de la función
document.getElementById('finanzafinStartDate').value = getCurrentDateFormatted();
document.getElementById('finanzafinEndDate').value = getCurrentDateFormatted();
// Se puede reutilizar esta función en otras secciones también
