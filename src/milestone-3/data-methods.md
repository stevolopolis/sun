# Data & Methods

We use daily NOAA Global Surface Summary of the Day (GSOD) observations for 12 stations grouped into six pairs. The analysis covers January 1, 1973 through December 31, 2024. The source file also contains part of 2025, which we excluded to use the same complete calendar years for every station.

## Station pairs and coverage

For each station, the long-term mean weights each valid daily mean temperature (TEMP) equally. A pair meets our working matching criterion if the two means differ by at most 2 °F. All six pairs meet this criterion, with gaps from 0.11 to 0.47 °F. The pair gap appears on both station rows.

```js
const baselines = await FileAttachment("../data/q2-pair-baselines.csv").csv();
```

```js
Inputs.table(baselines, {
  columns: ["pair_id", "station_name", "station_id", "annual_baseline_f", "baseline_gap_f",
    "recorded_days", "valid_temp_days", "absent_days"],
  header: {pair_id: "Pair", station_name: "Station", station_id: "GSOD ID",
    annual_baseline_f: "Mean (°F)", baseline_gap_f: "Pair gap (°F)",
    recorded_days: "Recorded days", valid_temp_days: "Valid TEMP days", absent_days: "Absent days"},
  rows: 12,
})
```

The common period contains 18,993 calendar days per station. Bole International has records for 13,114 days (69.0%), compared with 18,993 days at its paired Atlanta station. The two estimates therefore reflect different sets of observed days.

## Missing observations and aggregation

Blank or non-finite values and the missing-value codes `999.9` and `9999.9` are treated as missing separately for daily maximum (MAX), daily minimum (MIN), and daily mean temperature (TEMP). Valid-day counts reflect usable observations for the measure being summarized. Absent days count dates with no station record.

- [Q1](./q1) computes quartiles for daily highs and lows separately. Daily ranges use the same day's MAX minus MIN when both are valid and MAX is at least MIN.
- [Q2](./q2) pools valid TEMP observations by calendar month across the common period. The x-axis uses January through December for both hemispheres.
- [Q5](./q5) takes, for each station and calendar year, the highest, average and lowest daily TEMP. A station-year with fewer than 300 valid TEMP days is treated as missing and shown as a gap.
- [Q6](./q6) compares each day's TEMP with the centered 15-day average (the day and 7 days on each side), computed over valid days only and left blank when fewer than 8 of the 15 days are valid. For each station and year it takes the largest absolute difference over days where both values exist. A year with fewer than 300 such days is shown as a gap.

The [Milestone 2 page](../milestone-2) includes the merged source dataset. The repository's README documents how to regenerate the summary tables.

### Q1

We started with the [merged source dataset](../milestone-2), which has one row per station per day. We used `STATION` and `DATE` to group records by station and identify each observation day, then kept only records from 1973 through 2024 because 2025 is incomplete. For each station, we excluded blank values and NOAA missing-value codes (`999.9` and `9999.9`) separately for daily highs (`MAX`) and lows (`MIN`). We calculated the daily range as `MAX − MIN` on dates when both values were valid and the high was at least as large as the low.

For each station, we counted the valid days and calculated the 25th percentile, median, and 75th percentile for daily highs, daily lows, and daily ranges. We wrote one row per station and measure to `q1-temperature-distributions.csv`, for 36 rows in total.

[Python script for Q1](https://github.com/daeunppark/sun/blob/main/scripts/summarize-temperatures.py#L77-L95)

#### Final table

```js
const q1Data = await FileAttachment("../data/q1-temperature-distributions.csv").csv({typed: true});
const q1Headers = {
  pair_id: "Pair",
  station_name: "Station",
  metric: "Measure",
  valid_days: "Valid days",
  q1_f: "25th percentile (°F)",
  median_f: "Median (°F)",
  q3_f: "75th percentile (°F)"
};
const q1Columns = Object.keys(q1Headers);
const q1Csv = d3.csvFormatRows([
  Object.values(q1Headers),
  ...q1Data.map(row => q1Columns.map(column => row[column]))
]);
const q1DownloadUrl = "data:text/csv;charset=utf-8," + encodeURIComponent(q1Csv);

display(Inputs.table(q1Data, {
  columns: q1Columns,
  header: q1Headers,
  rows: 6
}));
```

${html`<a download="q1-temperature-distributions.csv" href="${q1DownloadUrl}">Download q1-temperature-distributions.csv</a>`}

```js
import {yearlyExtremes} from "../components/yearly-extremes-figure.js";
import {yearlyFluctuation} from "../components/fluctuation-figure.js";
const daily = await FileAttachment("../data/daily-temperatures.csv").csv();
const smoothed = await FileAttachment("../data/q6-15day-average-temperatures.csv").csv();
const round2 = value => value === null ? null : +value.toFixed(2);
function tableDownload(name, headers, rows) {
  const columns = Object.keys(headers);
  const csv = d3.csvFormatRows([Object.values(headers), ...rows.map(row => columns.map(column => row[column] ?? ""))]);
  return html`<a download="${name}" href="${"data:text/csv;charset=utf-8," + encodeURIComponent(csv)}">Download ${name}</a>`;
}
```

### Q5

We started from the same filtered records as [Q1](#q1). For each station and each day from January 1, 1973 through December 31, 2024, we took the daily mean temperature (`TEMP`), leaving the value blank when the station has no record that day or its `TEMP` is missing. We wrote one row per day and one column per station, named by its GSOD ID, to `daily-temperatures.csv`, for 18,993 rows in total.

The Q5 page groups these daily values by station and calendar year. For each station-year, it counts the valid days and takes the highest, average, and lowest daily `TEMP`. A station-year with fewer than 300 valid days is treated as missing: its maximum, average, and minimum are left blank, and the chart shows a gap. This affects 30 of the 624 station-years, all at Bole International (Addis Ababa).

[Python script for the daily table](https://github.com/daeunppark/sun/blob/main/scripts/summarize-temperatures.py#L59-L65) · [JavaScript for the yearly values](https://github.com/daeunppark/sun/blob/main/src/components/yearly-extremes-figure.js#L9-L23)

#### Final table

```js
const q5Headers = {
  pair_id: "Pair",
  station_name: "Station",
  year: "Year",
  valid_days: "Valid days",
  max_f: "Maximum (°F)",
  mean_f: "Average (°F)",
  min_f: "Minimum (°F)"
};
const q5Rows = baselines.flatMap(station => yearlyExtremes(daily, [{...station, station: station.station_name}])
  .map(d => ({pair_id: station.pair_id, station_name: station.station_name, year: d.year,
    valid_days: d.valid_days, max_f: round2(d.max_f), mean_f: round2(d.mean_f), min_f: round2(d.min_f)})));

display(Inputs.table(q5Rows, {
  columns: Object.keys(q5Headers),
  header: q5Headers,
  format: {year: String},
  rows: 6
}));
```

${tableDownload("q5-yearly-temperatures.csv", q5Headers, q5Rows)} · ${html`<a download="daily-temperatures.csv" href="${await FileAttachment("../data/daily-temperatures.csv").url()}">Download daily-temperatures.csv</a>`}

### Q6

We started from `daily-temperatures.csv` (see [Q5](#q5)). For each station and day, we averaged the valid `TEMP` values in a centered 15-day window: the day itself and the 7 days on each side. Near January 1, 1973 and December 31, 2024, the window is cut off at the edge of the period. If fewer than 8 days in the window have a valid `TEMP`, the average is left blank. We wrote the averages, rounded to four decimals, to `q6-15day-average-temperatures.csv`, which has the same layout as the daily table.

The Q6 page compares the two tables. For each station and day where both values exist, it takes the absolute difference between the daily `TEMP` and its 15-day average. For each station-year, it keeps the largest of these differences. A station-year with fewer than 300 days where both values exist is treated as missing and shown as a gap. As in Q5, this affects 30 station-years, all at Bole International. Three of them have no such days at all and do not appear in the table; the other 27 appear with a blank deviation.

[Python script for the 15-day averages](https://github.com/daeunppark/sun/blob/main/scripts/summarize-temperatures.py#L67-L74) · [JavaScript for the yearly values](https://github.com/daeunppark/sun/blob/main/src/components/fluctuation-figure.js#L8-L19)

#### Final table

```js
const q6Headers = {
  pair_id: "Pair",
  station_name: "Station",
  year: "Year",
  days: "Days with both values",
  value: "Largest deviation (°F)"
};
const q6Rows = baselines.flatMap(station => yearlyFluctuation(daily, smoothed, [station])[0]
  .map(([year, d]) => ({pair_id: station.pair_id, station_name: station.station_name, year,
    days: d.days, value: round2(d.value)})));

display(Inputs.table(q6Rows, {
  columns: Object.keys(q6Headers),
  header: q6Headers,
  format: {year: String},
  rows: 6
}));
```

${tableDownload("q6-yearly-largest-deviation.csv", q6Headers, q6Rows)} · ${html`<a download="q6-15day-average-temperatures.csv" href="${await FileAttachment("../data/q6-15day-average-temperatures.csv").url()}">Download q6-15day-average-temperatures.csv</a>`}
