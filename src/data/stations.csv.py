"""Subway station complexes: name, borough, lines and location (Staten Island Railway left out)."""

import sys

import pandas as pd

STATIONS_URL = "https://data.ny.gov/resource/39hk-dx4f.json?$limit=1000"


def _union(values):
    return " ".join(dict.fromkeys(" ".join(values).split()))  # keep first-seen order


stations = pd.read_json(STATIONS_URL, dtype=False)
stations = stations[stations.borough != "SI"]
stations[["lat", "lon"]] = stations[["gtfs_latitude", "gtfs_longitude"]].astype(float)
complexes = stations.groupby("complex_id").agg(
    name=("stop_name", lambda s: " / ".join(dict.fromkeys(s))),
    borough=("borough", "first"),
    lines=("daytime_routes", _union),
    lat=("lat", "mean"),
    lon=("lon", "mean"),
)
complexes.round({"lat": 5, "lon": 5}).to_csv(sys.stdout)
