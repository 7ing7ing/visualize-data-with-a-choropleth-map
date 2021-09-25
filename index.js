const height = 700;
const width = 1200;
const padding = 50;

const svg = d3
  .select("div")
  .append("svg")
  .attr("height", height)
  .attr("width", width);

const legendValues = {
  percentages: [3, 12, 21, 30, 39, 48, 57, 66],
  colours: [
    "#caf0f8",
    "#ade8f4",
    "#90e0ef",
    "#48cae4",
    "#00b4d8",
    "#0096c7",
    "#0077b6",
    "#023e8a",
  ],
  height: 10,
  width: 35,
};

const tooltip = d3.select("div").append("div").attr("id", "tooltip");

const data_education =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
const data_counties =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

//Creación de un nuevo objeto haciendo "merge" de los dos API's anteriores

fetch(data_education)
  .then((response) => response.json())
  .then((json) => mergeData(json)); //función para hacer "merge"

function mergeData(data) {
  //data = data_education parseado a json en el fetch de arriba

  fetch(data_counties)
    .then((response) => response.json())
    .then((json) => {
      //Loop a data (que es data_education), el parámetro de la función
      for (let i = 0; i < data.length; i++) {
        let fips = data[i].fips;

        let geometries = json.objects.counties.geometries; //geometries apunta a json.objects.counties.geometries, NO está creando un json nuevo
        for (let j = 0; j < geometries.length; j++) {
          let id = geometries[j].id;

          if (fips === id) {
            geometries[j] = Object.assign({}, geometries[j], data[i]);
            break; //El for no para cuando se cumple la condición, es mejor práctica poner "break;" por eficiencia
          }
        }
      }
      return json; //Está devolviendo el json modificado
    })
    .then((json) => drawMap(json));
}

function drawMap(data) {
  console.log(data);
  const feature = topojson.feature(data, data.objects.counties); //Returns the GeoJSON Feature or FeatureCollection for the specified object in the given topology
  const path = d3.geoPath(); //Función que crea los valores del SVG a partir de las coordenadas de "feature".

  const index = d3.local(); //variable local para guardar los índices de cada feature

  svg
    .selectAll("path")
    .data(feature.features)
    .enter()
    .append("path")
    .each(function (d, i) {
      //this representa el feature que estás recorriendo en este momento (de feature.features)
      //esta línea guarda el índice de cada feature
      index.set(this, i);
    })
    .attr("d", path)
    .attr("transform", "scale(1.22, 1.02)")
    .attr("class", "county")
    .attr("data-fips", (d, i) => data.objects.counties.geometries[i].fips)
    .attr(
      "data-education",
      (d, i) => data.objects.counties.geometries[i].bachelorsOrHigher
    )
    .attr("fill", (d, i) => {
      const bachelorsPercentage =
        data.objects.counties.geometries[i].bachelorsOrHigher;

      if (bachelorsPercentage >= 0 && bachelorsPercentage < 12) {
        return "#caf0f8";
      } else if (bachelorsPercentage >= 12 && bachelorsPercentage < 21) {
        return "#ade8f4";
      } else if (bachelorsPercentage >= 21 && bachelorsPercentage < 30) {
        return "#90e0ef";
      } else if (bachelorsPercentage >= 30 && bachelorsPercentage < 39) {
        return "#48cae4";
      } else if (bachelorsPercentage >= 39 && bachelorsPercentage < 48) {
        return "#00b4d8";
      } else if (bachelorsPercentage >= 48 && bachelorsPercentage < 57) {
        return "#0096c7";
      } else if (bachelorsPercentage >= 57 && bachelorsPercentage < 100) {
        return "#0077b6";
      }
    })
    .on("mouseover", function (evt, d) {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(
        data.objects.counties.geometries[index.get(this)].area_name +
          ", " +
          data.objects.counties.geometries[index.get(this)].state +
          ": " +
          data.objects.counties.geometries[index.get(this)].bachelorsOrHigher +
          "%"
      );
      tooltip.attr(
        "data-education",
        (d, i) =>
          data.objects.counties.geometries[index.get(this)].bachelorsOrHigher
      );

      tooltip.style("position", "absolute");
      tooltip.style("left", evt.pageX + 20 + "px");
      tooltip.style("top", evt.pageY + "px");
    })
    .on("mouseout", function () {
      tooltip.transition().duration(400).style("opacity", 0);
    });

  const xLegend = d3
    .scaleLinear()
    .domain([
      d3.min(legendValues.percentages),
      d3.max(legendValues.percentages),
    ])
    .range([0, 250]); //Valor en píxeles. Comienza donde el translate

  const legendAxis = d3
    .axisBottom()
    .scale(xLegend)
    .tickValues(legendValues.percentages)
    .tickFormat((d) => d + "%");

  svg.append("g").attr("id", "legend");

  svg
    .select("#legend")
    .append("g")
    .call(legendAxis)
    .attr(
      "transform",
      "translate(" +
        (width - legendValues.percentages.length * legendValues.width) +
        ",10)"
    );

  svg
    .select("#legend")
    .selectAll("rect")
    .data(
      legendValues.percentages.slice(0, legendValues.percentages.length - 1)
    )
    .enter()
    .append("rect")
    .attr("x", (d) => xLegend(d))
    .attr("y", 0)
    .attr("width", legendValues.width)
    .attr("height", legendValues.height)
    .attr(
      "transform",
      "translate(" +
        (width - legendValues.percentages.length * legendValues.width) +
        ", 0)"
    )
    .attr("fill", (d, i) => legendValues.colours[i]);
}
