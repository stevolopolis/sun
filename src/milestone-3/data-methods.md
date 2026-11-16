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
- [Q3](./q3) aggregates counts and percentages of extreme heat days (`MAX > 90°F`) and freezing nights (`MIN < 32°F`) across all valid records.
- [Q4](./q4) identifies consecutive-day spells of extreme heat (`MAX ≥ 90°F`) and extreme cold (`MIN ≤ -10°F`), computing spell duration, peak temperature, mean/total severity, and post-spell thermal recovery time.

The [Milestone 2 page](../milestone-2) includes the merged source dataset. The repository's README documents how to regenerate the summary tables.

${html`<a download="q4-extreme-spells.csv" href="${await FileAttachment("../data/q4-extreme-spells.csv").url()}">Download Full Extreme Spells Dataset (CSV)</a>`}
### Q1

We started with the [merged source dataset](../milestone-2), which has one row per station per day. We used `STATION` and `DATE` to group records by station and identify each observation day, then kept only records from 1973 through 2024 because 2025 is incomplete. For each station, we excluded blank values and NOAA missing-value codes (`999.9` and `9999.9`) separately for daily highs (`MAX`) and lows (`MIN`). We calculated the daily range as `MAX − MIN` on dates when both values were valid and the high was at least as large as the low.

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