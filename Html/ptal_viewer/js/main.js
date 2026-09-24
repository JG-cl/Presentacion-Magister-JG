
async function init(){

    // =========================
    // cargar panel
    // =========================
    const response =
        await fetch("./top_panel.html");

    const html =
        await response.text();

    document.body.insertAdjacentHTML(
        "beforeend",
        html
    );

    if (typeof window.refreshAreaSelector === "function") {
        window.refreshAreaSelector();
    }

    const areasToggle =
    document.getElementById("AreasToggle");

    areasToggle.addEventListener(
        "change",
        () => {

            window.setAreasVisible(
                areasToggle.checked
            );

        }
    );

    // =========================
    // recién ahora cargar lógica
    // =========================
    await import("./load_data.js");
}

init();
