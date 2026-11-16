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

[Python script for Q1](https://github.com/daeunppark/sun/blob/main/scripts/summarize-temperatures.py#L58-L76)

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

[Python script for Q2](https://github.com/daeunppark/sun/blob/main/scripts/summarize-temperatures.py#L78-L106)

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
