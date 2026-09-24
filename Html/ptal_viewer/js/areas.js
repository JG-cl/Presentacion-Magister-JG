const areaLayers = L.layerGroup().addTo(map);
const areaLayerByName = new Map();
let allAreasBounds = null;
let lastAreasConfig = null;

window.setAreasVisible = function(show) {

    if (show) {

        if (!map.hasLayer(areaLayers)) {
            areaLayers.addTo(map);
        }

    } else {

        if (map.hasLayer(areaLayers)) {
            map.removeLayer(areaLayers);
        }
    }
};

function clearAreas() {
    areaLayers.clearLayers();
    areaLayerByName.clear();
    allAreasBounds = null;
}

function focusAllAreas() {
    if (!allAreasBounds) return;

    map.fitBounds(allAreasBounds, {
        padding: [20, 20],
        maxZoom: 18
    });
}

function focusArea(nombre) {
    const layer = areaLayerByName.get(nombre);

    if (!layer) {
        console.warn("Área no encontrada:", nombre);
        return;
    }

    map.fitBounds(layer.getBounds(), {
        padding: [30, 30],
        maxZoom: 18
    });
}

window.refreshAreaSelector = function() {
    const areaSelect = document.getElementById("areaSelect");
    if (!areaSelect || !lastAreasConfig) return;

    areaSelect.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "__all__";
    allOption.textContent = "Todas las áreas";
    areaSelect.appendChild(allOption);

    Object.keys(lastAreasConfig).forEach(nombre => {
        const option = document.createElement("option");
        option.value = nombre;
        option.textContent = nombre;
        areaSelect.appendChild(option);
    });

    areaSelect.value = "__all__";
    areaSelect.onchange = () => {
        if (areaSelect.value === "__all__") {
            focusAllAreas();
        } else {
            focusArea(areaSelect.value);
        }
    };
};

async function loadArea(nombre, areaPath) {

    const response = await fetch(areaPath);
    const areaJson = await response.json();

    const coords = areaJson.coords_latlng.map(p => [
        p.lat,
        p.lng
    ]);

    const layer = L.polygon(coords, {
        color: "#3388ff",
        weight: 6,
        opacity: 1,
        fillColor: "#3388ff",
        fillOpacity: 0.12
    });

    layer.bringToFront();

    layer.bindTooltip(nombre, {
        permanent: true,
        direction: "center",
        className: "area-label"
    });

    areaLayers.addLayer(layer);
    areaLayerByName.set(nombre, layer);

    return layer;
}

window.addEventListener("message", async (event) => {

    const areas = event.data?.areas;

    if (!areas) return;

    lastAreasConfig = areas;

    clearAreas();

    const boundsList = [];

    for (const [nombre, path] of Object.entries(areas)) {

        const layer = await loadArea(
            nombre,
            path
        );

        boundsList.push(
            layer.getBounds()
        );
    }

    if (boundsList.length > 0) {

        // Crear límites generales independientes. No reutilizar el bounds de
        // la primera área, porque extend() lo modificaría y Baja terminaría
        // teniendo los límites conjuntos de todas las áreas.
        const totalBounds = L.latLngBounds([]);

        for (const areaBounds of boundsList) {
            totalBounds.extend(areaBounds);
        }

        allAreasBounds = totalBounds;
        focusAllAreas();
    }

    window.refreshAreaSelector();
});
