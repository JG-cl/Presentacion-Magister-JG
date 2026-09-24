document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // CARGAR IFRAMES
    // =====================================================
    function cargarIframes(slide) {
        if (!slide) return;

        slide.querySelectorAll("iframe.lazy-iframe").forEach(iframe => {

            if (!iframe.getAttribute("src") && iframe.dataset.src) {
                iframe.setAttribute("src", iframe.dataset.src);
            }

        });
    }


    // =====================================================
    // REFRESCAR LEAFLET
    // =====================================================
    function refrescarMapas(slide) {
        if (!slide) return;

        slide.querySelectorAll("iframe.lazy-iframe").forEach(iframe => {

            try {

                const win = iframe.contentWindow;

                if (
                    win &&
                    win.map &&
                    typeof win.map.invalidateSize === "function"
                ) {

                    // Esperamos a que Reveal termine de posicionar
                    // y dimensionar la slide.
                    setTimeout(() => {

                        win.map.invalidateSize({
                            animate: false,
                            pan: false
                        });

                    }, 300);

                }

            } catch (error) {

                console.warn(
                    "No se pudo refrescar el mapa Leaflet:",
                    error
                );

            }

        });
    }


    // =====================================================
    // REVEAL LISTO
    // =====================================================
    Reveal.on("ready", event => {

        cargarIframes(event.currentSlide);

        setTimeout(() => {
            refrescarMapas(event.currentSlide);
        }, 500);

    });


    // =====================================================
    // CAMBIO DE SLIDE
    // =====================================================
    Reveal.on("slidechanged", event => {

        cargarIframes(event.currentSlide);

        // Damos tiempo a Reveal para terminar sus transforms
        // antes de pedirle a Leaflet que redibuje.
        setTimeout(() => {

            refrescarMapas(event.currentSlide);

        }, 350);

    });


    // =====================================================
    // BLOQUEAR PINCH-ZOOM DE LA PRESENTACIÓN
    // =====================================================
    document.addEventListener(
        "touchmove",
        event => {

            if (event.touches.length > 1) {
                event.preventDefault();
            }

        },
        { passive: false }
    );

});