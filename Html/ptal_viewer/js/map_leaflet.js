window.map = L.map("map").setView([-36.82, -73.04], 14);

L.tileLayer(
  "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">' +
      'OpenStreetMap contributors</a>, Tiles style by HOT',

    subdomains: "abc",
    maxZoom: 22
  }
).addTo(map);