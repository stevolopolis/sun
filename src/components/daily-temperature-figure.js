import * as d3 from "npm:d3";

const colors = ["#2378a4", "#bd5639"];
const spans = [1, 2, 5, 10]; // years
const margin = {top: 24, right: 20, bottom: 28, left: 44};
const height = 360;
const dayLabel = d3.utcFormat("%b %-d, %Y");

function slider(parent, label, max, ticks, onInput) {
  const control = parent.append("label").style("display", "grid").style("gap", "4px")
    .style("font-size", "12px");
  const head = control.append("div").style("display", "flex")
    .style("justify-content", "space-between");
  head.append("span").style("color", "var(--theme-foreground-muted)").text(label);
  const output = head.append("output").style("font-weight", 600);
  const input = control.append("input").attr("type", "range").attr("min", 0).attr("max", max)
    .attr("step", 1).style("width", "100%").style("margin", 0).on("input", onInput);
  if (ticks) {
    control.append("div").style("position", "relative").style("height", "14px")
      .selectAll("span").data(ticks).join("span").text(d => d)
      .style("position", "absolute").style("transform", "translateX(-50%)")
      .style("left", (_, i) => `calc(8px + (100% - 16px) * ${i / (ticks.length - 1)})`)
      .style("font-size", "11px").style("color", "var(--theme-foreground-muted)");
  }
  return {input: input.node(), output: output.node()};
}

export function dailyTemperatureFigure(width, rows, stations, state) {
  const dates = rows.map(d => new Date(d.date));
  const series = stations.map(s => Float64Array.from(rows,
    d => d[s.station_id] === "" ? NaN : +d[s.station_id]));
  const firstYear = dates[0].getUTCFullYear();
  const years = dates.at(-1).getUTCFullYear() - firstYear + 1;
  const yearDate = n => new Date(Date.UTC(firstYear + n, 0, 1));
  const dayIndex = n => Math.round((yearDate(n) - dates[0]) / 864e5);
  const y = d3.scaleLinear(d3.extent(series.flatMap(v => d3.extent(v))),
    [height - margin.bottom, margin.top]).nice();

  const root = d3.create("div").style("display", "grid").style("gap", "12px");
  root.append("div").style("font-weight", 600).text("Temperature at the two stations");
  const controls = root.append("div").style("display", "grid").style("gap", "12px 24px")
    .style("grid-template-columns", "repeat(auto-fit, minmax(180px, 1fr))");
  const update = field => event => {
    state[field] = +event.target.value;
    draw();
  };
  const spanControl = slider(controls, "Span shown", spans.length - 1,
    spans.map(n => `${n} yr`), update("span"));
  const startControl = slider(controls, "Start year", years - 1, null, update("start"));

  // The legend doubles as the hover readout: a date, then each station's value that day.
  const legend = root.append("div").style("display", "flex").style("flex-wrap", "wrap")
    .style("gap", "4px 20px").style("font-size", "12px");
  const date = legend.append("span").style("font-weight", 600);
  const values = stations.map((station, k) => {
    const item = legend.append("span").style("display", "inline-flex")
      .style("align-items", "center").style("gap", "6px");
    item.append("svg").attr("width", 22).attr("height", 10).append("line")
      .attr("x1", 1).attr("x2", 21).attr("y1", 5).attr("y2", 5)
      .attr("stroke", colors[k]).attr("stroke-width", 2);
    item.append("span").text(station.station);
    return item.append("span").style("font-variant-numeric", "tabular-nums");
  });
  const chart = root.append("div");

  function draw() {
    const span = spans[state.span];
    state.start = Math.min(state.start, years - span);
    const i0 = dayIndex(state.start), i1 = dayIndex(state.start + span);
    const period = span === 1 ? `${firstYear + state.start}`
      : `${firstYear + state.start} – ${firstYear + state.start + span - 1}`;
    const x = d3.scaleUtc([yearDate(state.start), yearDate(state.start + span)],
      [margin.left, width - margin.right]);

    startControl.input.max = years - span;
    for (const [control, value, text] of [
      [spanControl, state.span, `${span} year${span > 1 ? "s" : ""}`],
      [startControl, state.start, period],
    ]) {
      control.input.value = value;
      control.output.textContent = text;
    }

    const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]).attr("role", "img")
      .attr("aria-label", `Daily mean temperature at ${stations.map(d => d.station).join(" and ")},`
        + ` ${period}`)
      .style("display", "block").style("max-width", "100%").style("touch-action", "pan-y");
    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(Math.max(2, Math.floor(width / 90))));
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(6))
      .call(g => g.selectAll(".tick line").clone().attr("x2", width - margin.left - margin.right)
        .attr("opacity", 0.13));
    svg.append("text").attr("x", margin.left).attr("y", 12).attr("fill", "currentColor")
      .attr("font-size", 12).text("Temperature (°F)");

    const indices = d3.range(i0, i1);
    series.forEach((v, k) => {
      const line = d3.line().defined(i => !Number.isNaN(v[i])).x(i => x(dates[i])).y(i => y(v[i]));
      svg.append("path").attr("d", line(indices)).attr("fill", "none").attr("stroke", colors[k])
        .attr("stroke-width", 1.5);
    });

    const focus = svg.append("g").attr("display", "none");
    focus.append("line").attr("y1", margin.top).attr("y2", height - margin.bottom)
      .attr("stroke", "currentColor").attr("stroke-opacity", 0.4);
    const dots = focus.selectAll("circle").data(series).join("circle").attr("r", 4)
      .attr("fill", (_, k) => colors[k]).attr("stroke-width", 2)
      .style("stroke", "var(--theme-background-alt)");
    svg.on("pointermove", event => {
      const day = Math.round((x.invert(d3.pointer(event)[0]) - dates[0]) / 864e5);
      const i = Math.max(i0, Math.min(i1 - 1, day));
      focus.attr("display", null).attr("transform", `translate(${x(dates[i])},0)`);
      dots.attr("display", v => Number.isNaN(v[i]) ? "none" : null).attr("cy", v => y(v[i]) || 0);
      date.text(dayLabel(dates[i]));
      values.forEach((value, k) => value.text(
        Number.isNaN(series[k][i]) ? "no data" : `${series[k][i].toFixed(1)} °F`));
    });
    svg.on("pointerleave", () => {
      focus.attr("display", "none");
      date.text("");
      values.forEach(value => value.text(""));
    });

    chart.selectChildren().remove();
    chart.append(() => svg.node());
  }

  draw();
  return root.node();
}
