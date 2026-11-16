import * as d3 from "npm:d3";

const colors = ["#2378a4", "#bd5639"];
const spans = [
  {label: "3 months", tick: "3 mo", months: 3}, {label: "6 months", tick: "6 mo", months: 6},
  {label: "1 year", tick: "1 yr", months: 12}, {label: "2 years", tick: "2 yr", months: 24},
  {label: "5 years", tick: "5 yr", months: 60}, {label: "10 years", tick: "10 yr", months: 120},
];
const margin = {top: 24, right: 20, bottom: 28, left: 44};
const height = 360;
const monthLabel = d3.utcFormat("%b %Y");
const dayLabel = d3.utcFormat("%b %-d, %Y");
const degrees = value => `${value.toFixed(1)} °F`;

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

function key(parent, swatch, text) {
  const item = parent.append("span").style("display", "inline-flex").style("align-items", "center")
    .style("gap", "6px");
  swatch(item.append("svg").attr("width", 22).attr("height", 10));
  item.append("span").text(text);
}

export function transitionFigure(width, rows, stations, state) {
  const dates = rows.map(d => new Date(d.date));
  const series = stations.map(s => Float64Array.from(rows,
    d => d[s.station_id] === "" ? NaN : +d[s.station_id]));
  const firstYear = dates[0].getUTCFullYear();
  const months = 12 * (dates.at(-1).getUTCFullYear() - firstYear + 1);
  const monthDate = m => new Date(Date.UTC(firstYear + Math.floor(m / 12), m % 12, 1));
  const dayIndex = m => Math.round((monthDate(m) - dates[0]) / 864e5);
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
  const spanControl = slider(controls, "Span shown", spans.length - 1, spans.map(d => d.tick),
    update("span"));
  const startControl = slider(controls, "Start", months - 1, null, update("start"));
  const legend = root.append("div").style("display", "flex").style("flex-wrap", "wrap")
    .style("gap", "4px 20px").style("font-size", "12px");
  const chart = root.append("div").style("position", "relative");

  function draw() {
    const span = spans[state.span].months;
    state.start = Math.min(state.start, months - span);
    const i0 = dayIndex(state.start), i1 = dayIndex(state.start + span);
    const averages = series.map(v => d3.mean(v.subarray(i0, i1)));
    const period = [state.start, state.start + span - 1].map(m => monthLabel(monthDate(m)))
      .join(" – ");
    const x = d3.scaleUtc([monthDate(state.start), monthDate(state.start + span)],
      [margin.left, width - margin.right]);

    startControl.input.max = months - span;
    for (const [control, value, text] of [
      [spanControl, state.span, spans[state.span].label],
      [startControl, state.start, period],
    ]) {
      control.input.value = value;
      control.output.textContent = text;
    }

    legend.selectChildren().remove();
    stations.forEach((station, k) => key(legend,
      svg => svg.append("line").attr("x1", 1).attr("x2", 21).attr("y1", 5).attr("y2", 5)
        .attr("stroke", colors[k]).attr("stroke-width", 2),
      averages[k] === undefined ? `${station.station}: no data in this span`
        : `${station.station}: average ${degrees(averages[k])}`));

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

    const clip = `clip-${Math.random().toString(36).slice(2)}`;
    svg.append("clipPath").attr("id", clip).append("rect").attr("x", margin.left).attr("y", 0)
      .attr("width", width - margin.left - margin.right).attr("height", height - margin.bottom);
    const plot = svg.append("g").attr("clip-path", `url(#${clip})`);

    const indices = d3.range(i0, i1);
    series.forEach((values, k) => {
      const line = d3.line().defined(i => !Number.isNaN(values[i]))
        .x(i => x(dates[i])).y(i => y(values[i]));
      plot.append("path").attr("d", line(indices)).attr("fill", "none").attr("stroke", colors[k])
        .attr("stroke-width", 1.5);
    });

    const focus = svg.append("g").attr("display", "none");
    focus.append("line").attr("y1", margin.top).attr("y2", height - margin.bottom)
      .attr("stroke", "currentColor").attr("stroke-opacity", 0.4);
    const dots = focus.selectAll("circle").data(series).join("circle").attr("r", 4)
      .attr("fill", (_, k) => colors[k]).attr("stroke-width", 2)
      .style("stroke", "var(--theme-background-alt)");
    const tip = d3.create("div").style("position", "absolute").style("top", `${margin.top}px`)
      .style("display", "none").style("pointer-events", "none").style("padding", "6px 8px")
      .style("font-size", "12px").style("line-height", 1.5).style("white-space", "nowrap")
      .style("background", "var(--theme-background)")
      .style("border", "1px solid var(--theme-foreground-faintest)")
      .style("border-radius", "4px");
    svg.on("pointermove", event => {
      const day = Math.round((x.invert(d3.pointer(event)[0]) - dates[0]) / 864e5);
      const i = Math.max(i0, Math.min(i1 - 1, day));
      const px = x(dates[i]);
      focus.attr("display", null).attr("transform", `translate(${px},0)`);
      dots.attr("cy", values => Number.isNaN(values[i]) ? -99 : y(values[i]));
      tip.style("display", null).style("left", `${px}px`)
        .style("transform", px > width / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)");
      tip.selectChildren().remove();
      tip.append("div").style("font-weight", 600).text(dayLabel(dates[i]));
      stations.forEach((station, k) => tip.append("div")
        .text(`${station.station}: `
          + (Number.isNaN(series[k][i]) ? "no data" : degrees(series[k][i]))));
    });
    svg.on("pointerleave", () => {
      focus.attr("display", "none");
      tip.style("display", "none");
    });

    chart.selectChildren().remove();
    chart.append(() => svg.node());
    chart.append(() => tip.node());
  }

  draw();
  return root.node();
}
