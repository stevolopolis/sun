"""Generate the Q1 and Q2 visualization tables from the merged GSOD CSV."""
import calendar
import csv
import math
import statistics
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

START, END = date(1973, 1, 1), date(2024, 12, 31)
EXPECTED = (END - START).days + 1
TOLERANCE_F = 2
OUTPUT = Path(__file__).resolve().parents[1] / "src" / "data"


def temperature(raw):
    value = float(raw) if raw.strip() else math.nan
    return value if math.isfinite(value) and value not in (999.9, 9999.9) else None


def mean(values):
    return round(statistics.mean(values), 4)


def write_table(name, rows):
    with (OUTPUT / name).open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def summarize(source):
    stations = {}
    with source.open(newline="", encoding="utf-8-sig") as file:
        for row in csv.DictReader(file):
            day = date.fromisoformat(row["DATE"])
            if not START <= day <= END:
                continue
            station_id = row["STATION"]
            metadata, days = stations.setdefault(station_id, ({
                "pair_id": int(row["PAIR_ID"]), "station_role": row["STATION_ROLE"],
                "station_id": station_id, "station_name": row["NAME"],
                "latitude": float(row["LATITUDE"]),
            }, {}))
            if day in days:
                raise ValueError(f"Duplicate station-day: {station_id} {day}")
            days[day] = {field: temperature(row[field]) for field in ("MAX", "MIN", "TEMP")}

    if len(stations) != 12:
        raise ValueError(f"Expected 12 stations, got {len(stations)}")

    distributions, months, pairs = [], [], []
    pair_members = defaultdict(list)
    for metadata, days in sorted(stations.values(), key=lambda station: (
        station[0]["pair_id"], station[0]["station_role"]
    )):
        ranges = []
        for record in days.values():
            high, low = record["MAX"], record["MIN"]
            if high is not None and low is not None and high >= low:
                ranges.append(high - low)

        for metric in ("MAX", "MIN", "DAILY_RANGE"):
            values = sorted(ranges if metric == "DAILY_RANGE" else (
                record[metric] for record in days.values() if record[metric] is not None
            ))
            q1, median, q3 = statistics.quantiles(values, n=4, method="inclusive")
            iqr = q3 - q1
            whisker_low = next(value for value in values if value >= q1 - 1.5 * iqr)
            whisker_high = next(value for value in reversed(values) if value <= q3 + 1.5 * iqr)
            distributions.append(dict(metadata, metric=metric, calendar_days=EXPECTED,
                recorded_days=len(days), valid_days=len(values), min_f=round(values[0], 4),
                q1_f=round(q1, 4), median_f=round(median, 4), q3_f=round(q3, 4),
                max_f=round(values[-1], 4), iqr_f=round(iqr, 4),
                whisker_low_f=round(whisker_low, 4), whisker_high_f=round(whisker_high, 4)))

        station_months = []
        for month in range(1, 13):
            records = [record for day, record in days.items() if day.month == month]
            values = [record["TEMP"] for record in records if record["TEMP"] is not None]
            expected = sum(calendar.monthrange(year, month)[1] for year in range(START.year, END.year + 1))
            station_months.append(dict(metadata, month=month, calendar_days=expected,
                recorded_days=len(records), valid_temp_days=len(values), mean_temp_f=mean(values)))
        months.extend(station_months)
        peak = max(station_months, key=lambda row: row["mean_temp_f"])
        trough = min(station_months, key=lambda row: row["mean_temp_f"])
        temps = [record["TEMP"] for record in days.values() if record["TEMP"] is not None]
        pair_members[metadata["pair_id"]].append(dict(metadata,
            annual_baseline_f=statistics.mean(temps), recorded_days=len(days),
            valid_temp_days=len(temps), peak_month=peak["month"], trough_month=trough["month"],
            seasonal_span_f=round(peak["mean_temp_f"] - trough["mean_temp_f"], 4)))

    for pair_id, members in sorted(pair_members.items()):
        if [member["station_role"] for member in members] != ["Station A", "Station B"]:
            raise ValueError(f"Expected stations A and B for pair {pair_id}")
        gap = abs(members[0]["annual_baseline_f"] - members[1]["annual_baseline_f"])
        for member in members:
            pairs.append(dict(member, annual_baseline_f=round(member["annual_baseline_f"], 4),
                calendar_days=EXPECTED, absent_days=EXPECTED - member["recorded_days"],
                temp_missing_on_recorded_days=member["recorded_days"] - member["valid_temp_days"],
                baseline_gap_f=round(gap, 4), within_2f=int(gap <= TOLERANCE_F)))

    write_table("q1-temperature-distributions.csv", distributions)
    write_table("q2-monthly-temperatures.csv", months)
    write_table("q2-pair-baselines.csv", pairs)


if __name__ == "__main__":
    summarize(Path(sys.argv[1]))
