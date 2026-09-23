async function load_json(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`No se pudo cargar: ${path}`);
  }

  return await response.json();
}

async function load_json_optional(path, label = "") {
  try {
    return await load_json(path);
  } catch (error) {
    console.warn(`⚠ No se pudo cargar ${label}:`, path, error);
    return null;
  }
}

function installExtendedCargarDatosPoi(retry = 0) {
  const cargarDatosPoiOriginal = window.cargarDatosPoi;

  if (typeof cargarDatosPoiOriginal !== "function") {
    if (retry < 50) {
      setTimeout(() => installExtendedCargarDatosPoi(retry + 1), 100);
    } else {
      console.error("❌ No apareció window.cargarDatosPoi original");
    }

    return;
  }

  window.cargarDatosPoi = async function(cfg) {
    console.log("📦 Config POI extendida recibida:", cfg);

    await cargarDatosPoiOriginal(cfg);

    const accessDrawData = {};
    const accessDistanceData = {};

    if (cfg.accesos) {
      for (const [accessName, paths] of Object.entries(cfg.accesos)) {
        const accessPath = paths?.[0];
        const distancePath = paths?.[1];

        if (accessPath) {
          const accessData = await load_json_optional(
            accessPath,
            `acceso ${accessName}`
          );

          if (accessData) {
            accessDrawData[accessName] = accessData;
          }
        }

        if (distancePath) {
          const distanceData = await load_json_optional(
            distancePath,
            `distancia ${accessName}`
          );

          if (distanceData) {
            accessDistanceData[accessName] = distanceData;
          }
        }
      }

      if (typeof draw_accesses === "function") {
        draw_accesses(accessDrawData);
      } else {
        console.error("❌ draw_accesses no existe");
      }

      if (typeof load_distances_by_access === "function") {
        load_distances_by_access(accessDistanceData);
      } else {
        console.error("❌ load_distances_by_access no existe");
      }
    }

    if (typeof hexLayer !== "undefined" && hexLayer?.bringToFront) {
      hexLayer.bringToFront();
    }

    if (typeof polyLayer !== "undefined" && polyLayer?.bringToFront) {
      polyLayer.bringToFront();
    }

    if (typeof poiLayer !== "undefined" && poiLayer?.bringToFront) {
      poiLayer.bringToFront();
    }

    if (typeof accessLayer !== "undefined" && accessLayer?.bringToFront) {
      accessLayer.bringToFront();
    }

    console.log("✅ cargarDatosPoi extendido ejecutado");
  };

  console.log("✅ cargarDatosPoi extendido instalado");
}

installExtendedCargarDatosPoi();