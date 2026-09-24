export function createHeatUI() {

    return `
    <div class="heat-ui" id="heatUI">

        <button id="gpsPlay" title="Play">▶</button>
        <button id="gpsPause" title="Pause">⏸</button>

        <input
            id="gpsSlider"
            type="range"
            min="0"
            max="0"
            value="0"
            step="1"
        />

        <span class="lbl" id="gpsLabel">—</span>

        <span class="toggles">

            <label class="chk">
                <input id="routesToggle" type="checkbox" checked />
                <span>Rutas</span>
            </label>

            <label class="chk">
                <input id="platesToggle" type="checkbox" checked />
                <span>Patente(s)</span>
            </label>

            <label class="chk">
                <input id="zonesToggle" type="checkbox" checked />
                <span>Zonas</span>
            </label>

            <label class="chk">
                <input id="gpsToggle" type="checkbox" checked />
                <span>GPS (GTFS)</span>
            </label>

        </span>

    </div>
    `;
}