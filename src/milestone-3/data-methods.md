# Data & Methods

## Dataset

This project uses daily observations from NOAA’s [Global Surface Summary of the Day (GSOD) archive](https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/), organized by year. More information about the dataset is available on [Data.gov](https://catalog.data.gov/dataset/global-surface-summary-of-the-day-gsod).

${html`<a download="gsod_all_12_stations_1973_2025.csv" href="${await FileAttachment("../data/gsod_all_12_stations_1973_2025.csv").url()}">Download Merged 12-Station Dataset (CSV)</a>`}

We use daily NOAA Global Surface Summary of the Day (GSOD) observations for 12 stations grouped into six pairs. The analysis covers January 1, 1973 through December 31, 2024. The source file also contains part of 2025, which we excluded to use the same complete calendar years for every station.

### Raw Data Compilation & Augmentation

To construct our unified 12-station dataset (`gsod_all_12_stations_1973_2025.csv`, comprising 224,732 daily observations spanning 1973 through 2025), we extracted and processed station records from NOAA's Global Surface Summary of the Day (GSOD) archive through the following steps:

1. **Candidate Station Selection**: We screened NOAA's global station directory (`isd-history.csv`, containing over 9,000 worldwide stations) to isolate candidate observatories with near-unbroken daily observation histories from January 1973 onward, focusing on high-reliability airport weather stations and national observatories. From these candidates, we paired stations that share nearly identical long-term annual mean temperatures (differing by at most 2 °F) but exhibit distinct climate drivers (such as coastal maritime moderation vs. continental extremes, seasonal phase inversion, elevation buffers, and desert aridity).
2. **Chronological Consolidation**: For each of the 12 selected stations, 53 individual annual GSOD files (1973 through 2025) were downloaded and concatenated chronologically into single station-level CSV records, which were then merged into one multi-station dataset.
3. **Schema Harmonization**: Column headers and data fields were aligned and standardized across all 12 stations and 53 observation years. The original NOAA measurement units (Fahrenheit for temperatures) and sentinel missing-data flags (`999.9` and `9999.9`) were preserved intact so that downstream analyses could explicitly handle missing measurements without distortion.
4. **Structural Augmentation (Pair Metadata Tags)**: To streamline paired comparisons and filtering across research questions without requiring recurring lookup joins, three metadata columns were tagged directly onto every daily record:
   - `PAIR_ID`: Numeric identifier indicating which of the six matched pairs the station belongs to (`1` through `6`).
   - `PAIR_THEME`: Descriptive label for the climate contrast being evaluated (e.g., *Temperate Coastal Maritime Fog Belt vs. Continental Severe Seasons*).
   - `STATION_ROLE`: Categorical assignment (`Station A` vs. `Station B`) to consistently differentiate the baseline/maritime station from the comparison/continental station across visual encodings.

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

- [Q1](#q1) computes quartiles for daily highs and lows separately. Daily ranges use the same day's MAX minus MIN when both are valid and MAX is at least MIN.
- [Q2](#q2) pools valid TEMP observations by calendar month across the common period. The x-axis uses January through December for both hemispheres.
- [Q3](#q3-extreme-temperature-frequency) aggregates counts and percentages of extreme heat days (`MAX > 90°F`) and freezing nights (`MIN < 32°F`) across all valid records.
- [Q4](#q4-extreme-temperature-duration-and-spells) identifies consecutive-day spells of extreme heat (`MAX ≥ 90°F`) and extreme cold (`MIN ≤ -10°F`), computing spell duration, peak temperature, mean/total severity, and post-spell thermal recovery time.
- [Q5](#q5) takes the highest, average, and lowest daily TEMP for each station and calendar year. A station-year with fewer than 300 valid TEMP days is treated as missing.
- [Q6](#q6) takes, for each station and calendar year, the largest absolute difference between a day's TEMP and its centered 15-day average. A station-year with fewer than 300 usable days is treated as missing.

The [Milestone 2 page](../milestone-2) includes the merged source dataset. The repository's README documents how to regenerate the summary tables.

---

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

---

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

---

## Q3: Extreme Temperature Frequency

### Methodology & Data Transformations

To evaluate how frequently each location experiences severe thermal stress, we analyzed daily temperature bounds from the merged 12-station NOAA GSOD dataset spanning 1973 through 2025 (`src/data/gsod_all_12_stations_1973_2025.csv`). The processing and aggregation workflow is implemented in [`scripts/export-q3-extremes.js`](https://github.com/daeunppark/sun/blob/main/scripts/export-q3-extremes.js) (runnable via `npm run export:q3`).

The transformation pipeline performs the following steps:
1. **Streaming Data Ingestion & Field Mapping**: Reads the merged dataset line-by-line using a Node.js streaming interface (`readline`), mapping column headers for station identifiers (`PAIR_ID`, `STATION_ROLE`, `NAME`, `PAIR_THEME`) and daily extreme temperature readings (`MAX`, `MIN`).
2. **Missing-Value Filtering**: Identifies and excludes invalid, non-finite, and NOAA sentinel missing-value codes (`999.9`). Valid daily record counters (`VALID_MAX_DAYS` and `VALID_MIN_DAYS`) track usable measurements per station.
3. **Threshold Classification**:
   - **Extremely Hot Days (`HOT_DAYS`)**: Counted for each day where daily maximum temperature strictly exceeds 90 °F (`MAX > 90°F`).
   - **Freezing Nights (`COLD_NIGHTS`)**: Counted for each day where daily minimum temperature strictly drops below 32 °F (`MIN < 32°F`).
4. **Coverage-Adjusted Percentage Normalization**: Because stations have differing numbers of operational recording days across the multi-decade window (e.g., Addis Ababa Bole International has 13,349 valid observation days compared to 19,232 days for most US stations), the script computes normalized percentages:
   - `HOT_DAY_PERCENT` = `100 * HOT_DAYS / VALID_MAX_DAYS` (rounded to 2 decimal places)
   - `COLD_NIGHT_PERCENT` = `100 * COLD_NIGHTS / VALID_MIN_DAYS` (rounded to 2 decimal places)
5. **Output Generation**: Exports the summarized station table to `src/data/q3-extreme-temperatures.csv`, sorted by station pair and role.

**Relevant transformation file:** [`scripts/export-q3-extremes.js`](https://github.com/daeunppark/sun/blob/main/scripts/export-q3-extremes.js)

### Q3 Sample Data Table

```js
import {pairs, selectStationRows} from "../components/station-pairs.js";
const extremes = await FileAttachment("../data/q3-extreme-temperatures.csv").csv({typed: true});
```

```js
const pairQ3 = view(Inputs.select(["All pairs", ...pairs], {value: "All pairs", label: "Station pair"}));
```

```js
const selectedQ3 = rows => selectStationRows(rows, baselines, pairQ3);
```

```js
view(Inputs.table(selectedQ3(extremes), {
  columns: [
    "PAIR_ID",
    "STATION_ROLE",
    "STATION",
    "HOT_DAYS",
    "COLD_NIGHTS",
    "VALID_MAX_DAYS",
    "VALID_MIN_DAYS",
    "HOT_DAY_PERCENT",
    "COLD_NIGHT_PERCENT"
  ],
  header: {
    PAIR_ID: "Pair",
    STATION_ROLE: "Station Role",
    STATION: "Location",
    HOT_DAYS: "Hot Days (>90°F)",
    COLD_NIGHTS: "Freezing Nights (<32°F)",
    VALID_MAX_DAYS: "Valid MAX Records",
    VALID_MIN_DAYS: "Valid MIN Records",
    HOT_DAY_PERCENT: "Hot Days (%)",
    COLD_NIGHT_PERCENT: "Freezing Nights (%)"
  },
  format: {
    HOT_DAY_PERCENT: d => `${d}%`,
    COLD_NIGHT_PERCENT: d => `${d}%`
  },
  rows: 12,
}))
```

${html`<a download="q3-extreme-temperatures.csv" href="${await FileAttachment("../data/q3-extreme-temperatures.csv").url()}">Download Full Data Table (CSV)</a>`}

Extremely hot days are defined as days where daily maximum temperature exceeds 90 °F (`MAX > 90°F`). Freezing nights are defined as days where daily minimum temperature drops below 32 °F (`MIN < 32°F`). Missing or invalid measurements (`999.9`) are excluded.

---

## Q4: Extreme Temperature Duration & Spells

### Methodology & Data Transformations

To assess the duration, persistence, and recovery characteristics of extreme events, we analyzed multi-day spells of extreme temperatures across stations. The complete extraction, spell detection algorithm, and metric calculations are implemented in [`scripts/export-q4-spells.js`](https://github.com/daeunppark/sun/blob/main/scripts/export-q4-spells.js) (runnable via `npm run export:q4`).

The transformation pipeline performs the following steps:
1. **Cleaning and Chronological Ordering**: Parses daily dates into standardized UTC timestamps, filters missing and sentinel values (`999.9`, `9999.9`, non-numeric, or ≥ 200) for daily mean (`TEMP`), maximum (`MAX`), and minimum (`MIN`) temperatures, and sorts records chronologically per station.
2. **Consecutive Run / Spell Detection**:
   - **Extreme Heat Spell**: An unbroken sequence of consecutive calendar days where daily maximum temperature reaches or exceeds 90 °F (`MAX ≥ 90°F`).
   - **Extreme Cold Spell**: An unbroken sequence of consecutive calendar days where daily minimum temperature drops to or below -10 °F (`MIN ≤ -10°F`).
   - A spell continues only if adjacent extreme observations occur on consecutive calendar days (a 1-day step: 24 hours). Any missing day or temperature falling within normal bounds terminates the spell.
3. **Spell Intensity & Severity Quantification**:
   - **Peak Temperature (`PEAK_TEMP`)**: The maximum `MAX` recorded during a heat spell, or the minimum `MIN` recorded during a cold snap.
   - **Average Severity (`AVG_SEVERITY`)**: The average daily degrees beyond the extreme threshold: `MAX - 90°F` for heat spells, and `-10°F - MIN` for cold snaps.
   - **Total Severity (`TOTAL_SEVERITY`)**: Cumulative degree-days over the entire spell duration (the sum of daily severities).
4. **Thermal Recovery Measurement (`RECOVERY_DAYS`)**:
   - For each identified spell, the script establishes a pre-event baseline temperature using the 7-day trailing mean of `TEMP` immediately preceding the spell start date.
   - It searches up to 30 days after the spell's end date for the first day where the station's daily mean temperature returns within 2 °F of that pre-spell baseline (`|TEMP - baseline| ≤ 2°F`).
   - The elapsed calendar days from the spell end date to this return date are recorded as `RECOVERY_DAYS`.
5. **Station-Level Aggregation & Time Series Export**:
   - Computes station summary statistics by extreme event type (spell count, total extreme days, average duration, longest spell, average severity, and average recovery days).
   - Exports three distinct data artifacts:
     - `src/data/q4-spell-summary.csv`: Summary metrics per station and extreme event type (24 rows).
     - `src/data/q4-extreme-spells.csv`: Detailed event-level records for all 3,536 identified spells.
     - `src/data/q4-daily-temperatures.csv`: Cleaned daily mean temperatures formatted for the interactive timeline visualization's multi-scale temporal windowing (day, week, month, season, year).

**Relevant transformation file:** [`scripts/export-q4-spells.js`](https://github.com/daeunppark/sun/blob/main/scripts/export-q4-spells.js)

### Q4 Sample Data Tables

```js
const spellSummary = await FileAttachment("../data/q4-spell-summary.csv").csv({typed: true});
const extremeSpells = await FileAttachment("../data/q4-extreme-spells.csv").csv({typed: true});
```

```js
const pairQ4 = view(Inputs.select(pairs, {value: pairs[0], label: "Station pair"}));
```

```js
const selectedSummary = selectStationRows(spellSummary, baselines, pairQ4);
const selectedSpells = selectStationRows(extremeSpells, baselines, pairQ4);
```

#### Station Spell Summary

```js
view(Inputs.table(selectedSummary, {
  columns: [
    "STATION",
    "EXTREME_TYPE",
    "SPELL_COUNT",
    "TOTAL_EXTREME_DAYS",
    "AVG_DURATION",
    "LONGEST_SPELL",
    "AVG_SEVERITY",
    "AVG_RECOVERY"
  ],
  header: {
    STATION: "Location",
    EXTREME_TYPE: "Extreme Type",
    SPELL_COUNT: "Spells",
    TOTAL_EXTREME_DAYS: "Total Days",
    AVG_DURATION: "Avg Duration (Days)",
    LONGEST_SPELL: "Longest Spell (Days)",
    AVG_SEVERITY: "Avg Severity (°F)",
    AVG_RECOVERY: "Avg Recovery (Days)"
  },
  rows: 4
}))
```

${html`<a download="q4-spell-summary.csv" href="${await FileAttachment("../data/q4-spell-summary.csv").url()}">Download Station Spell Summary (CSV)</a>`}

An extreme heat spell is defined as consecutive days with daily maximum temperature reaching or exceeding 90 °F (`MAX ≥ 90°F`). An extreme cold spell is defined as consecutive days with daily minimum temperature falling to or below -10 °F (`MIN ≤ -10°F`). Recovery measures the days until daily temperature returns to within 2 °F of the pre-spell 7-day baseline.

#### Individual Extreme Spells

```js
view(Inputs.table(selectedSpells, {
  columns: [
    "STATION",
    "EXTREME_TYPE",
    "START_DATE",
    "END_DATE",
    "DURATION_DAYS",
    "PEAK_TEMP",
    "AVG_SEVERITY",
    "TOTAL_SEVERITY",
    "RECOVERY_DAYS"
  ],
  header: {
    STATION: "Location",
    EXTREME_TYPE: "Extreme Type",
    START_DATE: "Start Date",
    END_DATE: "End Date",
    DURATION_DAYS: "Duration (Days)",
    PEAK_TEMP: "Peak (°F)",
    AVG_SEVERITY: "Avg Severity (°F)",
    TOTAL_SEVERITY: "Total Severity (°F-days)",
    RECOVERY_DAYS: "Recovery (Days)"
  },
  rows: 6
}))
```

${html`<a download="q4-extreme-spells.csv" href="${await FileAttachment("../data/q4-extreme-spells.csv").url()}">Download Full Extreme Spells Dataset (CSV)</a>`}

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

## Q5

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

## Q6

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
