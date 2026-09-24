let polyLayer = L.layerGroup().addTo(map);
let maskLayer = null;
let hexLayer = L.layerGroup().addTo(map);
let currentHexFeatures = null;
let currentPolyCoords = null;
let currentPolyTurf = null;
let currentPolyBufferTurf = null;
let currentPolyBuffers = [];
let areaShapeContexts = [];

function reset_area_shapes() {
  polyLayer.clearLayers();
  hexLayer.clearLayers();
  if (maskLayer) map.removeLayer(maskLayer);
  maskLayer = null;
  currentHexFeatures = null;
  currentPolyCoords = null;
  currentPolyTurf = null;
  currentPolyBufferTurf = null;
  currentPolyBuffers = [];
  areaShapeContexts = [];
}

async function poly_shape(areaPath, options = {}) {
  const response = await fetch(areaPath);
  if (!response.ok) throw new Error(`No se pudo cargar: ${areaPath}`);
  const data = await response.json();
  const coords = data.coords_geojson;
  if (!coords?.length) throw new Error(`coords_geojson vacío: ${areaPath}`);

  const polyTurf = turf.polygon([coords]);
  const polyBufferTurf = turf.buffer(polyTurf, 200, { units: "meters" });
  const latlngs = coords.map(coord => [coord[1], coord[0]]);
  const polygonLayer = L.polygon(latlngs, {
    pane: "polyPane", color: "#1f77b4", weight: 3, fillOpacity: 0.08
  }).addTo(polyLayer);

  const context = {
    id: options.areaId || `area_${areaShapeContexts.length + 1}`,
    name: options.areaName || "Área", coords, polyTurf, polyBufferTurf,
    polygonLayer, hexFeatures: null, hexGeoLayer: null
  };
  context.hexGeoLayer = draw_hex_grid(context);
  areaShapeContexts.push(context);
  currentPolyBuffers.push(polyBufferTurf);
  currentPolyCoords = coords;
  currentPolyTurf = polyTurf;
  currentPolyBufferTurf = polyBufferTurf;
  currentHexFeatures = context.hexFeatures;
  return context;
}

function finalize_area_shapes() {
  if (!areaShapeContexts.length) return;
  const bounds = L.latLngBounds([]);
  areaShapeContexts.forEach(ctx => bounds.extend(ctx.polygonLayer.getBounds()));
  map.fitBounds(bounds, { padding: [20, 20], maxZoom: 18 });
  map.setMaxBounds(bounds.pad(0.5));

  const world = [[-90,-180],[-90,180],[90,180],[90,-180]];
  const holes = areaShapeContexts.map(ctx => ctx.coords.map(c => [c[1], c[0]]));
  maskLayer = L.polygon([world, ...holes], {
    pane: "polyPane", color: "black", fillColor: "black",
    fillOpacity: 0.75, weight: 0
  }).addTo(map);
  maskLayer.bringToBack();
}

function focus_all_areas() {
  if (!areaShapeContexts.length) return;
  const bounds = L.latLngBounds([]);
  areaShapeContexts.forEach(ctx => bounds.extend(ctx.polygonLayer.getBounds()));
  map.fitBounds(bounds, { padding: [20, 20], maxZoom: 18 });
}

function focus_area(areaId) {
  const context = areaShapeContexts.find(ctx => ctx.id === areaId);
  if (!context) {
    console.warn("⚠ Área no encontrada:", areaId);
    return;
  }
  map.fitBounds(context.polygonLayer.getBounds(), {
    padding: [30, 30],
    maxZoom: 18
  });
}

function draw_hex_grid(context) {
  const grid = turf.hexGrid(turf.bbox(context.polyTurf), 0.035, { units: "kilometers" });
  const clippedHexes = { type: "FeatureCollection", features: [] };
  grid.features.forEach(hex => {
    if (!turf.booleanIntersects(hex, context.polyTurf)) return;
    try {
      let clipped;
      try { clipped = turf.intersect(turf.featureCollection([hex, context.polyTurf])); }
      catch (_) { clipped = turf.intersect(hex, context.polyTurf); }
      if (!clipped) return;
      clipped.properties = {
        ...(hex.properties || {}),
        hex_id: `${context.id}_${clippedHexes.features.length}`,
        area_id: context.id
      };
      clippedHexes.features.push(clipped);
    } catch (error) { console.warn("⚠ Error recortando hexágono:", error); }
  });
  context.hexFeatures = clippedHexes;
  return L.geoJSON(clippedHexes, {
    pane: "hexPane",
    style: { color: "#222", weight: 0.9, fillColor: "#bdbdbd", fillOpacity: 0.18 }
  }).addTo(hexLayer);
}
