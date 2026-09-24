async function loadPtal(fileName) {
    console.log("Cargando PTAL:", fileName);

    const response = await fetch(
        `../../Data/Data Ptal/${fileName}`
    );

    const data_ptal = await response.json();

    console.log("PTAL cargado:", data_ptal);

    window.updatePtalHeatmap(data_ptal);
}

async function initPtalSelector() {
    try {
        const daySelect = document.getElementById("daySelect");

        if (!daySelect) {
            console.error("No existe #daySelect");
            return;
        }

        const response = await fetch(
            "../../Data/Data Ptal/index.json"
        );

        const files = await response.json();

        console.log("Index PTAL:", files);

        daySelect.innerHTML = "";

        files.forEach(file => {
            const option = document.createElement("option");

            option.value = file;
            option.textContent = file.replace(".geojson", "");

            daySelect.appendChild(option);
        });

        if (files.length > 0) {
            await loadPtal(files[0]);
        }

        daySelect.addEventListener("change", () => {
            loadPtal(daySelect.value);
        });

    } catch (error) {
        console.error("Error cargando index PTAL:", error);
    }
}

initPtalSelector();