let accessLayer = null;

const accessColors = [
  "#e41a1c",
  "#377eb8",
  "#4daf4a",
  "#984ea3",
  "#ff7f00",
  "#00bcd4"
];

function getAccessLatLng(data) {
  const lat =
    data?.lat ??
    data?.latitude ??
    data?.centro?.lat ??
    data?.centro?.latitude ??
    data?.location?.lat ??
    data?.location?.latitude;

  const lng =
    data?.lng ??
    data?.lon ??
    data?.longitude ??
    data?.centro?.lng ??
    data?.centro?.lon ??
    data?.centro?.longitude ??
    data?.location?.lng ??
    data?.location?.lon ??
    data?.location?.longitude;

  if (lat == null || lng == null) return null;

  return [Number(lat), Number(lng)];
}

function getAccessRadius(data) {
  const r = data?.radio ?? data?.radius;

  if (r == null) return 35;

  const n = Number(r);

  if (Number.isNaN(n)) return 35;

  return n;
}

function draw_access(payload, accessName = "Acceso", index = 0) {
  const data = typeof payload === "string" ? JSON.parse(payload) : payload;

  const latlng = getAccessLatLng(data);
  const radius = getAccessRadius(data);

  if (!latlng) {
    console.warn("⚠ Coordenadas inválidas para acceso:", accessName, data);
    return;
  }

  if (!accessLayer) {
    accessLayer = L.layerGroup().addTo(map);
  }

  const color = accessColors[index % accessColors.length];

  L.circle(latlng, {
    radius: radius,
    color: color,
    fillColor: color,
    fillOpacity: 0.35,
    opacity: 1,
    weight: 4,
    pane: "poiPane"
  }).addTo(accessLayer);

  L.marker(latlng, {
    pane: "poiPane",
    interactive: false,
    icon: L.divIcon({
      className: "",
      html: `
        <div
          class="access-label"
          style="--access-color:${color};"
        >
          ${accessName}
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    })
  }).addTo(accessLayer);

  console.log("✅ Acceso dibujado:", accessName, latlng, "radio:", radius);
}

function draw_accesses(accessDict) {
  if (!accessLayer) {
    accessLayer = L.layerGroup().addTo(map);
  }

  accessLayer.clearLayers();

  Object.entries(accessDict || {}).forEach(([accessName, accessData], index) => {
    draw_access(accessData, accessName, index);
  });

  accessLayer.eachLayer(layer => {
    if (typeof layer.bringToFront === "function") {
      layer.bringToFront();
    }
  });
}

function reset_accesses() {
  if (!accessLayer) accessLayer = L.layerGroup().addTo(map);
  accessLayer.clearLayers();
}

function append_accesses(accessDict) {
  if (!accessLayer) accessLayer = L.layerGroup().addTo(map);
  Object.entries(accessDict || {}).forEach(([name, data], index) => {
    draw_access(data, name, index);
  });
}
