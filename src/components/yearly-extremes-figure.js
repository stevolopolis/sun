import * as d3 from "npm:d3";

export const minValidDays = 300;
const colors = {max: "#bd5639", mean: "#3d8b4f", min: "#2378a4"};
const dashes = [null, "1 4"]; // station A solid, station B dotted
const margin = {top: 24, right: 20, bottom: 40, left: 44};
const height = 360;

// One row per station and year: the highest, average and lowest daily mean TEMP of that year.
// A year with fewer than minValidDays valid days keeps its row but gets null values.
export function yearlyExtremes(rows, stations) {
  return stations.flatMap(s => d3.rollups(rows, days => {
    const temps = days.map(d => d[s.station_id]).filter(v => v !== "").map(Number);
    const complete = temps.length >= minValidDays;
    return {
      station: s.station,
      valid_days: temps.length,
      max_f: complete ? d3.max(temps) : null,
      mean_f: complete ? d3.mean(temps) : null,
      min_f: complete ? d3.min(temps) : null,
    };
  }, d => +d.date.slice(0, 4)).map(([year, d]) => ({year, ...d})));
}

function legendItem(parent, color, dash, text) {
  const item = parent.append("span").style("display", "inline-flex")
    .style("align-items", "center").style("gap", "6px");
  item.append("svg").attr("width", 24).attr("height", 10).append("line")
    .attr("x1", 2).attr("x2", 22).attr("y1", 5).attr("y2", 5).attr("stroke", color)
    .attr("stroke-width", 2).attr("stroke-linecap", "round").attr("stroke-dasharray", dash);
  item.append("span").text(text);
}

export function yearlyExtremesFigure(width, yearly, stations) {
  const years = d3.extent(yearly, d => d.year);
  const x = d3.scaleLinear(years, [margin.left, width - margin.right]);
  const y = d3.scaleLinear(d3.extent(yearly.flatMap(d => [d.min_f, d.max_f]).filter(v => v !== null)),
    [height - margin.bottom, margin.top]).nice();

  const root = d3.create("div").style("display", "grid").style("gap", "12px");
  root.append("div").style("font-weight", 600)
    .text("Yearly highest, average and lowest daily mean temperature");
  const legend = root.append("div").style("display", "flex").style("flex-wrap", "wrap")
    .style("gap", "4px 20px").style("font-size", "12px");
  legendItem(legend, colors.max, null, "Yearly maximum");
  legendItem(legend, colors.mean, null, "Yearly average");
  legendItem(legend, colors.min, null, "Yearly minimum");
  stations.forEach((s, k) => legendItem(legend, "currentColor", dashes[k], s.station));

  const svg = root.append("svg").attr("viewBox", [0, 0, width, height]).attr("role", "img")
    .attr("aria-label", `Yearly maximum, average and minimum daily mean temperature at `
      + `${stations.map(d => d.station).join(" and ")}, ${years.join("–")}`)
    .style("display", "block").style("max-width", "100%");
  svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(Math.max(2, Math.floor(width / 80))).tickFormat(d3.format("d")));
  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(6))
    .call(g => g.selectAll(".tick line").clone().attr("x2", width - margin.left - margin.right)
      .attr("opacity", 0.13));
  svg.append("text").attr("x", margin.left).attr("y", 12).attr("fill", "currentColor")
    .attr("font-size", 12).text("Daily mean temperature (°F)");
  svg.append("text").attr("x", width - margin.right).attr("y", height - 4)
    .attr("text-anchor", "end").attr("fill", "currentColor").attr("font-size", 12).text("Year");

  stations.forEach((s, k) => {
    const values = yearly.filter(d => d.station === s.station);
    for (const field of ["max", "mean", "min"]) {
      const defined = d => d && d[`${field}_f`] !== null;
      const line = d3.line().defined(defined).x(d => x(d.year)).y(d => y(d[`${field}_f`]));
      svg.append("path").attr("d", line(values)).attr("fill", "none")
        .attr("stroke", colors[field]).attr("stroke-width", 2).attr("stroke-linecap", "round")
        .attr("stroke-dasharray", dashes[k]);
      // A kept year between two gaps has no segment to draw, so mark it with a dot.
      const isolated = values.filter((d, i) => defined(d) && !defined(values[i - 1]) && !defined(values[i + 1]));
      svg.append("g").attr("fill", colors[field]).selectAll("circle").data(isolated).join("circle")
        .attr("cx", d => x(d.year)).attr("cy", d => y(d[`${field}_f`])).attr("r", 2.5);
    }
  });

  return root.node();
}
