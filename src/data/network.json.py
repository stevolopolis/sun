"""Subway track network as straight links between consecutive stations, from the MTA's GTFS."""

import io
import json
import sys
import urllib.request
import zipfile

import pandas as pd

GTFS_URL = "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip"

with urllib.request.urlopen(GTFS_URL) as response:
    gtfs = zipfile.ZipFile(io.BytesIO(response.read()))
stops = pd.read_csv(gtfs.open("stops.txt"), dtype=str)
trips = pd.read_csv(gtfs.open("trips.txt"), dtype=str, usecols=["trip_id", "route_id"])
stop_times = pd.read_csv(gtfs.open("stop_times.txt"), dtype={"trip_id": str, "stop_id": str},
                         usecols=["trip_id", "stop_id", "stop_sequence"])

stop_times = stop_times[stop_times.trip_id.isin(trips.trip_id[trips.route_id != "SI"])]  # no SIR
station = stops.parent_station.fillna(stops.stop_id).set_axis(stops.stop_id)
stop_times = stop_times.sort_values(["trip_id", "stop_sequence"])
stop_times["a"] = stop_times.stop_id.map(station)
stop_times["b"] = stop_times.groupby("trip_id").a.shift(-1)
pairs = stop_times.dropna(subset=["b"])[["a", "b"]]
links = pd.DataFrame({"a": pairs.min(axis=1), "b": pairs.max(axis=1)}).drop_duplicates()
coords = stops.set_index("stop_id")[["stop_lon", "stop_lat"]].astype(float).round(5)
lines = [[coords.loc[a].tolist(), coords.loc[b].tolist()] for a, b in links.itertuples(index=False)]
json.dump({"type": "Feature", "properties": {},
           "geometry": {"type": "MultiLineString", "coordinates": lines}},
          sys.stdout, separators=(",", ":"))
