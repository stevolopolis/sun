import * as d3 from "npm:d3";

function canvas(width, height, label) {
  return d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr("aria-label", label)
    .style("display", "block")
    .style("max-width", "100%");
}

export function extremesChart(width, rows, allRows) {
  const isSingle = rows.length <= 2;
  const columns = isSingle || width < 680 ? 1 : 2;
  const pairGroups = Array.from(
    d3.group(rows, d => String(d.PAIR_ID || d.pair_id)),
    ([pair, stations]) => ({
      pair,
      theme: stations[0]?.PAIR_THEME || stations[0]?.pair_theme || stations[0]?.theme || "",
      stations: stations.sort((a, b) =>
        d3.ascending(a.STATION_ROLE || a.station_role, b.STATION_ROLE || b.station_role)
      )
    })
  ).sort((a, b) => d3.ascending(+a.pair, +b.pair));

  const panelWidth = Math.floor(width / columns);
  const panelHeight = isSingle ? 210 : 195;
  const numRows = Math.ceil(pairGroups.length / columns);
  const headerHeight = 65;
  const height = headerHeight + numRows * panelHeight + 10;

  const margin = {
    top: 48,
    right: 32,
    bottom: 25,
    left: 45
  };

  const insideWidth = panelWidth - margin.left - margin.right;
  const insideHeight = panelHeight - margin.top - margin.bottom;

  const hotColor = "#d95f45";
  const coldColor = "#2378a4";

  const svg = canvas(width, height, "Total extreme-weather days, 1973–2025");

  // Title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 22)
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .style("font-size", width < 500 ? "15px" : "18px")
    .style("font-weight", "bold")
    .text("How Often Do Locations Experience Temperature Extremes?");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 38)
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("fill-opacity", 0.65)
    .style("font-size", "11px")
    .text("Total extreme-weather days, 1973–2025");

  // Legend
  const legendItems = [
    {label: "Extremely hot (MAX > 90°F)", color: hotColor},
    {label: "Freezing night (MIN < 32°F)", color: coldColor}
  ];
  const legendG = svg.append("g")
    .attr("transform", `translate(${Math.max(10, width / 2 - 170)}, 55)`);

  legendItems.forEach((d, i) => {
    const item = legendG.append("g")
      .attr("transform", `translate(${i * 185}, 0)`);
    item.append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("rx", 2)
      .attr("fill", d.color);
    item.append("text")
      .attr("x", 15)
      .attr("y", 9)
      .attr("fill", "currentColor")
      .style("font-size", "11px")
      .text(d.label);
  });

  // Panel
  pairGroups.forEach((pair, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);

    const panel = svg.append("g")
      .attr("transform", `translate(${col * panelWidth}, ${headerHeight + row * panelHeight})`);

    // Background
    panel.append("rect")
      .attr("x", 6)
      .attr("y", 4)
      .attr("width", panelWidth - 12)
      .attr("height", panelHeight - 8)
      .attr("rx", 6)
      .attr("fill", "var(--theme-background-alt, rgba(128, 128, 128, 0.04))")
      .attr("stroke", "var(--theme-foreground-faintest, rgba(128, 128, 128, 0.15))")
      .attr("stroke-width", 1);

    // Heading
    panel.append("text")
      .attr("x", 18)
      .attr("y", 22)
      .attr("fill", "currentColor")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(`Pair ${pair.pair}`);

    panel.append("text")
      .attr("x", 18)
      .attr("y", 36)
      .attr("fill", "currentColor")
      .attr("fill-opacity", 0.65)
      .style("font-size", "9.5px")
      .text(pair.theme || "");

    const bars = pair.stations.flatMap(s => [
      {
        station: (s.station || s.STATION || "").replace(/, USA?$/i, ""),
        role: s.role || s.STATION_ROLE,
        type: "Extremely hot days",
        value: +(s.hot ?? s.HOT_DAYS ?? 0),
        color: hotColor,
        valid: +(s.validMax ?? s.VALID_MAX_DAYS ?? 0)
      },
      {
        station: (s.station || s.STATION || "").replace(/, USA?$/i, ""),
        role: s.role || s.STATION_ROLE,
        type: "Freezing nights",
        value: +(s.cold ?? s.COLD_NIGHTS ?? 0),
        color: coldColor,
        valid: +(s.validMin ?? s.VALID_MIN_DAYS ?? 0)
      }
    ]);

    const chart = panel.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const maxValue = d3.max(bars, d => d.value) || 1;
    const x = d3.scaleLinear()
      .domain([0, maxValue * 1.15])
      .nice()
      .range([0, insideWidth]);

    const groupGap = 16;
    const y = d3.scaleBand()
      .domain([0, 1, 2, 3])
      .range([0, insideHeight - groupGap])
      .padding(0.25);

    const barY = idx => y(idx) + (idx >= 2 ? groupGap : 0);

    const yAxisScale = d3.scaleLinear()
      .domain([0, 1, 2, 3])
      .range([0, 1, 2, 3].map(idx => barY(idx) + y.bandwidth() / 2));

    // X grid lines
    chart.append("g")
      .call(d3.axisBottom(x)
        .ticks(4)
        .tickSize(insideHeight)
        .tickFormat(""))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.08));

    // X axis
    chart.append("g")
      .attr("transform", `translate(0, ${insideHeight})`)
      .call(d3.axisBottom(x).ticks(4))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text")
        .attr("fill", "currentColor")
        .attr("fill-opacity", 0.7)
        .style("font-size", "9px"));

    // Y axis
    chart.append("g")
      .call(d3.axisLeft(yAxisScale)
        .tickValues([0, 1, 2, 3])
        .tickFormat(idx => bars[idx]?.type === "Extremely hot days" ? "Hot" : "Cold")
      )
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text")
        .attr("fill", "currentColor")
        .attr("fill-opacity", 0.8)
        .style("font-size", "9px"));

    // Bars
    chart.selectAll(".bar")
      .data(bars)
      .join("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", (d, idx) => barY(idx))
      .attr("width", d => Math.max(0, x(d.value)))
      .attr("height", y.bandwidth())
      .attr("rx", 2)
      .attr("fill", d => d.color)
      .append("title")
      .text(d => `${d.station}\n${d.type}: ${d.value.toLocaleString()} days\nValid observations: ${d.valid.toLocaleString()}`);

    // Value labels
    chart.selectAll(".value")
      .data(bars)
      .join("text")
      .attr("x", d => x(d.value) + 4)
      .attr("y", (d, idx) => barY(idx) + y.bandwidth() / 2 + 3)
      .attr("fill", "currentColor")
      .attr("fill-opacity", 0.8)
      .style("font-size", "9px")
      .text(d => d.value.toLocaleString());

    // Station name labels above their bars
    pair.stations.forEach(s => {
      const stationRole = s.role || s.STATION_ROLE;
      const stationName = (s.station || s.STATION || "").replace(/, USA?$/i, "");
      const stationBars = bars.filter(d => d.role === stationRole);
      const firstIndex = bars.indexOf(stationBars[0]);
      if (firstIndex >= 0) {
        chart.append("text")
          .attr("x", 0)
          .attr("y", barY(firstIndex) - 4)
          .attr("fill", "currentColor")
          .attr("fill-opacity", 0.85)
          .style("font-size", "9.5px")
          .style("font-weight", "600")
          .text(stationName);
      }
    });
  });

  return svg.node();
}
