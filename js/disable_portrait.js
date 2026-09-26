(function () {

    function disableRevealScroll() {

        if (
            typeof Reveal === "undefined" ||
            typeof Reveal.configure !== "function"
        ) {
            setTimeout(disableRevealScroll, 100);
            return;
        }

        // Deshabilita la activación automática
        Reveal.configure({
            scrollActivationWidth: 0
        });

        // Si ya estaba activo, salir
        if (Reveal.isScrollView()) {
            Reveal.toggleScrollView(false);
        }

        Reveal.layout();

        console.log(
            "[Reveal] Scroll View:",
            Reveal.isScrollView(),
            "| activation:",
            Reveal.getConfig().scrollActivationWidth
        );
    }

    disableRevealScroll();

})();