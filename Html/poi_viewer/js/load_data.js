window.load_json = async function(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`No se pudo cargar: ${path}`);
  }

  return await response.json();
};

function clipLineByPolygon(feature, polygon) {
  const line = feature;
  const boundary = turf.polygonToLine(polygon);

  let segments = [];

  try {
    const split = turf.lineSplit(line, boundary);
    segments = split.features.length > 0 ? split.features : [line];
  } catch (e) {
    segments = [line];
  }

  const insideSegments = segments.filter(seg => {
    try {
      const len = turf.length(seg);

      if (len === 0) return false;

      const center = turf.along(seg, len / 2);

      return turf.booleanPointInPolygon(
        center,
        polygon
      );

    } catch (e) {
      return false;
    }
  });

  return insideSegments.map(seg => {
    const simplified = turf.simplify(seg, {
      tolerance: 0.00008,
      highQuality: false
    });

    return {
      ...feature,
      geometry: simplified.geometry
    };
  });
}


async function loadRoutes(fileName) {
  console.log("🚌 Cargando trazado desde GTFS:", fileName);

  const response = await fetch(`../../Data/GTFS/${fileName}`);

  if (!response.ok) {
    console.error("❌ No se pudo cargar archivo GTFS:", fileName);
    return;
  }

  const data_rutas = await response.json();

  if (!window.updateRoutes) {
    console.error("❌ window.updateRoutes no existe");
    return;
  }

  // Admite archivos envueltos en { Data: FeatureCollection }
  // y también un FeatureCollection directo.
  const routeCollection = data_rutas.Data || data_rutas;
  const features = routeCollection.features || [];

  // No recortar por las áreas: el archivo representa el conjunto completo
  // de buses y todas sus patentes deben permanecer disponibles.
  console.log("✅ Trazados GTFS completos:", features.length);

  // Opcional: limitar para evitar lag en la slide
  // const MAX_ROUTES = 500;

  // if (features.length > MAX_ROUTES) {
  //   features = features.slice(0, MAX_ROUTES);
  //   console.log("⚠ Rutas limitadas a:", MAX_ROUTES);
  // }

  window.updateRoutes({
    ...routeCollection,
    features: features
  });

  console.log("✅ Trazado cargado:", fileName);
}

async function initGTFSSelector() {
  try {
    // =====================================
    // obtener select
    // =====================================
    const daySelect =
      document.getElementById(
        "daySelect"
      );

    if (!daySelect) {
      console.error(
        "❌ No existe #daySelect"
      );

      return;
    }

    // =====================================
    // cargar SOLO el index desde GTFS_animation
    // =====================================
    const response = await fetch(
      "../../Data/GTFS_animation/index.json"
    );

    if (!response.ok) {
      console.error(
        "❌ No se pudo cargar index GTFS_animation"
      );

      return;
    }

    const files =
      await response.json();

    console.log(
      "✅ Index leído desde GTFS_animation:",
      files
    );

    // =====================================
    // limpiar selector
    // =====================================
    daySelect.innerHTML = "";

    // =====================================
    // llenar combobox
    // IMPORTANTE:
    // option.value queda como archivo base .json
    // NO como _animation.json
    // =====================================
    files.forEach(file => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        file;

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
    // cargar primer trazado desde GTFS
    // =====================================
    if (files.length > 0) {
      await loadRoutes(
        files[0]
      );
    }

    // =====================================
    // evento cambio
    // =====================================
    daySelect.addEventListener(
      "change",
      async () => {
        await loadRoutes(
          daySelect.value
        );
      }
    );

  } catch (error) {
    console.error(
      "❌ Error cargando selector GTFS:",
      error
    );
  }
}
