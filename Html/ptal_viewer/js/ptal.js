// =========================================================
// PTAL: heatmap + grilla
// =========================================================

const ptalHeatLayer = L.heatLayer([], {
    radius: 28,
    blur: 20,
    minOpacity: 0.85,
    maxZoom: 18,
    max: 1.0
}).addTo(map);

let ptalGridLayer = null;

// =========================================================
// Helpers
// =========================================================

function gridColor01(x) {
    const v = Math.max(0, Math.min(1, Number(x) || 0));
    const hue = (1 - v) * 240;
    return `hsl(${hue} 80% 50%)`;
}

// =========================================================
// Grilla PTAL
// =========================================================

function renderPtalGridGeojson(gridGeojson) {
    if (!gridGeojson) return;

    if (ptalGridLayer) {
        map.removeLayer(ptalGridLayer);
        ptalGridLayer = null;
    }

    ptalGridLayer = L.geoJSON(gridGeojson, {
        interactive: true,

        style: (f) => {
            const p = f?.properties || {};
            const h = Number(p.heat_eventos_ptal ?? 0);

            return {
                weight: 1,
                opacity: 0.6,
                color: "#111",
                fillOpacity: 0.6,
                fillColor: gridColor01(h)
            };
        },

        onEachFeature: (f, layer) => {
            const p = f?.properties || {};

            const cellId = p.cell_id ?? "s/i";
            const h = Number(p.heat_eventos_ptal ?? 0);
            const fs = Number(p.freq_sum_eventos_ptal ?? 0);

            layer.bindPopup(`
                <b>Celda</b>: ${cellId}<br>
                <hr style="margin:6px 0">
                <b>PTAL Heat</b>: ${h.toFixed(3)}<br>
                <b>Freq sum</b>: ${fs.toFixed(2)}
            `);
        }
    }).addTo(map);
    ptalGridLayer.bringToBack();
}

// =========================================================
// Heatmap agregado del día
// =========================================================

function getAggregatedHeatPoints(payload) {
    const buckets = payload?.ptal_heatmap?.eventos_ptal;

    if (!buckets) {
        console.error("No existe payload.ptal_heatmap.eventos_ptal");
        return [];
    }

    const acumulado = new Map();

    for (const key of Object.keys(buckets)) {
        const data = buckets[key];

        for (const p of data) {
            const lat = p[0];
            const lon = p[1];
            const heat = Number(p[2] ?? 0);

            const id = `${lat},${lon}`;

            if (!acumulado.has(id)) {
                acumulado.set(id, {
                    lat,
                    lon,
                    heat: 0
                });
            }

            acumulado.get(id).heat += heat;
        }
    }

    return Array.from(acumulado.values()).map(p => [
        p.lat,
        p.lon,
        p.heat
    ]);
}

// =========================================================
// API pública llamada desde load_data.js
// =========================================================

window.updatePtalHeatmap = function(payload) {
    console.log("Payload PTAL:", payload);

    let gridGeojson = payload?.ptal_grid?.grid_geojson;

    if (typeof gridGeojson === "string") {
        gridGeojson = JSON.parse(gridGeojson);
    }

    if (gridGeojson?.type === "FeatureCollection") {
        renderPtalGridGeojson(gridGeojson);
    } else {
        console.warn("No se encontró grilla PTAL válida");
    }

    if (ptalGridLayer) {
        map.fitBounds(ptalGridLayer.getBounds());
    }
};