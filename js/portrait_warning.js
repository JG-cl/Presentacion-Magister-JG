document.addEventListener("DOMContentLoaded", () => {

    // Evita crear el aviso dos veces
    if (document.querySelector(".portrait-warning")) {
        return;
    }

    const orientationBox = document.createElement("div");

    orientationBox.className = "portrait-warning";

    orientationBox.innerHTML = `
        <div class="portrait-warning-content">

            <div class="portrait-warning-phone">
                <div class="portrait-warning-phone-screen"></div>
            </div>

            <div class="portrait-warning-text">
                <strong>Gira tu dispositivo</strong>
                <span>
                    Esta presentación está optimizada para visualización horizontal.
                </span>
            </div>

        </div>
    `;

    document.body.appendChild(orientationBox);

});