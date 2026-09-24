/*
 * Carga y visualiza en Leaflet los accesos enviados desde una slide de Quarto.
 *
 * Requisitos en map_access.html:
 *   - Leaflet debe estar cargado.
 *   - Debe existir una instancia global llamada `map`.
 *   - Incluir este archivo después de crear el mapa:
 *       <script src="load_data.js"></script>
 */

(() => {
  "use strict";

  let accessLayer = null;
  let totalControl = null;

  function getMap() {
    if (typeof window.L === "undefined") {
      throw new Error("Leaflet no está cargado.");
    }

    if (!window.map || typeof window.map.addLayer !== "function") {
      throw new Error("No existe una instancia global de Leaflet llamada `map`.");
    }

    return window.map;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeAccesses(jsonData) {
    if (!jsonData || typeof jsonData.accesses !== "object") {
      throw new Error("El JSON no contiene el objeto `accesses`.");
    }

    return Object.entries(jsonData.accesses).map(([id, access], index) => {
      const accessData = access?.["Data Acceso"];
      const lat = Number(accessData?.centro?.lat);
      const lng = Number(accessData?.centro?.lng);
      const radius = Number(accessData?.radio);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        console.warn(`Se omitió el acceso ${id}: coordenadas inválidas.`);
        return null;
      }

      return {
        id: accessData?.access_id || id,
        name: accessData?.nombre || accessData?.name || `Acceso ${index + 1}`,
        lat,
        lng,
        radius: Number.isFinite(radius) && radius > 0 ? radius : 10
      };
    }).filter(Boolean);
  }

  function updateTotalControl(total) {
    const map = getMap();

    if (totalControl) {
      map.removeControl(totalControl);
    }

    totalControl = window.L.control({ position: "topright" });

    totalControl.onAdd = () => {
      const box = window.L.DomUtil.create("div", "access-total-box");
      box.innerHTML = `<strong>Total accesos utilizados:</strong> ${total}`;
      box.style.background = "rgba(255, 255, 255, 0.94)";
      box.style.padding = "10px 14px";
      box.style.border = "1px solid #b8b8b8";
      box.style.borderRadius = "6px";
      box.style.boxShadow = "0 1px 5px rgba(0, 0, 0, 0.25)";
      box.style.font = "14px/1.35 Arial, sans-serif";
      box.style.color = "#222";
      box.style.whiteSpace = "nowrap";

      window.L.DomEvent.disableClickPropagation(box);
      window.L.DomEvent.disableScrollPropagation(box);

      return box;
    };

    totalControl.addTo(map);
  }

  function drawAccesses(accesses) {
    const map = getMap();

    if (accessLayer) {
      map.removeLayer(accessLayer);
    }

    accessLayer = window.L.featureGroup().addTo(map);

    accesses.forEach((access) => {
      const circle = window.L.circle([access.lat, access.lng], {
        radius: access.radius,
        color: "#1565c0",
        weight: 2,
        fillColor: "#42a5f5",
        fillOpacity: 0.45
      });

      circle.bindTooltip(escapeHtml(access.name), {
        permanent: true,
        direction: "top",
        offset: [0, -6],
        className: "access-name-label"
      });

      circle.bindPopup(`
        <strong>${escapeHtml(access.name)}</strong><br>
        ID: ${escapeHtml(access.id)}<br>
        Radio: ${access.radius.toFixed(1)} m
      `);

      circle.addTo(accessLayer);
    });

    updateTotalControl(accesses.length);

    if (accesses.length > 0) {
      map.fitBounds(accessLayer.getBounds(), {
        padding: [35, 35],
        maxZoom: 16
      });
    }
  }

  async function loadAccessData(jsonPath) {
    if (!jsonPath) {
      throw new Error("No se recibió la ruta del archivo JSON.");
    }

    const response = await fetch(jsonPath);

    if (!response.ok) {
      throw new Error(
        `No se pudo cargar ${jsonPath} (${response.status} ${response.statusText}).`
      );
    }

    const jsonData = await response.json();
    const accesses = normalizeAccesses(jsonData);
    drawAccesses(accesses);

    return accesses;
  }

  window.addEventListener("message", async (event) => {
    const jsonPath = event.data?.access_exporter;
    if (!jsonPath) return;

    try {
      await loadAccessData(jsonPath);
    } catch (error) {
      console.error("Error al cargar los accesos:", error);
      updateTotalControl(0);
    }
  });

  // Permite usar la función directamente desde map_access.html si se requiere.
  window.loadAccessData = loadAccessData;
})();
