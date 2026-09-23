async function loadHeatmap(fileName){

    console.log("Cargando:", fileName);

    // =====================================
    // heatmap animado
    // =====================================
    const response = await fetch(
        `../../Data/GTFS_animation/Sin_filtro/${fileName}`
    );

    const data = await response.json();

    window.updateHeatmap(data);

    // =====================================
    // rutas GTFS
    // =====================================
    const routeFile =
        fileName.replace(
            "_animation",
            ""
        );

    const response2 = await fetch(
        `../../Data/GTFS/${routeFile}`
    );

    const data_rutas =
        await response2.json();

    window.updateRoutes(
        data_rutas.Data
    );
}

async function initGTFSSelector(){

    try {

        // =====================================
        // obtener select
        // =====================================
        const daySelect =
            document.getElementById(
                "daySelect"
            );

        if (!daySelect){

            console.error(
                "No existe #daySelect"
            );

            return;
        }

        // =====================================
        // cargar index
        // =====================================
        const response = await fetch(
            "../../Data/GTFS_animation/index.json"
        );

        const files =
            await response.json();

        console.log(
            "Index GTFS:",
            files
        );

        // =====================================
        // limpiar
        // =====================================
        daySelect.innerHTML = "";

        // =====================================
        // llenar combobox
        // =====================================
        files.forEach(file => {

            const animationFile =
                file.replace(
                    ".json",
                    "_animation.json"
                );

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                animationFile;

            option.textContent =
                file.replace(
                    ".json",
                    ""
                );

            daySelect.appendChild(
                option
            );
        });

        // =====================================
        // cargar primero
        // =====================================
        if (files.length > 0){

            const first =
                files[0].replace(
                    ".json",
                    "_animation.json"
                );

            await loadHeatmap(first);
        }

        // =====================================
        // evento cambio
        // =====================================
        daySelect.addEventListener(
            "change",
            () => {

                loadHeatmap(
                    daySelect.value
                );

            }
        );

    } catch(error){

        console.error(
            "Error cargando index GTFS:",
            error
        );
    }
}

initGTFSSelector();