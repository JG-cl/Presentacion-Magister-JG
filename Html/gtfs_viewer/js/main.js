import { initGTFSAnimation } from "./gtfs_animation.js";

async function init(){

    initGTFSAnimation(window.map);

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

    // =========================
    // recién ahora cargar lógica
    // =========================
    await import("./load_data.js");
}

init();