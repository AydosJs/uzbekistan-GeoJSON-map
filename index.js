const map = L.map("map").setView([41.3812, 64.5736], 6);
let currentPath = data["regions"];

const getTheValue = function (name) {
  let value = 0;
  if (name && currentPath.name === "regions") {
    const region = data["regions"].regionsData.find(
      (region) => region.name === name
    );
    value = region ? region.value : value;
  } else {
    const district = data[currentPath.name].subData.find(
      (district) => district.name === name
    );
    value = district ? district.value : value;
  }
  return value;
};

const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// control that shows state info on hover
const info = L.control();

info.onAdd = function (map) {
  this._div = L.DomUtil.create("div", "info");
  this.update();
  return this._div;
};

info.update = function (props, feature) {
  if (props) {
    let nameForToltip = getFirstWordLowercase(props.name);
    const value = getTheValue(nameForToltip);

    const cName =
      currentPath.name.charAt(0).toUpperCase() + currentPath.name.slice(1);

    const contents = props
      ? `<b>${props.name}</b><br />${value} people`
      : "Tumanlar ustiva boring";
    this._div.innerHTML = `<h4>${
      currentPath.name === "regions" ? "Uzbekistan" : cName
    }</h4>${contents}`;
  }
};

info.addTo(map);

// get color depending on population density value
function getColor(d) {
  return d > 1000
    ? "#800026"
    : d > 500
    ? "#BD0026"
    : d > 200
    ? "#E31A1C"
    : d > 100
    ? "#FC4E2A"
    : d > 50
    ? "#FD8D3C"
    : d > 20
    ? "#FEB24C"
    : d > 10
    ? "#FED976"
    : "#bdbbba";
}

function getFirstWordLowercase(str) {
  let filter = str.replace(/[-',`ʻ]/g, "");
  let name = filter.split(" ")[0].toLowerCase();
  return name;
}

function style(feature) {
  let name = getFirstWordLowercase(feature.properties.name);
  const value = getTheValue(name);

  return {
    weight: 2,
    opacity: 1,
    color: "#75706f",
    dashArray: "3",
    fillOpacity: 0.7,
    fillColor: getColor(value),
  };
}

function highlightFeature(e) {
  const layer = e.target;

  layer.setStyle({
    weight: 5,
    color: "#666",
    dashArray: "",
    fillOpacity: 0.7,
  });

  layer.bringToFront();

  info.update(layer.feature.properties);
}
/* global statesData */

let geojson = L.geoJson(currentPath.path, {
  style,
  onEachFeature,
}).addTo(map);

function resetHighlight(e) {
  geojson.resetStyle(e.target);
  info.update();
}

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

function backToRegions() {
  currentPath = data["regions"];
  geojson.remove();
  geojson = L.geoJson(data["regions"].path, {
    style,
    onEachFeature,
  }).addTo(map);

  map.setView([41.3812, 64.5736], 6);
}

function setDistricts(e, path) {
  currentPath = data[path.substring(0, path.indexOf(" ")).toLowerCase()];
  zoomToFeature(e);
  geojson.remove();
  geojson = L.geoJson(
    data[path.substring(0, path.indexOf(" ")).toLowerCase()].path,
    {
      style,
      onEachFeature,
    }
  ).addTo(map);
}

document
  .getElementById("back-to-regions")
  .addEventListener("click", function () {
    backToRegions();
  });

function bindTooltip(feature, layer) {
  let name = getFirstWordLowercase(feature.properties.name);

  if (name && currentPath.name === "regions") {
    let region = data["regions"].regionsData.find(
      (region) => region.name === name
    );
    if (region) {
      layer
        .bindTooltip(String(region.value), {
          permanent: true,
          direction: "center",
          className:
            "rounded-full w-6 h-6 text-xs flex items-center justify-center",
        })
        .openTooltip();
    }
  } else {
    const district = data[currentPath.name].subData.find(
      (region) => region.name === name
    );
    if (district) {
      layer
        .bindTooltip(String(district.value), {
          permanent: true,
          direction: "center",
          className:
            "rounded-full w-6 h-6 text-xs flex items-center justify-center",
        })
        .openTooltip();
    }
  }
}

function onEachFeature(feature, layer) {
  bindTooltip(feature, layer);

  let path = feature.properties.name.replace(/[-',`ʻ]/g, "");
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: (e) => {
      if (currentPath === data["regions"]) {
        setDistricts(e, path);
      } else {
        backToRegions();
      }
    },
  });
}

// VISUAL MAP

const legend = L.control({ position: "bottomright" });

legend.onAdd = function (map) {
  const div = L.DomUtil.create("div", "info legend");
  const grades = [0, 10, 20, 50, 100, 200, 500, 1000];
  const labels = [];
  let from, to;

  for (let i = 0; i < grades.length; i++) {
    from = grades[i];
    to = grades[i + 1];

    labels.push(
      `<i style="background:${getColor(from + 1)}"></i> ${from}${
        to ? `&ndash;${to}` : "+"
      }`
    );
  }

  div.innerHTML = labels.join("<br>");
  return div;
};

legend.addTo(map);
