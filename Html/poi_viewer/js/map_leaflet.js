const esMovil = window.matchMedia(
  "(pointer: coarse) and (max-width: 1024px)"
).matches;

window.map = L.map("map", {
  preferCanvas: esMovil
}).setView([-36.82, -73.04], 14);

const map = window.map;

L.tileLayer(
  "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
  {
    subdomains: "abc",
    maxZoom: 22
  }
).addTo(map);

// =========================
// Panes
// =========================
map.createPane("hexPane");
map.getPane("hexPane").style.zIndex = 410;

map.createPane("polyPane");
map.getPane("polyPane").style.zIndex = 430;

map.createPane("routePane");
map.getPane("routePane").style.zIndex = 500;

map.createPane("poiPane");
map.getPane("poiPane").style.zIndex = 650;


// =========================
// Click mapa: ocultar panel
// =========================
map.on("click", () => {
  if (typeof hideInfo === "function") {
    hideInfo();
  }
});
