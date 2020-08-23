var width = Math.max(
    document.documentElement.clientWidth,
    window.innerWidth || 0
  ),
  height = Math.max(
    document.documentElement.clientHeight,
    window.innerHeight || 0
  );

var svg = d3.select("body").append("svg").style("cursor", "move");
console.log("width ", width, height);
svg
  .attr("viewBox", "11700 -2950 " + width + " " + height)
  .attr("preserveAspectRatio", "xMinYMin");

var zoom = d3.zoom().on("zoom", function () {
  var transform = d3.zoomTransform(this);
  map.attr("transform", transform);
});

svg.call(zoom);

var map = svg.append("g").attr("class", "map");

Promise.all([d3.json("data/ban-topo.json"), d3.json("data/cash-data.json")])
  .then(([ban, cashData]) => {
    console.log("ban ", ban);
    drawMap(ban, cashData);
  })
  .catch((error) => {
    console.log("Oh dear, something went wrong: " + error);
  });

function drawMap(bangladesh, cashData) {
  // geoMercator projection
  var projection = d3
    .geoMercator() //d3.geoOrthographic()
    .scale(7400)
    .translate([width / 2, height / 1.5]);

  // geoPath projection
  var path = d3.geoPath().projection(projection);

  //colors for population metrics
  var color = d3
    .scaleThreshold()
    .domain([
      10000,
      100000,
      500000,
      1000000,
      5000000,
      10000000,
      50000000,
      100000000,
      500000000,
      1500000000,
    ])
    .range([
      "#f7fcfd",
      "#e0ecf4",
      "#bfd3e6",
      "#9ebcda",
      "#8c96c6",
      "#8c6bb1",
      "#88419d",
      "#810f7c",
      "#4d004b",
    ]);

  var features = topojson.feature(
    bangladesh,
    bangladesh.objects["json-to-geojson"]
  ).features;

  var upazilasById = {};
  var totalCashIn = 0;
  var totalCashOut = 0;
  cashData.forEach(function (d) {
    upazilasById[d.id] = {
      name: d.name ? d.name : "Default Name",
      cash_in: d.cash_in ? d.cash_in : 0,
      cash_out: d.cash_out ? d.cash_out : 0,
    };
    totalCashIn += d.cash_in ? d.cash_in : 0;
    totalCashOut += d.cash_out ? d.cash_out : 0;
  });
  d3.select(".total-cash-in").text("Total CashIn: " + totalCashIn);
  d3.select(".total-cash-out").text("Total CashOut: " + totalCashOut);
  features.forEach(function (d) {
    d.details = upazilasById[d.properties.id]
      ? upazilasById[d.properties.id]
      : {};
  });

  map
    .append("g")
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("name", function (d) {
      return d.properties.id;
    })
    .attr("id", function (d) {
      return d.id;
    })
    .attr("d", path)
    .style("fill", function (d) {
      return d.details && d.details.cash_in
        ? color(d.details.cash_in)
        : undefined;
    })
    .on("mouseover", function (d) {
      d3.select(this)
        .style("stroke", "white")
        .style("stroke-width", 1)
        .style("cursor", "pointer");

      d3.select(".country").text(d.properties.name);

      d3.select(".cash-in").text(
        (d.details && d.details.cash_in && "CashIn " + d.details.cash_in) ||
          "CashIn 0"
      );

      d3.select(".cash-out").text(
        (d.details && d.details.cash_out && "CashOut " + d.details.cash_out) ||
          "CashOut 0"
      );

      d3.select(".details").style("visibility", "visible");
    })
    .on("mouseout", function (d) {
      d3.select(this).style("stroke", null).style("stroke-width", 0.25);

      d3.select(".details").style("visibility", "hidden");
    });
}
