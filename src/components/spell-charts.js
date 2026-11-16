import * as d3 from "npm:d3";

function canvas(width, height, label) {
  return d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr("aria-label", label)
    .style("display", "block")
    .style("max-width", "100%");
}

export function spellTimelineChart(width, {
  series = [],
  spells = [],
  windowStart,
  windowEnd,
  averagingWindow = "day",
  displaySpan = 1,
  startYear = 2021,
  pairTheme = "",
  pairId = "1"
} = {}) {
  const DAY = 24 * 60 * 60 * 1000;
  const height = width < 600 ? 400 : (width < 900 ? 450 : 490);
  const margin = {
    top: 90,
    right: 35,
    bottom: 65,
    left: 55
  };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const colors = {
    A: "#2378a4",
    B: "#bd5639",
    heat: "#d95f45",
    cold: "#2378a4"
  };

  const svg = canvas(width, height, "Temperature comparison and extreme spells timeline");

  const cleanName = name => (name || "")
    .replace(/, USA?$/i, "")
    .replace(/\b(INTERNATIONAL|AIRPORT|WEATHER FORECAST OFFICE)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || name;

  const stationA = cleanName(series[0]?.station || "Station A");
  const stationB = cleanName(series[1]?.station || "Station B");

  // Title
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 24)
    .attr("fill", "currentColor")
    .style("font-size", width < 600 ? "14px" : "18px")
    .style("font-weight", "bold")
    .text("Temperature Comparison & Extreme Spells");

  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 42)
    .attr("fill", "currentColor")
    .attr("fill-opacity", 0.65)
    .style("font-size", "11px")
    .text(`${pairTheme ? pairTheme + " · " : ""}Pair ${pairId} · ${averagingWindow} averages`);

  // Date range label
  svg.append("text")
    .attr("x", width - margin.right)
    .attr("y", 24)
    .attr("text-anchor", "end")
    .attr("fill", "currentColor")
    .style("font-size", "11px")
    .style("font-weight", "600")
    .text(`${d3.utcFormat("%b %Y")(windowStart)} – ${d3.utcFormat("%b %Y")(new Date(+windowEnd - DAY))}`);

  const spanText = typeof displaySpan === "number" && displaySpan < 1
    ? `${Math.round(displaySpan * 12)} mo`
    : `${displaySpan} yr`;
  const badges = [
    `Pair ${pairId}`,
    `Window: ${averagingWindow}`,
    `Span: ${spanText}`,
    `Start: ${startYear}`
  ];

  let badgeX = margin.left;
  badges.forEach(label => {
    const pillW = label.length * 6.5 + 16;
    svg.append("rect")
      .attr("x", badgeX)
      .attr("y", 54)
      .attr("width", pillW)
      .attr("height", 22)
      .attr("rx", 11)
      .attr("fill", "var(--theme-background-alt, rgba(128, 128, 128, 0.08))")
      .attr("stroke", "var(--theme-foreground-faintest, rgba(128, 128, 128, 0.15))");

    svg.append("text")
      .attr("x", badgeX + pillW / 2)
      .attr("y", 68)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("fill-opacity", 0.8)
      .style("font-size", "10px")
      .text(label);

    badgeX += pillW + 8;
  });

  // Scales
  const x = d3.scaleUtc()
    .domain([windowStart, windowEnd])
    .range([margin.left, width - margin.right]);

  const allTemps = series.flatMap(s => (s.values || []).map(d => d.temp)).filter(v => v != null && !isNaN(v));
  const tempExtent = d3.extent(allTemps);
  const yMin = tempExtent[0] !== undefined ? Math.floor(Math.min(tempExtent[0], -10) / 5) * 5 : 0;
  const yMax = tempExtent[1] !== undefined ? Math.ceil(Math.max(tempExtent[1], 40) / 5) * 5 : 100;

  const y = d3.scaleLinear()
    .domain([yMin, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Check if series is empty
  if (allTemps.length === 0) {
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("fill-opacity", 0.5)
      .style("font-size", "13px")
      .text("No temperature observations in this time window");
  }

  // Extreme spell shading
  const visibleSpells = (spells || []).filter(d => d.start && d.end && !isNaN(+d.start) && !isNaN(+d.end) && d.start < windowEnd && d.end >= windowStart);
  svg.append("g")
    .selectAll(".spell-region")
    .data(visibleSpells)
    .join("rect")
    .attr("class", "spell-region")
    .attr("x", d => x(d.start < windowStart ? windowStart : d.start))
    .attr("y", margin.top)
    .attr("width", d => {
      const x0 = x(d.start < windowStart ? windowStart : d.start);
      const x1 = x(new Date(Math.min(+d.end + DAY, +windowEnd)));
      return Math.max(3, x1 - x0);
    })
    .attr("height", innerHeight)
    .attr("fill", d => d.type === "heat" ? colors.heat : colors.cold)
    .attr("fill-opacity", 0.22)
    .attr("stroke", d => d.type === "heat" ? colors.heat : colors.cold)
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 0.5)
    .append("title")
    .text(d =>
      `${cleanName(d.station)}\n${d.type.toUpperCase()} SPELL (${d.duration} ${d.duration === 1 ? "day" : "days"})\n` +
      `${d3.utcFormat("%b %d, %Y")(d.start)} – ${d3.utcFormat("%b %d, %Y")(d.end)}\n` +
      `Peak: ${(+d.peak).toFixed(1)}°F\n` +
      `Mean severity: ${(+d.meanSeverity).toFixed(1)}°F beyond threshold` +
      (d.recovery ? `\nRecovery: ${d.recovery} days` : "")
    );

  // Grid lines
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerWidth).tickFormat(""))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.08));

  // X axis
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width < 600 ? 5 : (width < 900 ? 8 : 12)).tickFormat(d3.utcFormat("%b %Y")))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll("text")
      .attr("fill", "currentColor")
      .attr("fill-opacity", 0.75)
      .style("font-size", "10px"));

  // Y axis
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll("text")
      .attr("fill", "currentColor")
      .attr("fill-opacity", 0.8)
      .style("font-size", "10px"));

  // Y axis label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + innerHeight / 2))
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("fill-opacity", 0.8)
    .style("font-size", "11px")
    .text("Temperature (°F)");

  // Series lines and averages
  series.forEach(s => {
    const color = s.role === "Station A" ? colors.A : colors.B;
    const validValues = (s.values || []).filter(d => d.temp != null && !isNaN(d.temp));
    const avg = d3.mean(validValues, d => d.temp);

    if (avg != null && !isNaN(avg)) {
      svg.append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", y(avg))
        .attr("y2", y(avg))
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "3,4")
        .attr("stroke-opacity", 0.7);

      svg.append("text")
        .attr("x", width - margin.right - 5)
        .attr("y", y(avg) - 4)
        .attr("text-anchor", "end")
        .attr("fill", color)
        .style("font-size", "9.5px")
        .text(`Avg ${avg.toFixed(1)}°F`);
    }

    const line = d3.line()
      .defined(d => d.temp != null && !isNaN(d.temp))
      .x(d => x(d.date))
      .y(d => y(d.temp));

    svg.append("path")
      .datum(validValues)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("d", line);

    if (validValues.length <= 150) {
      svg.append("g")
        .selectAll("circle")
        .data(validValues)
        .join("circle")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.temp))
        .attr("r", 2.5)
        .attr("fill", color)
        .append("title")
        .text(d => `${cleanName(s.station)}\n${d3.utcFormat("%b %d, %Y")(d.date)}: ${(+d.temp).toFixed(1)}°F`);
    }
  });

  // Bottom legend
  // Adjusts size depending on window
  const isNarrow = width < 760;
  const legendY1 = height - 28;
  const legendY2 = height - 12;

  const row1Items = [
    { label: stationA, color: colors.A, type: "line" },
    { label: stationB, color: colors.B, type: "line" },
    { label: "Dashed: window average", color: "#888", type: "dashed" }
  ];

  const row2Items = [
    { label: "Heat spell (MAX ≥ 90°F)", color: colors.heat, type: "rect" },
    { label: "Cold spell (MIN ≤ -10°F)", color: colors.cold, type: "rect" }
  ];

  const items = isNarrow
    ? [{ items: row1Items, y: legendY1 }, { items: row2Items, y: legendY2 }]
    : [{ items: [...row1Items, ...row2Items], y: legendY2 }];

  items.forEach(row => {
    const rowG = svg.append("g").attr("transform", `translate(${margin.left}, ${row.y})`);
    let xOffset = 0;
    row.items.forEach(item => {
      const g = rowG.append("g").attr("transform", `translate(${xOffset},0)`);
      if (item.type === "line") {
        g.append("line")
         .attr("x1", 0)
         .attr("x2", 18)
         .attr("y1", -4)
         .attr("y2", -4)
         .attr("stroke", item.color)
         .attr("stroke-width", 2.5);
      } else if (item.type === "rect") {
        g.append("rect")
         .attr("x", 0)
         .attr("y", -9)
         .attr("width", 14)
         .attr("height", 10)
         .attr("rx", 2)
         .attr("fill", item.color)
         .attr("fill-opacity", 0.45)
         .attr("stroke", item.color).attr("stroke-width", 1);
      } else {
        g.append("line")
         .attr("x1", 0)
         .attr("x2", 18)
         .attr("y1", -4)
         .attr("y2", -4)
         .attr("stroke", item.color)
         .attr("stroke-width", 1.8)
         .attr("stroke-dasharray", "3,3");
      }
      g.append("text")
       .attr("x", 24)
       .attr("y", 0)
       .attr("fill", "currentColor")
       .style("font-size", "10px")
       .text(item.label);
      xOffset += item.label.length * 6.2 + 36;
    });
  });

  return svg.node();
}
