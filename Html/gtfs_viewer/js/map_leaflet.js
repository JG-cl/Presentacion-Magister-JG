const esMovil = window.matchMedia(
  "(pointer: coarse) and (max-width: 1024px)"
).matches;

window.map = L.map("map", {
  preferCanvas: esMovil
}).setView([-36.82, -73.04], 14);
L.tileLayer(
  "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
  {
    subdomains: "abc",
    maxZoom: 22
  }
).addTo(map);