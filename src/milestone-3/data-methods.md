# Data & Methods

## Dataset

This project uses daily observations from NOAA’s [Global Surface Summary of the Day (GSOD) archive](https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/), organized by year. More information about the dataset is available on [Data.gov](https://catalog.data.gov/dataset/global-surface-summary-of-the-day-gsod).

TODO: how you changed from original to ${html`<a download="gsod_all_12_stations_1973_2025.csv" href="${await FileAttachment("../data/gsod_all_12_stations_1973_2025.csv").url()}">gsod_all_12_stations_1973_2025.csv</a>`}

TODO: pairs introduction

FEEDBACK:

GSOD archive. Add the twelve station IDs, exact annual-file paths, period, and steps to recreate the merged files.

### Q1

We started with ${html`<a download="gsod_all_12_stations_1973_2025.csv" href="${await FileAttachment("../data/gsod_all_12_stations_1973_2025.csv").url()}">gsod_all_12_stations_1973_2025.csv</a>`}, which has one row per station per day. We used `STATION` and `DATE` to group records by station and identify each observation day, then kept only records from 1973 through 2024 because 2025 is incomplete. For each station, we excluded blank values and NOAA missing-value codes (`999.9` and `9999.9`) separately for daily highs (`MAX`) and lows (`MIN`). We calculated the daily range as `MAX − MIN` on dates when both values were valid and the high was at least as large as the low.

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

### Q2

We started with ${html`<a download="gsod_all_12_stations_1973_2025.csv" href="${await FileAttachment("../data/gsod_all_12_stations_1973_2025.csv").url()}">gsod_all_12_stations_1973_2025.csv</a>`} and kept daily records from 1973 through 2024. We excluded blank and missing-value codes from daily mean temperatures before grouping valid observations (`TEMP`) by station and calendar month. Each monthly mean uses all valid daily observations for that month across the period. We also calculated each station’s long-term mean from all valid daily observations, the difference between its warmest and coldest monthly means, and the difference between long-term means within each pair. We saved 144 station-month rows to `q2-monthly-temperatures.csv` and 12 station summary rows to `q2-pair-baselines.csv`.

[Python script for Q2](https://github.com/daeunppark/sun/blob/main/scripts/summarize-temperatures.py#L97-L125)

#### Final tables

##### Monthly temperatures

```js
const q2Monthly = await FileAttachment("../data/q2-monthly-temperatures.csv").csv({typed: true});
const q2MonthlyHeaders = {pair_id: "Pair", station_name: "Station", month: "Month", mean_temp_f: "Mean (°F)",
    valid_temp_days: "Valid days", calendar_days: "Calendar days"};
const q2MonthlyColumns = Object.keys(q2MonthlyHeaders);
const q2MonthlyCsv = d3.csvFormatRows([
  Object.values(q2MonthlyHeaders),
  ...q2Monthly.map(row => q2MonthlyColumns.map(column => row[column]))
]);
const q2MonthlyDownloadUrl = "data:text/csv;charset=utf-8," + encodeURIComponent(q2MonthlyCsv);

display(Inputs.table(q2Monthly, {
  columns: q2MonthlyColumns,
  header: q2MonthlyHeaders,
  rows: 6
}));
```

${html`<a download="q2-monthly-temperatures.csv" href="${q2MonthlyDownloadUrl}">Download q2-monthly-temperatures.csv</a>`}

##### Station and pair summary

```js
const q2Baselines = await FileAttachment("../data/q2-pair-baselines.csv").csv({typed: true});
const q2BaselinesHeaders = {pair_id: "Pair", station_name: "Station", annual_baseline_f: "Long-term mean (°F)",
    baseline_gap_f: "Pair mean difference (°F)", seasonal_span_f: "Seasonal span (°F)",
    valid_temp_days: "Valid days", calendar_days: "Calendar days"};
const q2BaselinesColumns = Object.keys(q2BaselinesHeaders);
const q2BaselinesCsv = d3.csvFormatRows([
  Object.values(q2BaselinesHeaders),
  ...q2Baselines.map(row => q2BaselinesColumns.map(column => row[column]))
]);
const q2BaselinesDownloadUrl = "data:text/csv;charset=utf-8," + encodeURIComponent(q2BaselinesCsv);

display(Inputs.table(q2Baselines, {
  columns: q2BaselinesColumns,
  header: q2BaselinesHeaders,
  rows: 6
}));
```

${html`<a download="q2-pair-baselines.csv" href="${q2BaselinesDownloadUrl}">Download q2-pair-baselines.csv</a>`}

```js
import {yearlyExtremes} from "../components/yearly-extremes-figure.js";
import {yearlyFluctuation} from "../components/fluctuation-figure.js";
const stationList = await FileAttachment("../data/q2-pair-baselines.csv").csv();
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
const q5Rows = stationList.flatMap(station => yearlyExtremes(daily, [{...station, station: station.station_name}])
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
const q6Rows = stationList.flatMap(station => yearlyFluctuation(daily, smoothed, [station])[0]
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
