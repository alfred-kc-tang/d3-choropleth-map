var width = 960, height = 500;

var svg = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

// create a project for path generator
var projection = d3.geoAlbersUsa()
                   .translate([width/2, height/2])
                   .scale([1000]);

// create path generator
var path = d3.geoPath()
             .projection(projection);

// construct two new maps for storing data
var earthquakes = d3.map(), regions = d3.map()

// define a color scheme, where the domain will be specified by the Total Earthquakes for a given year in log scale
var colorScale = d3.scaleQuantize()
                   .range(['#fff5f0','#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#a50f15','#67000d']);

// create a g tag for adding legend title to prevent the clash between appending the text for the title and for the first upper limit
var legendTitle = svg.append("g")
                     .attr("class", "legendTitle")
                     .attr("transform", "translate(" + (width - width/10) + "," + height/1.6 + ")")
                     .append("text")
                     .attr("transform", "translate(0,-20)")
                     .attr("text-anchor", "middle")
                     .attr("font-weight", "bold")
                     .text("Earthquake Frequency");

// construct a legend, where the upper limit texts will be added
var legend = svg.append("g")
                .attr("class", "legend")
                .attr("transform", "translate(" + (width - width/10) + "," + height/1.6 + ")");

legend.selectAll("rect")
      .data(colorScale.range().map(function(d) { return d;}))
      .enter()
      .append("rect")
      .attr("x", -30)
      .attr("y", function(d, i) { return i*20})
      .attr("height", 15)
                .attr("width", 15)
                .attr("fill", function(d) {return d});

var tip = d3.tip()
            .attr("class", "d3-tip")
            .direction("e")
            .offset([-25, 5])
            .html(function(d) {
              var state = d.properties.name
              var region = regions.get(state)
              var earthquake = earthquakes.get(state)
              return "State: " + state + "<br>Region: " + region + "<br>Earthquakes: " + earthquake;
             });

svg.call(tip);

var handleMouseOver = function(d) {
  d3.select(this)
    .attr("stroke", "#4575b4")
    .attr("stroke-width", "5px");

  tip.show(d);
};

var handleMouseOut = function(d) {
  d3.select(this)
    .attr("stroke", "");

  tip.hide(d);
};

// create a promise to load data from both the csv and json files into a function
var promises = [
  d3.json("states-10m.json"),
  d3.csv("state-earthquakes.csv", function(d) {
    earthquakes.set(d.States, +d["Total Earthquakes"]);
    regions.set(d.States, d.Region);
  })
];

Promise.all(promises).then(ready)

function ready([topology]) {
  var count = earthquakes.values(),
      log = count.map(function(d) {
        if (d == 0) {
          return d;
        } else {
          return Math.log(d);
        }
      })

  colorScale.domain(d3.extent(log));

  svg.append("g")
     .attr("class", "states")
     .selectAll("path")
     .data(topojson.feature(topology, topology.objects.states).features)
     .enter()
     .append("path")
     .attr("fill", function(d) {
        var state = d.properties.name, 
            totalE = earthquakes.get(state)
        if (totalE == undefined) {
          return
        } else if (totalE == 0) {
          return colorScale(totalE)
        } else {
          return colorScale(Math.log(totalE))
        }
      })
     .attr("d", path)
     .on("mouseover", handleMouseOver)
     .on("mouseout", handleMouseOut);

  svg.append("path")
     .attr("class", "state-borders")
     .attr("d", path(topojson.mesh(topology, topology.objects.states, function(a, b) { return a !== b;})))
     .attr("fill", "none")
     .attr("stroke", "#000000")
     .attr("stroke-width", "0.5px");

  // add the upper limits of the color scale, which are rounded up to integers
  // this must be placed within the ready function since the domain is defined within the ready function
  egend.selectAll("text")
       .data(colorScale.range().map(function(d) {
          return Math.exp(colorScale.invertExtent(d)[1]);
        }))
       .enter()
       .append("text")
       .text(function(d) {return Math.floor(d)})
       .attr("x", 30)
       .attr("y", function(d, i) { return i*20 + 13})
       .attr("text-anchor", "end");
}