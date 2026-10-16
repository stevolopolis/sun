"""Average wait for a train at each station complex, by day type and time of day.

For a rider arriving at a random time, the expected wait for the next train is
E[h^2] / (2 E[h]) over the headways h between consecutive trains. This loader computes it
per platform and route, in a 60-minute window centred on every 15-minute step of the service
day (04:00 to 04:00), averages it over the platforms and routes of each station complex, and
takes the median over the days of each day type. Arrivals come from subwaydata.nyc.
"""

import io
import json
import sys
import tarfile
import urllib.request
from datetime import date, timedelta

import pandas as pd

FIRST_DAY, LAST_DAY = date(2026, 9, 18), date(2026, 10, 15)  # four weeks of service days
TZ = "America/New_York"
STEP, WINDOW = 15, 60  # minutes
STEPS = 24 * 60 // STEP
ROUTE_VARIANTS = {"6X": "6", "7X": "7", "FX": "F"}  # express variants ride as their base route
STATIONS_URL = "https://data.ny.gov/resource/39hk-dx4f.json?$limit=1000"
DAY_URL = "https://subwaydata.nyc/data/subwaydatanyc_{}_csv.tar.xz"


def _read_day(day):
    with urllib.request.urlopen(DAY_URL.format(day)) as response:
        archive = tarfile.open(fileobj=io.BytesIO(response.read()), mode="r:xz")
    trips = pd.read_csv(archive.extractfile(f"subwaydatanyc_{day}_trips.csv"),
                        usecols=["trip_uid", "route_id"])
    stop_times = pd.read_csv(archive.extractfile(f"subwaydatanyc_{day}_stop_times.csv"),
                             usecols=["trip_uid", "stop_id", "arrival_time", "departure_time"])
    return stop_times.merge(trips, on="trip_uid")


def _arrivals(stations):
    days = [FIRST_DAY - timedelta(1) + timedelta(i) for i in range((LAST_DAY - FIRST_DAY).days + 2)]
    events = pd.concat([_read_day(d) for d in days], ignore_index=True)  # a day before: early trips
    events["t"] = events.arrival_time.fillna(events.departure_time) / 60  # unix minutes
    events = events.dropna(subset=["t"])
    last_stop = events.groupby("trip_uid").t.transform("max")
    events = events[events.t < last_stop]  # no one boards at the last stop
    events["route_id"] = events.route_id.replace(ROUTE_VARIANTS)
    events["gtfs_stop_id"] = events.stop_id.str[:-1]
    return events.merge(stations, on="gtfs_stop_id")[["complex_id", "stop_id", "route_id", "t"]]


def _window_waits(events):
    unit = ["complex_id", "stop_id", "route_id"]  # a rider waits on one platform for one route
    events = events.sort_values(unit + ["t"])
    events["b"] = events.groupby(unit).t.shift(-1)
    gaps = events.dropna(subset=["b"])
    gaps = gaps.assign(h=gaps.b - gaps.t)
    gaps = gaps[gaps.h <= WINDOW]
    # a gap counts in the window centred on c when c - 30 <= t and b < c + 30
    last = (gaps.t + WINDOW / 2) // STEP
    parts = []
    for k in range(WINDOW // STEP):
        c = (last - k) * STEP
        keep = c > gaps.b - WINDOW / 2
        parts.append(gaps.loc[keep, unit + ["h"]].assign(c=c[keep]))
    windows = pd.concat(parts, ignore_index=True)
    windows["h2"] = windows.h ** 2
    sums = windows.groupby(unit + ["c"])[["h", "h2"]].sum()
    return (sums.h2 / (2 * sums.h)).rename("wait").reset_index()


def _typical_days(waits):
    local = pd.to_datetime(waits.c * 60, unit="s", utc=True).dt.tz_convert(TZ)
    since_four = local - pd.Timedelta(hours=4)
    waits["day"] = since_four.dt.date
    waits["step"] = (since_four.dt.hour * 60 + since_four.dt.minute) // STEP
    waits = waits[(waits.day >= FIRST_DAY) & (waits.day <= LAST_DAY)]
    per_day = waits.groupby(["complex_id", "day", "step"]).wait.mean().reset_index()
    weekday = pd.to_datetime(per_day.day).dt.weekday
    per_day["day_type"] = weekday.map({5: "saturday", 6: "sunday"}).fillna("weekday")
    n_days = per_day.groupby("day_type").day.nunique()
    typical = per_day.groupby(["complex_id", "day_type", "step"]).wait.agg(["median", "count"])
    days_of_type = n_days.reindex(typical.index.get_level_values("day_type")).values
    served = typical["count"] * 2 >= days_of_type  # a window of zero gaps has no wait
    return typical.loc[served, "median"], n_days  # a step counts when served on half its days


def main():
    stations = pd.read_json(STATIONS_URL, dtype=False)[["gtfs_stop_id", "complex_id", "borough"]]
    stations = stations[stations.borough != "SI"].drop(columns="borough")  # leave out the SIR
    typical, n_days = _typical_days(_window_waits(_arrivals(stations)))
    waits = {}
    for (complex_id, day_type), series in typical.groupby(level=["complex_id", "day_type"]):
        values = series.droplevel(["complex_id", "day_type"]).reindex(range(STEPS)).round(2)
        values = [None if pd.isna(v) else v for v in values]
        waits.setdefault(str(complex_id), {})[day_type] = values
    json.dump({"first_day": str(FIRST_DAY), "last_day": str(LAST_DAY), "start": "04:00",
               "step_minutes": STEP, "window_minutes": WINDOW, "days": n_days.to_dict(),
               "waits": waits}, sys.stdout, separators=(",", ":"))


if __name__ == "__main__":
    main()
