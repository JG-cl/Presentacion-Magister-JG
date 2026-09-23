(function () {

    function corregirPaginasPDF() {

        if (!document.documentElement.classList.contains("reveal-print")) {
            return;
        }

        const paginas = [...document.querySelectorAll(".pdf-page")];

        if (!paginas.length) {
            return;
        }

        // Altura normal de una página generada por Reveal.
        const alturas = paginas
            .map(p => parseFloat(p.style.height))
            .filter(h => Number.isFinite(h) && h > 0);

        if (!alturas.length) {
            return;
        }

        const alturaPagina = Math.min(...alturas);

        paginas.forEach(page => {

            const slide = page.querySelector(":scope > section");

            if (!slide) {
                return;
            }

            const alturaActual = parseFloat(page.style.height);

            // Corrige solamente falsos saltos a varias páginas.
            // Una slide que realmente desborda (p. ej. Referencias)
            // conserva su altura original.
            if (
                slide.scrollHeight <= slide.clientHeight + 2 &&
                alturaActual > alturaPagina + 2
            ) {
                page.style.height = `${alturaPagina}px`;
            }
        });
    }


    function iniciarCorreccion() {

        corregirPaginasPDF();

        // Reveal y MathJax pueden modificar el layout después.
        setTimeout(corregirPaginasPDF, 250);
        setTimeout(corregirPaginasPDF, 500);
        setTimeout(corregirPaginasPDF, 1000);
        setTimeout(corregirPaginasPDF, 2000);
        setTimeout(corregirPaginasPDF, 4000);
    }


    // Si el DOM todavía está cargando
    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarCorreccion
        );

    } else {

        iniciarCorreccion();

    }


    // Esperar también a Reveal
    window.addEventListener(
        "load",
        iniciarCorreccion
    );

})();