import * as d3 from "npm:d3";

const colors = ["#2378a4", "#bd5639"];
const minDays = 300; // a year with fewer usable days is left as a gap
const margin = {top: 24, right: 20, bottom: 40, left: 48};
const height = 360;

// For each station and year: the mean of |daily TEMP - 15-day average| over days where both exist.
export function yearlyFluctuation(daily, smoothed, stations) {
  return stations.map(({station_id}) => d3.rollups(
    d3.range(daily.length).filter(i => daily[i][station_id] !== "" && smoothed[i][station_id] !== ""),
    days => ({
      days: days.length,
      value: days.length < minDays ? null
        : d3.mean(days, i => Math.abs(daily[i][station_id] - smoothed[i][station_id])),
    }),
    i => +daily[i].date.slice(0, 4),
  ));
}

export function fluctuationFigure(width, daily, smoothed, stations) {
  const firstYear = +daily[0].date.slice(0, 4), lastYear = +daily.at(-1).date.slice(0, 4);
  const years = d3.range(firstYear, lastYear + 1);
  const series = yearlyFluctuation(daily, smoothed, stations).map(rows => {
    const byYear = new Map(rows);
    return years.map(year => ({year, value: byYear.get(year)?.value ?? null}));
  });
  const x = d3.scaleLinear([firstYear, lastYear], [margin.left, width - margin.right]);
  const y = d3.scaleLinear([0, d3.max(series.flat(), d => d.value)],
    [height - margin.bottom, margin.top]).nice();

  const root = d3.create("div").style("display", "grid").style("gap", "12px");
  root.append("div").style("font-weight", 600)
    .text("Yearly mean absolute deviation of daily temperature from its 15-day average");
  const legend = root.append("div").style("display", "flex").style("flex-wrap", "wrap")
    .style("gap", "4px 20px").style("font-size", "12px");
  stations.forEach((station, k) => {
    const item = legend.append("span").style("display", "inline-flex")
      .style("align-items", "center").style("gap", "6px");
    item.append("svg").attr("width", 22).attr("height", 10).append("line")
      .attr("x1", 1).attr("x2", 21).attr("y1", 5).attr("y2", 5)
      .attr("stroke", colors[k]).attr("stroke-width", 2);
    item.append("span").text(station.station);
  });

  const svg = root.append("svg").attr("viewBox", [0, 0, width, height]).attr("role", "img")
    .attr("aria-label", `Yearly day-to-day temperature fluctuation at `
      + `${stations.map(d => d.station).join(" and ")}, ${firstYear}–${lastYear}`)
    .style("display", "block").style("max-width", "100%");
  svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(Math.max(2, Math.floor(width / 80))).tickFormat(d3.format("d")));
  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(6))
    .call(g => g.selectAll(".tick line").clone().attr("x2", width - margin.left - margin.right)
      .attr("opacity", 0.13));
  svg.append("text").attr("x", margin.left).attr("y", 12).attr("fill", "currentColor")
    .attr("font-size", 12).text("Mean absolute deviation (°F)");
  svg.append("text").attr("x", width - margin.right).attr("y", height - 6)
    .attr("text-anchor", "end").attr("fill", "currentColor").attr("font-size", 12).text("Year");

  const line = d3.line().defined(d => d.value !== null).x(d => x(d.year)).y(d => y(d.value));
  series.forEach((values, k) => {
    svg.append("path").attr("d", line(values)).attr("fill", "none").attr("stroke", colors[k])
      .attr("stroke-width", 2);
    // Dots keep a year visible even when both its neighbours are gaps.
    svg.append("g").attr("fill", colors[k]).selectAll("circle")
      .data(values.filter(d => d.value !== null)).join("circle")
      .attr("cx", d => x(d.year)).attr("cy", d => y(d.value)).attr("r", 2.5);
  });

  return root.node();
}
