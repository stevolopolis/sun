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

- [Q0](./q0) plots each station's daily TEMP as recorded, with no aggregation. It is an exploration aid for choosing the Q5 and Q6 features.
- [Q1](./q1) computes quartiles for daily highs and lows separately. Daily ranges use the same day's MAX minus MIN when both are valid and MAX is at least MIN.
- [Q2](./q2) pools valid TEMP observations by calendar month across the common period. The x-axis uses January through December for both hemispheres.
- [Q6](./q6) compares each day's TEMP with the centered 15-day average (the day and 7 days on each side), computed over valid days only and left blank when fewer than 8 of the 15 days are valid. For each station and year it averages the absolute difference over days where both values exist. A year with fewer than 300 such days is shown as a gap.

The [Milestone 2 page](../milestone-2) includes the merged source dataset. The repository's README documents how to regenerate the summary tables.
