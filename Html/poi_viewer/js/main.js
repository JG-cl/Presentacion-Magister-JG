function ensureTopPanel() {
  if (document.getElementById("top-panel")) return;
  const panel = document.createElement("div");
  panel.id = "top-panel";
  panel.className = "top-panel";
  panel.innerHTML = `<label>Área:</label><select id="areaSelect"></select>
    <label>Día GTFS:</label><select id="daySelect"></select>
    <label class="chk"><input id="routesToggle" type="checkbox"><span>Rutas</span></label>`;
  document.body.appendChild(panel);
}

function initAreaSelector(areas) {
  const areaSelect = document.getElementById("areaSelect");
  if (!areaSelect) return;

  areaSelect.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "__all__";
  allOption.textContent = "Todas las áreas";
  areaSelect.appendChild(allOption);

  areas.forEach(([areaId, cfg]) => {
    const option = document.createElement("option");
    option.value = areaId;
    option.textContent = cfg.area_name || areaId;
    areaSelect.appendChild(option);
  });

  areaSelect.onchange = () => {
    if (areaSelect.value === "__all__") {
      focus_all_areas();
    } else {
      focus_area(areaSelect.value);
    }
  };
}

function normalizeAreasConfig(message) {
  const payload = message?.data_enviar || message?.areas || message;
  if (payload?.area_seleccionada) return [["area_1", payload]];

  return Object.entries(payload || {}).flatMap(([areaId, value]) => {
    // Acepta tanto area_1: {...} como area_1: { areas: {...} }.
    const area = value?.area_seleccionada
      ? value
      : (value?.areas?.area_seleccionada ? value.areas : null);
    return area ? [[areaId, area]] : [];
  });
}

async function loadOptional(path, label) {
  if (!path) return null;
  try {
    return await window.load_json(path);
  } catch (error) {
    console.error(`❌ No se pudo cargar ${label}: ${path}`, error);
    return null;
  }
}

window.cargarDatosPoi = async function(message) {
  const areas = normalizeAreasConfig(message);
  if (!areas.length) throw new Error("No se recibieron áreas válidas");
  ensureTopPanel();
  reset_area_shapes();
  reset_accesses();
  reset_pois();
  reset_distances();

  let loadedShapeCount = 0;
  const pendingPoiAreas = [];

  for (const [areaId, cfg] of areas) {
    const areaName = cfg.area_name || areaId;
    let shapeContext;
    try {
      shapeContext = await poly_shape(cfg.area_seleccionada, { areaId, areaName });
      loadedShapeCount += 1;
    } catch (error) {
      console.error(`❌ No se pudo cargar el polígono de ${areaName}`, error);
      continue;
    }

    const accessDrawData = {};
    const accessDistanceData = {};
    for (const [accessName, paths] of Object.entries(cfg.accesos || {})) {
      const [accessData, distanceData] = await Promise.all([
        loadOptional(paths?.[0], `${areaName} / ${accessName}`),
        loadOptional(paths?.[1], `distancias ${areaName} / ${accessName}`)
      ]);
      if (accessData) accessDrawData[accessName] = accessData;
      if (distanceData) accessDistanceData[accessName] = distanceData;
    }
    append_accesses(accessDrawData);
    load_distances_for_area(areaId, accessDistanceData);

    if (cfg.data_places) {
      const placesData = await loadOptional(cfg.data_places, `POI de ${areaName}`);
      if (placesData) {
        try {
          const poiPayload = adapt_places_file_to_draw_pois(placesData);
          pendingPoiAreas.push({ poiPayload, areaId, shapeContext });
        } catch (error) {
          console.error(`❌ No se pudieron preparar los POI de ${areaName}`, error);
        }
      }
    }
  }

  if (loadedShapeCount) finalize_area_shapes();
  initAreaSelector(areas);

  // Inicializar GTFS antes del cálculo intensivo de POI/hexágonos.
  // En este punto ya existen los buffers de las tres áreas para recortar rutas.
  try {
    await initGTFSSelector();
  } catch (error) {
    console.error("❌ No se pudo inicializar GTFS", error);
  }

  // Los POI se dibujan una sola vez, después de cargar todas las áreas.
  // Cada área utiliza una subcapa independiente para impedir que otra la borre.
  reset_pois();
  pendingPoiAreas.forEach(({ poiPayload, areaId, shapeContext }) => {
    try {
      draw_pois(poiPayload, { append: true, areaId, shapeContext });
    } catch (error) {
      console.error(`❌ No se pudieron dibujar los POI de ${areaId}`, error);
    }
  });
  hexLayer?.bringToFront?.();
  polyLayer?.bringToFront?.();
  poiLayer?.bringToFront?.();
  accessLayer?.eachLayer?.(layer => layer.bringToFront?.());
  console.log(
    `✅ ${loadedShapeCount} de ${areas.length} áreas y ` +
    `${pendingPoiAreas.length} archivos POI cargados`
  );
};
