const PLATE_COLORS_KEY = "plateColors_v2";
const _plateColors = JSON.parse(localStorage.getItem(PLATE_COLORS_KEY) || "{}");

function savePlateColors(){
    localStorage.setItem(PLATE_COLORS_KEY, JSON.stringify(_plateColors));
}

function colorPorPatente(plate){
    if (_plateColors[plate]) return _plateColors[plate];

    const n = Object.keys(_plateColors).length;
    const hue = (n * 137.508) % 360;

    const color = `hsl(${hue} 72% 50%)`;

    _plateColors[plate] = color;
    savePlateColors();

    return color;
}

window.routesLayer = null;
window.routesLegend = null;

function addLegend(geojson){

    if (window.routesLegend){
        window.map.removeControl(window.routesLegend);
    }

    const plates = [
        ...new Set(
            (geojson.features || [])
                .map(f => f.properties?.license_plate)
                .filter(Boolean)
        )
    ].sort();

    window.routesLegend = L.control({
        position: "bottomleft"
    });

    window.routesLegend.onAdd = function(){

        const div = L.DomUtil.create("div", "legend plates-legend");

        div.innerHTML = `
            <strong>Patentes</strong>
            <div class="plates-list">
                ${plates.map(p => `
                    <div class="plate-row">
                        <span 
                            class="plate-color" 
                            style="background:${colorPorPatente(p)}">
                        </span>
                        <span>${p}</span>
                    </div>
                `).join("")}
            </div>
        `;

        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);

        return div;
    };

    window.routesLegend.addTo(window.map);
}

window.updateRoutes = function(geojson){

    window.lastRoutesGeojson = geojson;

    if (window.routesLayer){
        window.map.removeLayer(window.routesLayer);
    }

    window.routesLayer = L.geoJSON(geojson, {
        style: feature => {
            const plate =
                feature.properties?.license_plate || "Sin patente";

            return {
                color: colorPorPatente(plate),
                weight: 3,
                opacity: 0.75
            };
        },
        onEachFeature: (feature, layer) => {
            const plate =
                feature.properties?.license_plate || "Sin patente";

            layer.bindPopup(`<b>Patente:</b> ${plate}`);
        }
    });

    const routesToggle = document.getElementById("routesToggle");

    if (!routesToggle || routesToggle.checked){
        window.routesLayer.addTo(window.map);
        addLegend(geojson);
    }
};

document.addEventListener("change", e => {

    if (e.target.id !== "routesToggle") return;
    if (!window.routesLayer) return;

    if (e.target.checked){
        window.routesLayer.addTo(window.map);

        if (window.lastRoutesGeojson){
            addLegend(window.lastRoutesGeojson);
        }

    } else {
        window.map.removeLayer(window.routesLayer);

        if (window.routesLegend){
            window.map.removeControl(window.routesLegend);
        }
    }
});