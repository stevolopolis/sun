// NYC borough outlines, clipped to the shoreline and simplified, as TopoJSON.
import {topology} from "topojson-server";
import {presimplify, quantile, simplify} from "topojson-simplify";

const url = "https://data.cityofnewyork.us/resource/gthc-hcne.geojson";
const response = await fetch(url);
if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
const boroughs = await response.json();
for (const feature of boroughs.features) {
  feature.properties = {name: feature.properties.boroname}; // keep only the borough name
}

const topo = presimplify(topology({boroughs}, 1e5));
const simplified = simplify(topo, quantile(topo, 0.05)); // keep the top 5% of points
process.stdout.write(JSON.stringify(simplified));
