---
title: Subway wait times
toc: false
---

# How long you wait for a train

```js
import {Scrubber} from "./components/scrubber.js";

const data = FileAttachment("data/waits.json").json();
const stations = FileAttachment("data/stations.csv").csv({typed: true});
const network = FileAttachment("data/network.json").json();
const boroughsTopology = FileAttachment("data/boroughs.json").json();
```

```js
const boroughs = topojson.feature(boroughsTopology, boroughsTopology.objects.boroughs);
const subwayBoroughs = {
  type: "FeatureCollection",
  features: boroughs.features.filter((d) => d.properties.name !== "Staten Island")
};
const core = {type: "MultiPoint", coordinates: [[-74.025, 40.675], [-73.93, 40.83]]};
const steps = d3.range(24 * 60 / data.step_minutes);
const LIGHT = ["#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"]; // short -> long wait
const DARK = ["#184f95", "#256abf", "#3987e5", "#6da7ec", "#9ec5f4"]; // flipped for dark mode

function clock(step) {
  const minutes = (28 * 60 + data.step_minutes * step) % (24 * 60); // the day starts at 04:00
  return d3.utcFormat("%H:%M")(new Date(minutes * 60e3));
}
```

```js
const dayType = view(Inputs.radio(
  new Map([["Weekday", "weekday"], ["Saturday", "saturday"], ["Sunday", "sunday"]]),
  {label: "Day", value: "weekday"}
));
const area = view(Inputs.radio(
  new Map([["All boroughs", "all"], ["Manhattan and downtown Brooklyn", "core"]]),
  {label: "Area", value: "all"}
));
const scrubber = Scrubber(steps, {
  initial: 16,
  format: (step) => `${clock(step)} (trains ${clock(step - 2)}–${clock(step + 2)})`
});
const step = view(scrubber);
```

```js
const hovered = Mutable(null);
const setHovered = (station) => (hovered.value = station);
```

```js
function waitAt(complexId, step) {
  return data.waits[complexId]?.[dayType]?.[step] ?? null;
}

const current = stations.map((d) => ({...d, wait: waitAt(d.complex_id, step)}));
const served = current.filter((d) => d.wait !== null);
const quantile = (p) => d3.quantile(served, p, (d) => d.wait).toFixed(1);
const median = steps.map((s) => ({
  step: s,
  wait: d3.median(stations, (d) => waitAt(d.complex_id, s))
}));
const dayName = {weekday: "weekday", saturday: "Saturday", sunday: "Sunday"}[dayType];
const accent = dark ? "#3987e5" : "#256abf"; // the hovered station's line
```

<p class="lede">
  At <b>${clock(step)}</b> on a typical ${dayName}, the median station has an average wait of
  <b>${quantile(0.5)} min</b>. One in ten stations waits under ${quantile(0.1)} min, one in ten
  over ${quantile(0.9)} min${current.length > served.length ? `; ${current.length - served.length}
  stations have no trains` : ""}.
</p>

```js
function waitMap(width) {
  const plot = Plot.plot({
    width,
    height: Math.min(760, Math.round(width * 1.45)),
    projection: {type: "mercator", domain: area === "all" ? subwayBoroughs : core, inset: 8},
    color: {
      type: "threshold",
      domain: [3, 5, 8, 12],
      range: dark ? DARK : LIGHT,
      label: "Average wait (min)",
      legend: true
    },
    marks: [
      Plot.geo(boroughs, {
        fill: "var(--theme-background)", stroke: "var(--theme-foreground-faintest)"
      }),
      Plot.geo(network, {stroke: "var(--theme-foreground-fainter)"}),
      Plot.dot(current, {
        filter: (d) => d.wait === null,
        x: "lon",
        y: "lat",
        r: 3,
        stroke: "var(--theme-foreground-faint)"
      }),
      Plot.dot(served, {
        x: "lon", y: "lat", r: 4, fill: "wait", stroke: "var(--theme-background)", strokeWidth: 1
      }),
      Plot.dot(current, Plot.pointer({
        x: "lon", y: "lat", r: 7, stroke: "var(--theme-foreground)", strokeWidth: 1.5
      })),
      Plot.tip(current, Plot.pointer({
        x: "lon",
        y: "lat",
        title: (d) => [
          d.name,
          `Lines: ${d.lines}`,
          d.wait === null ? "No trains" : `Average wait: ${d.wait.toFixed(1)} min`
        ].join("\n")
      }))
    ]
  });
  plot.addEventListener("input", () => plot.value && setHovered(plot.value)); // keep the last one
  return plot;
}
```

```js
function dayChart(width) {
  const station = hovered && steps.map((s) => ({
    step: s,
    wait: waitAt(hovered.complex_id, s) ?? NaN
  }));
  const plot = Plot.plot({
    width,
    height: 260,
    x: {
      domain: [0, steps.length - 1],
      ticks: width < 480 ? [8, 32, 56, 80] : [8, 20, 32, 44, 56, 68, 80, 92],
      tickFormat: clock,
      label: null
    },
    y: {domain: [0, 20], grid: true, label: "Average wait (min)"},
    marks: [
      Plot.ruleY([0]),
      Plot.line(median, {
        x: "step", y: "wait", stroke: "var(--theme-foreground-muted)", strokeWidth: 2
      }),
      station ? Plot.line(station, {x: "step", y: "wait", stroke: accent, strokeWidth: 2}) : null,
      Plot.ruleX([step], {stroke: "var(--theme-foreground)", strokeDasharray: "2,3"}),
      Plot.ruleX(steps, Plot.pointerX({
        x: (s) => s, stroke: "var(--theme-foreground-faintest)", strokeWidth: 6
      }))
    ]
  });
  plot.style.cursor = "pointer";
  plot.addEventListener("click", () => plot.value != null && scrubber.jump(plot.value)); // go there
  return plot;
}
```

<div class="controls">${scrubber}</div>

<div class="grid grid-cols-2" style="grid-auto-rows: auto;">
  <div class="card">${resize(waitMap)}</div>
  <div>
    <div class="card">
      <h2>Over the day</h2>
      <h3>Typical ${dayName}, 04:00 to 04:00 · click to jump to a time</h3>
      <div class="legend">
        <span class="swatch" style="background: var(--theme-foreground-muted)"></span>Median station
        ${hovered
          ? html`<span class="swatch" style="background: ${accent}"></span>${hovered.name}`
          : html`<span class="hint">Hover a station to compare it</span>`}
      </div>
      ${resize(dayChart)}
    </div>
    <div class="card">
      <h2>Stations at ${clock(step)}</h2>
      <h3>Longest average wait first</h3>
      ${Inputs.table(current, {
        columns: ["name", "lines", "wait"],
        header: {name: "Station", lines: "Lines", wait: "Wait (min)"},
        format: {wait: (x) => (x === null ? "No trains" : x.toFixed(1))},
        sort: "wait",
        reverse: true,
        height: 300
      })}
    </div>
  </div>
</div>

## About the numbers

- **Average wait** is how long a rider who arrives at a random time waits for the next train of the
  line they want, in the direction they want. With gaps *h* between trains it is E[*h*²] / 2E[*h*],
  so uneven gaps (bunching) count against a line, not only a low frequency.
- It is computed for each platform and line from the trains that arrived in the hour around the
  selected time, then averaged over the platforms and lines of each station complex. Lines that do
  not run then (e.g. the B on weekends) are left out of that average.
- A **typical day** is the median over the ${data.days.weekday} weekdays, ${data.days.saturday}
  Saturdays and ${data.days.sunday} Sundays from ${data.first_day} to ${data.last_day}. A station
  shows "no trains" when it had none on more than half of those days. The day runs from 04:00 to
  04:00, as the subway's service day does.
- Arrival times come from [subwaydata.nyc](https://subwaydata.nyc), which records the MTA's
  real-time feed: each time is the last prediction before the train left the station. A train's
  last stop is left out, since no one boards there. The Staten Island Railway is left out.

<style>

.lede {
  max-width: none;
  font-size: 1.1rem;
}

.controls .scrubber {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font: 14px var(--sans-serif);
  font-variant-numeric: tabular-nums;
}

.controls .scrubber button {
  width: 4.5rem;
}

.controls .scrubber input {
  flex: 1;
  max-width: 480px;
}

.grid > div > .card:first-child {
  margin-top: 0;
}

.legend {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.5rem 0;
  font: 12px var(--sans-serif);
}

.legend .swatch {
  display: inline-block;
  width: 14px;
  height: 2px;
  margin-left: 0.6rem;
}

.legend .swatch:first-child {
  margin-left: 0;
}

.legend .hint {
  margin-left: 0.6rem;
  color: var(--theme-foreground-muted);
}

</style>
