export function initGTFSAnimation(map) {
  document.body.insertAdjacentHTML("beforeend", `
    <div class="heat-ui" id="heatUI">
      <button id="gpsPlay">▶</button>
      <button id="gpsPause">⏸</button>
      <input id="gpsSlider" type="range" min="0" max="0" value="0" step="1"/>
      <span class="lbl" id="gpsLabel">—</span>
    </div>
  `);

  const heatUI = document.getElementById("heatUI");
  L.DomEvent.disableClickPropagation(heatUI);
  L.DomEvent.disableScrollPropagation(heatUI);

  const gpsPlay = document.getElementById("gpsPlay");
  const gpsPause = document.getElementById("gpsPause");
  const gpsSlider = document.getElementById("gpsSlider");
  const gpsLabel = document.getElementById("gpsLabel");

  let heatBuckets = {};
  let timelineKeys = [];
  let timelineIdx = 0;
  let heatTimer = null;

  const heatLayer = L.heatLayer([], {
    radius: 18,
    blur: 14,
    minOpacity: 0.65,
    maxZoom: 17,
    max: 1.0
  }).addTo(map);

  function sortedKeys(obj) {
    return Object.keys(obj).sort((a, b) => Number(a) - Number(b));
  }

  function renderFrame(idx) {
    if (!timelineKeys.length) return;

    timelineIdx = Math.max(0, Math.min(idx, timelineKeys.length - 1));
    gpsSlider.value = timelineIdx;

    const key = timelineKeys[timelineIdx];
    const cells = heatBuckets[key] || [];

    heatLayer.setLatLngs(
      cells.map(p => [p[0], p[1], p[2]])
    );

    gpsLabel.textContent = new Date(Number(key)).toLocaleString("es-CL");
  }

  function heatPlay(speedMs = 500) {
    if (heatTimer || !timelineKeys.length) return;

    heatTimer = setInterval(() => {
      timelineIdx++;
      if (timelineIdx >= timelineKeys.length) timelineIdx = 0;
      renderFrame(timelineIdx);
    }, speedMs);
  }

  function heatPause() {
    if (heatTimer) clearInterval(heatTimer);
    heatTimer = null;
  }

  window.updateHeatmap = function(payload) {
    heatBuckets = payload.heatBuckets ?? payload.heatmap ?? payload;
    timelineKeys = sortedKeys(heatBuckets);

    gpsSlider.max = Math.max(0, timelineKeys.length - 1);
    gpsSlider.value = 0;

    renderFrame(0);
  };

  gpsSlider.addEventListener("input", e => {
    heatPause();
    renderFrame(Number(e.target.value));
  });

  gpsPlay.addEventListener("click", () => heatPlay(500));
  gpsPause.addEventListener("click", heatPause);
}