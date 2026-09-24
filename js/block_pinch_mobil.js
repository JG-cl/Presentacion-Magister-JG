document.addEventListener("touchmove", function (event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });