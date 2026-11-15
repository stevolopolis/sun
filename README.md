# Sun

Team 7 · Daeun Park, Abrar Zaki, Steven Tin Sui Luo

An Observable Framework app comparing daily and seasonal temperatures for six station pairs using NOAA GSOD observations.

## Run locally

With Node.js 18 or later:

```sh
npm ci
npm run dev
```

Open the [Milestone 3 overview](http://localhost:3000/milestone-3) after the preview server starts. The overview and the Milestone 3 sidebar link to all six question pages.

On Q1 and Q2, use **Station pair** to update the sample tables and chart. Expand **View D3 source code** below the chart to read the implementation. The explanation below the code describes what the chart shows.

Run `npm run build` to create the static site in `dist/`.

## Temperature analysis tables

Regenerate the three tables from the supplied 12-station NOAA GSOD merged CSV:

```sh
python3 scripts/summarize-temperatures.py /path/to/gsod_all_12_stations_1973_2025.csv
```

Both questions use January 1973 through December 2024 (52 complete calendar years, 18,993 calendar days per station). Partial 2025 is excluded. Temperatures are in °F. Blank values and the missing-value codes `999.9` and `9999.9` are excluded separately for `MAX`, `MIN`, and `TEMP`. Counts distinguish days with a source row from days with a usable value.

- **Q1** [Daily temperature distributions](src/data/q1-temperature-distributions.csv) has one row per station and metric, with valid-day counts, observed extremes, inclusive quartiles, IQR, and Tukey whiskers. Use a shared °F domain for the MAX and MIN boxplots across station pairs. The daily range is calculated from same-day MAX minus MIN when both values are valid and MAX is at least MIN.
- **Q2** [Monthly temperatures](src/data/q2-monthly-temperatures.csv) has one row per station and calendar month. Each mean pools valid daily TEMP observations for that month across the analysis period. January through December stay in calendar order at every station, so cross-hemisphere peak timing is visible.
- **Q2** [Pair baselines and coverage](src/data/q2-pair-baselines.csv) lists station IDs, daily-observation-weighted mean TEMP over the analysis period, the absolute pair gap, peak and trough months, and seasonal span (warmest minus coldest monthly mean). The working match criterion is an absolute baseline gap of at most 2 °F. The coverage audit counts absent calendar dates separately from recorded days with missing TEMP. Bole has 13,114 of 18,993 days (69.0% coverage), so its baseline and seasonal curve reflect a substantially smaller set of observations than Atlanta's.
