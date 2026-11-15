import * as d3 from "npm:d3";

const colors = ["#2378a4", "#bd5639"];
const monthName = d3.utcFormat("%b");
const monthLabel = month => monthName(new Date(Date.UTC(2000, month - 1, 1)));

function canvas(width, height, label) {
  return d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr("aria-label", label)
    .style("display", "block")
    .style("max-width", "100%");
}

export function boxplot(width, rows, allRows) {
  const height = 248;
  const label = d => `${d.station} · ${d.metric}`;
  const y = d3.scaleBand(rows.map(label), [12, 200]).padding(0.45);
  const left = Math.max(92, d3.max(rows, d => label(d).length) * 5.6 + 10);
  const x = d3.scaleLinear(
    [d3.min(allRows, d => +d.whisker_low_f), d3.max(allRows, d => +d.whisker_high_f)],
    [left, width - 20]
  ).nice();
  const color = d3.scaleOrdinal([...new Set(rows.map(d => d.station))], colors);
  const svg = canvas(width, height, "Boxplots of daily high and low temperatures");

  svg.append("g").attr("transform", "translate(0,200)").call(d3.axisBottom(x).ticks(6));
  svg.append("g").attr("transform", `translate(${left},0)`).call(d3.axisLeft(y));
  const boxes = svg.selectAll("g.box").data(rows).join("g").attr("class", "box")
    .attr("transform", d => `translate(0,${y(label(d)) + y.bandwidth() / 2})`)
    .attr("stroke", d => color(d.station));
  boxes.append("line").attr("x1", d => x(+d.whisker_low_f)).attr("x2", d => x(+d.whisker_high_f));
  for (const field of ["whisker_low_f", "whisker_high_f"]) {
    boxes.append("line").attr("x1", d => x(+d[field])).attr("x2", d => x(+d[field]))
      .attr("y1", -5).attr("y2", 5);
  }
  boxes.append("rect").attr("x", d => x(+d.q1_f)).attr("y", -9).attr("height", 18)
    .attr("width", d => x(+d.q3_f) - x(+d.q1_f))
    .attr("fill", d => color(d.station)).attr("fill-opacity", 0.23);
  boxes.append("line").attr("x1", d => x(+d.median_f)).attr("x2", d => x(+d.median_f))
    .attr("y1", -9).attr("y2", 9).attr("stroke-width", 2);
  boxes.append("title").text(d => `${label(d)}: median ${d.median_f} °F · ${d.valid_days} valid days`);
  svg.append("text").attr("x", width - 20).attr("y", 241).attr("text-anchor", "end")
    .attr("fill", "currentColor").attr("font-size", 12).text("Temperature (°F)");
  return svg.node();
}

export function seasonalChart(width, rows, allRows) {
  const height = 310;
  const x = d3.scalePoint(d3.range(1, 13), [47, width - 24]);
  const y = d3.scaleLinear(d3.extent(allRows, d => +d.mean_temp_f), [251, 42]).nice();
  const series = [...d3.group(rows, d => d.station)];
  const svg = canvas(width, height, "Monthly mean temperature by station");
  svg.append("g").attr("transform", "translate(0,251)")
    .call(d3.axisBottom(x).tickValues(width < 430 ? [1, 3, 5, 7, 9, 11, 12] : x.domain()).tickFormat(monthLabel));
  svg.append("g").attr("transform", "translate(47,0)").call(d3.axisLeft(y).ticks(6))
    .call(g => g.selectAll(".tick line").clone().attr("x2", width - 71).attr("opacity", 0.13));
  svg.append("text").attr("x", 47).attr("y", 25).attr("fill", "currentColor")
    .attr("font-size", 12).text("Mean temperature (°F)");
  const line = d3.line().x(d => x(+d.month)).y(d => y(+d.mean_temp_f));

  series.forEach(([station, values], index) => {
    const color = colors[index];
    svg.append("path").datum(values).attr("d", line).attr("fill", "none")
      .attr("stroke", color).attr("stroke-width", 2.5).attr("stroke-dasharray", index ? "5 3" : null);
    svg.append("g").selectAll("circle").data(values).join("circle")
      .attr("cx", d => x(+d.month)).attr("cy", d => y(+d.mean_temp_f)).attr("r", 3.5)
      .attr("fill", color).append("title")
      .text(d => `${station}, ${monthLabel(+d.month)}: ${(+d.mean_temp_f).toFixed(1)} °F · ${d.valid_temp_days} valid days`);
    const legendX = index ? Math.max(150, width / 2) : 47;
    svg.append("line").attr("x1", legendX).attr("x2", legendX + 16).attr("y1", 292).attr("y2", 292)
      .attr("stroke", color).attr("stroke-width", 2.5).attr("stroke-dasharray", index ? "5 3" : null);
    svg.append("text").attr("x", legendX + 22).attr("y", 296).attr("fill", "currentColor")
      .attr("font-size", 12).text(station);
  });
  return svg.node();
}
