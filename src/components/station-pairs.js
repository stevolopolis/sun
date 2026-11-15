const cities = ["Arcata", "Des Moines", "San Francisco", "St. Louis", "Seattle", "Christchurch",
  "Addis Ababa", "Atlanta", "Reykjavík", "Caribou", "Tucson", "New Orleans"];
export const pairs = cities.filter((_, i) => i % 2 === 0).map((city, i) => `${city} / ${cities[2 * i + 1]}`);

export function selectStationRows(rows, baselines, pair) {
  const pairId = String(pairs.indexOf(pair) + 1);
  const stations = new Map(baselines.map((d, i) => [d.station_id, cities[i]]));
  return rows.filter(d => d.pair_id === pairId)
    .map(d => ({...d, station: stations.get(d.station_id)}));
}
