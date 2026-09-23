let poiLayer = null;
let poiLayersByArea = {};
let distanceDataByAccess = {};
let distanceDataByArea = {};

// =========================================================
// Carga POIs
// =========================================================

function load_places(data, options = {}) {
  const payload = adapt_places_file_to_draw_pois(data);
  draw_pois(payload, options);
}

function adapt_places_file_to_draw_pois(rawData) {
  if (!rawData || typeof rawData !== "object") {
    console.warn("⚠ Archivo de POIs vacío o inválido");

    return {
      poly: {},
      ring: {},
      "poly main cat": {},
      "ring main cat": {}
    };
  }

  const polyId = Object.keys(rawData).find(key =>
    key !== "ts" &&
    !key.endsWith(" Ring") &&
    rawData?.[key]?.places
  );

  if (!polyId) {
    console.warn("⚠ No se encontró llave principal con places");

    return {
      poly: {},
      ring: {},
      "poly main cat": {},
      "ring main cat": {}
    };
  }

  const ringId = `${polyId} Ring`;

  const polyPois = rawData?.[polyId]?.places || {};
  const ringPois = rawData?.[ringId]?.places || {};

  const polyMainCat = build_main_cat_dict(polyPois);
  const ringMainCat = build_main_cat_dict(ringPois);

  console.log("✅ Archivo POI adaptado:", {
    polyId,
    ringId,
    poly: Object.keys(polyPois).length,
    ring: Object.keys(ringPois).length
  });

  return {
    poly: polyPois,
    ring: ringPois,
    "poly main cat": polyMainCat,
    "ring main cat": ringMainCat
  };
}

function build_main_cat_dict(pois) {
  const catDict = {};

  Object.entries(pois || {}).forEach(([poiId, poi]) => {
    const primary = poi?.primaryType;
    const types = poi?.types || [];

    if (primary) {
      catDict[poiId] = [primary];
    } else if (types.length > 0) {
      catDict[poiId] = [types[0]];
    } else {
      catDict[poiId] = ["default"];
    }
  });

  return catDict;
}

// =========================================================
// Distancias por acceso
// Estructura esperada:
// {
//   "poly_id": { "place_id": {...} },
//   "poly_id Ring": { "place_id": {...} },
//   "ts": ...
// }
// =========================================================

function normKey(key) {
  return String(key || "").trim();
}

function flattenDistanceFile(data) {
  const flat = {};

  Object.entries(data || {}).forEach(([sectionName, sectionData]) => {
    if (sectionName === "ts") return;

    if (!sectionData || typeof sectionData !== "object") return;

    Object.entries(sectionData).forEach(([placeId, distInfo]) => {
      flat[normKey(placeId)] = distInfo;
    });
  });

  return flat;
}

function load_distances_by_access(accessDistancePayload) {
  distanceDataByAccess = {};

  Object.entries(accessDistancePayload || {}).forEach(([accessName, data]) => {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    distanceDataByAccess[accessName] = flattenDistanceFile(parsed);
  });

  console.log("✅ Distancias por acceso cargadas:", distanceDataByAccess);
}

function reset_distances() {
  distanceDataByAccess = {};
  distanceDataByArea = {};
}

function load_distances_for_area(areaId, accessDistancePayload) {
  distanceDataByArea[areaId] = {};
  Object.entries(accessDistancePayload || {}).forEach(([accessName, data]) => {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    distanceDataByArea[areaId][accessName] = flattenDistanceFile(parsed);
  });
}

function findDistanceByPoiIdAndAccess(poiId, accessName) {
  const key = normKey(poiId);

  if (!key) return null;

  return distanceDataByAccess?.[accessName]?.[key] || null;
}

function formatMeters(value) {
  if (value == null || value === "") return "POI sin esa información";

  const n = Number(value);
  if (Number.isNaN(n)) return "POI sin esa información";

  return `${Math.round(n)} m`;
}

function formatMinutes(value) {
  if (value == null || value === "") return "POI sin esa información";

  const n = Number(value);
  if (Number.isNaN(n)) return "POI sin esa información";

  return `${n.toFixed(2)} min`;
}

function buildDistanceInfo(poiId, areaId = null) {
  const distances = areaId ? (distanceDataByArea[areaId] || {}) : distanceDataByAccess;
  const accessNames = Object.keys(distances || {});

  if (accessNames.length === 0) {
    return `
      <br>
      <hr>
      <b>Distancia a accesos</b><br>
      POI sin esa información
    `;
  }

  const rows = accessNames.map(accessName => {
    const dist = distances?.[accessName]?.[normKey(poiId)] || null;

    if (!dist) {
      return `
        <div style="margin-bottom:8px;">
          <b>${accessName}</b><br>
          POI sin esa información
        </div>
      `;
    }

    const routeExists = dist.condition === "ROUTE_EXISTS" ? "Sí" : "No";

    return `
      <div style="margin-bottom:10px;">
        <b>${accessName}</b><br>
        <b>Existe ruta:</b> ${routeExists}<br>
        <b>Distancia:</b> ${formatMeters(dist.distance_meters)}<br>
        <b>Tiempo caminable:</b> ${formatMinutes(dist.travel_time_min)}<br>
        <b>Tiempo Google:</b> ${formatMinutes(dist.google_time_min)}<br>
      </div>
    `;
  }).join("");

  return `
    <br>
    <hr>
    <b>Distancia a accesos</b><br>
    ${rows}
  `;
}

// =========================================================
// Helpers visuales / info POI
// =========================================================

function getCssVar(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

function hideInfo() {
  const panel = document.getElementById("info-panel");
  if (!panel) return;

  panel.style.display = "none";
}

function getCategoryColor(cat) {
  if (["school", "university", "educational_institution"].includes(cat)) {
    return getCssVar("--poi-school");
  }

  if (["doctor", "medical_clinic", "hospital", "health"].includes(cat)) {
    return getCssVar("--poi-health");
  }

  if (["restaurant", "cafe", "food"].includes(cat)) {
    return getCssVar("--poi-food");
  }

  if (["store", "supermarket", "shopping_mall", "grocery_store"].includes(cat)) {
    return getCssVar("--poi-store");
  }

  if (["corporate_office"].includes(cat)) {
    return getCssVar("--poi-corporate");
  }

  if (["park"].includes(cat)) {
    return getCssVar("--poi-park");
  }

  return getCssVar("--poi-default");
}

function formatCategory(cat) {
  if (!cat) return "POI sin esa información";

  return String(cat)
    .replaceAll("_", " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatCategories(cats) {
  if (!cats || cats.length === 0) return "POI sin esa información";
  if (!Array.isArray(cats)) cats = [cats];

  return cats.map(formatCategory).join(", ");
}

function getPoiCategoriesById(poiId, catDict) {
  return catDict?.[poiId] || [];
}

function getPoiName(poi) {
  return poi?.displayName?.text || poi?.name || "POI sin nombre";
}

function getPoiCategory(poiId = null, catDict = null) {
  const cats = getPoiCategoriesById(poiId, catDict);
  return formatCategories(cats);
}

function getPoiColor(poiId = null, catDict = null) {
  const cats = getPoiCategoriesById(poiId, catDict);
  const mainCat = cats?.[0] || "default";

  return getCategoryColor(mainCat);
}

function getRating(poi) {
  return poi?.rating ?? "POI sin esa información";
}

function getReviews(poi) {
  return poi?.userRatingCount ?? "POI sin esa información";
}

function getSchedule(poi) {
  const desc =
    poi?.regularOpeningHours?.weekdayDescriptions ||
    poi?.regularOpeningHours?.weekdayDescription ||
    poi?.currentOpeningHours?.weekdayDescriptions ||
    poi?.currentOpeningHours?.weekdayDescription;

  if (!desc) return "POI sin esa información";

  return Array.isArray(desc) ? desc.join("<br>") : desc;
}

function getAccessibility(poi) {
  const acc = poi?.accessibilityOptions;

  if (!acc || Object.keys(acc).length === 0) {
    return "POI sin esa información";
  }

  return Object.entries(acc)
    .map(([key, value]) => `${key}: ${value}`)
    .join("<br>");
}

function buildPoiPopup(poi, origen = "", poiId = null, catDict = null, areaId = null) {
  return `
    <div style="min-width:220px">
      <b>${getPoiName(poi)}</b>
      <hr>

      <b>Place ID:</b><br>
      ${poiId}<br>

      <b>Categoría:</b> ${getPoiCategory(poiId, catDict)}<br>
      <b>Rating:</b> ${getRating(poi)}<br>
      <b>N reviews:</b> ${getReviews(poi)}<br>

      <b>Horario funcionamiento:</b><br>
      ${getSchedule(poi)}<br><br>

      <b>Accesibilidad:</b><br>
      ${getAccessibility(poi)}

      ${origen ? `<br><br><b>Origen:</b> ${origen}` : ""}

      ${buildDistanceInfo(poiId, areaId)}
    </div>
  `;
}

function showInfo(poi, origen = "", poiId = null, catDict = null, areaId = null) {
  const panel = document.getElementById("info-panel");
  if (!panel) return;

  panel.innerHTML = buildPoiPopup(poi, origen, poiId, catDict, areaId);
  panel.style.display = "block";
}

// =========================================================
// Dibujar POIs
// =========================================================

function reset_pois() {
  if (!poiLayer) poiLayer = L.layerGroup().addTo(map);
  poiLayer.clearLayers();
  poiLayersByArea = {};
}

function draw_pois(payload, options = {}) {
  const data = typeof payload === "string" ? JSON.parse(payload) : payload;

  if (!poiLayer) {
    poiLayer = L.layerGroup().addTo(map);
  }

  if (!options.append) reset_pois();

  const areaId = options.areaId || "default";
  if (!poiLayersByArea[areaId]) {
    poiLayersByArea[areaId] = L.layerGroup().addTo(poiLayer);
  }
  const targetPoiLayer = poiLayersByArea[areaId];
  targetPoiLayer.clearLayers();

  const polyPois = data?.poly || {};
  const ringPois = data?.ring || {};

  const polyMainCat = data?.["poly main cat"] || {};
  const ringMainCat = data?.["ring main cat"] || {};

  const allPois = {
    ...polyPois,
    ...ringPois
  };

  const allCatDict = {
    ...polyMainCat,
    ...ringMainCat
  };

  const areaPrefix = options.areaName ? `${options.areaName} · ` : "";
  draw_poi_group(polyPois, `${areaPrefix}Polígono`, polyMainCat, options.areaId, targetPoiLayer);
  draw_poi_group(ringPois, `${areaPrefix}Ring`, ringMainCat, options.areaId, targetPoiLayer);

  try {
    update_hex_landuse(allPois, allCatDict, options.shapeContext);
  } catch (err) {
    console.error("❌ Error coloreando hexágonos:", err);
  }

  if (hexLayer && typeof hexLayer.bringToFront === "function") {
    hexLayer.bringToFront();
  }

  if (polyLayer && typeof polyLayer.bringToFront === "function") {
    polyLayer.bringToFront();
  }

  if (poiLayer && typeof poiLayer.bringToFront === "function") {
    poiLayer.bringToFront();
  }

  if (accessLayer && typeof accessLayer.bringToFront === "function") {
    accessLayer.bringToFront();
  }

  console.log("✅ POIs dibujados:", {
    poly: Object.keys(polyPois).length,
    ring: Object.keys(ringPois).length
  });
}

function poiHasWheelchairEntrance(poi) {
  const acc = poi?.accessibilityOptions || {};

  return (
    acc?.wheelchairAccessibleEntrance === true ||
    acc?.wheelchairAccessibleEntrance === "true" ||
    acc?.wheelchairAccessibleEntrance === 1
  );
}

function draw_poi_group(pois, origen, catDict = {}, areaId = null, targetLayer = poiLayer) {
  Object.entries(pois).forEach(([poiId, poi]) => {
    const lat = poi?.location?.latitude;
    const lon = poi?.location?.longitude;

    if (lat == null || lon == null) {
      console.warn("⚠ POI sin coordenadas:", poi);
      return;
    }

    const color = getPoiColor(poiId, catDict);
    const hasWheelchairAccess = poiHasWheelchairEntrance(poi);

    L.circleMarker([lat, lon], {
      pane: "poiPane",
      radius: 12,
      color: "#111",
      fillColor: color,
      fillOpacity: 0.98,
      weight: 1.2,
      interactive: true
    })
    .addTo(targetLayer)
    .on("click", (e) => {
      L.DomEvent.stopPropagation(e);

      console.log("🟢 POI clickeado:", poiId);
      console.log("📏 Distancias disponibles:", distanceDataByAccess);

      showInfo(poi, origen, poiId, catDict, areaId);
    });

    if (hasWheelchairAccess) {
      const starSize = 22;

      const starIcon = L.divIcon({
        className: "",
        html: `
          <svg width="${starSize}" height="${starSize}" viewBox="0 0 24 24"
               style="display:block; overflow:visible;">
            <polygon
              points="12,2 14.9,8.3 22,9.1 16.7,13.8 18.2,21 12,17.3 5.8,21 7.3,13.8 2,9.1 9.1,8.3"
              fill="white"
              stroke="black"
              stroke-width="2.2"
              stroke-linejoin="round"
            />
          </svg>
        `,
        iconSize: [starSize, starSize],
        iconAnchor: [starSize / 2, starSize / 2]
      });

      L.marker([lat, lon], {
        icon: starIcon,
        pane: "poiPane",
        interactive: false,
        zIndexOffset: 9999
      }).addTo(targetLayer);
    }
  });
}

// =========================================================
// Hexágonos por categoría dominante
// =========================================================

function update_hex_landuse(allPois, catDict = {}, shapeContext = null) {
  const hexFeatures = shapeContext?.hexFeatures || currentHexFeatures;
  const targetHexLayer = shapeContext?.hexGeoLayer || hexLayer;
  if (!hexFeatures || !targetHexLayer) {
    console.warn("⚠ No hay grilla hexagonal cargada");
    return;
  }

  if (typeof turf === "undefined") {
    console.warn("⚠ Turf.js no está cargado");
    return;
  }

  const hexCategoryCount = new Map();

  hexFeatures.features.forEach(hex => {
    const hexId = hex.properties.hex_id;
    hexCategoryCount.set(hexId, {});
  });

  Object.entries(allPois).forEach(([poiId, poi]) => {
    const lat = poi?.location?.latitude;
    const lon = poi?.location?.longitude;

    const cats = catDict?.[poiId] || [];
    const cat = cats?.[0] || "default";

    if (lat == null || lon == null) return;

    const point = turf.point([lon, lat]);

    hexFeatures.features.forEach(hex => {
      const hexId = hex.properties.hex_id;

      if (turf.booleanPointInPolygon(point, hex)) {
        const counts = hexCategoryCount.get(hexId) || {};
        counts[cat] = (counts[cat] || 0) + 1;
        hexCategoryCount.set(hexId, counts);
      }
    });
  });

  targetHexLayer.eachLayer(layer => {
    const hexId = layer.feature.properties.hex_id;
    const counts = hexCategoryCount.get(hexId) || {};
    const dominantCat = getDominantCategory(counts);

    layer.setStyle({
      color: "#222",
      weight: 0.9,
      fillColor: dominantCat ? getCategoryColor(dominantCat) : "#bdbdbd",
      fillOpacity: dominantCat ? 0.55 : 0.12
    });
  });

  console.log("✅ Hexágonos coloreados por categoría dominante");
}

function getDominantCategory(counts) {
  let bestCat = null;
  let bestCount = 0;

  Object.entries(counts).forEach(([cat, count]) => {
    if (count > bestCount) {
      bestCat = cat;
      bestCount = count;
    }
  });

  return bestCat;
}

// =========================================================
// Panel
// =========================================================

const panel = document.getElementById("info-panel");

if (panel) {
  panel.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}
