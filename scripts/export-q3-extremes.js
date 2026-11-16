import fs from "node:fs";
import readline from "node:readline";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.resolve(__dirname, "../src/data/gsod_all_12_stations_1973_2025.csv");
const outputPath = path.resolve(__dirname, "../src/data/q3-extreme-temperatures.csv");

async function exportExtremes() {
  const fileStream = fs.createReadStream(inputPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let header = null;
  let colIndex = {};
  const extreme_data = new Map();

  for await (const line of rl) {
    if (!line.trim()) continue;
    // Basic CSV row parsing
    if (!header) {
      header = parseCSVLine(line);
      header.forEach((col, idx) => {
        colIndex[col.trim()] = idx;
      });
      continue;
    }

    const row = parseCSVLine(line);
    const pair = row[colIndex["PAIR_ID"]];
    const role = row[colIndex["STATION_ROLE"]];
    const station = row[colIndex["NAME"]] || row[colIndex["STATION"]];
    const theme = row[colIndex["PAIR_THEME"]];

    const maxRaw = row[colIndex["MAX"]];
    const minRaw = row[colIndex["MIN"]];
    const max = maxRaw !== undefined && maxRaw !== "" ? Number(maxRaw) : NaN;
    const min = minRaw !== undefined && minRaw !== "" ? Number(minRaw) : NaN;

    if (pair == null || !role) continue;

    const key = `${pair}-${role}`;

    if (!extreme_data.has(key)) {
      extreme_data.set(key, {
        pair,
        theme,
        role,
        station,
        hot: 0,
        cold: 0,
        validMax: 0,
        validMin: 0,
      });
    }

    const s = extreme_data.get(key);
    if (!s.theme && theme) {
      s.theme = theme;
    }

    // Extremely hot days (MAX > 90°F)
    if (Number.isFinite(max) && max !== 999.9) {
      s.validMax++;
      if (max > 90) s.hot++;
    }

    // Freezing nights (MIN < 32°F)
    if (Number.isFinite(min) && min !== 999.9) {
      s.validMin++;
      if (min < 32) s.cold++;
    }
  }

  const extreme_data_preview = Array.from(extreme_data.values())
    .map(d => ({
      PAIR_ID: d.pair,
      PAIR_THEME: d.theme || "",
      STATION_ROLE: d.role,
      STATION: d.station,

      HOT_DAYS: d.hot,
      COLD_NIGHTS: d.cold,

      VALID_MAX_DAYS: d.validMax,
      VALID_MIN_DAYS: d.validMin,

      HOT_DAY_PERCENT: d.validMax
        ? +(100 * d.hot / d.validMax).toFixed(2)
        : null,

      COLD_NIGHT_PERCENT: d.validMin
        ? +(100 * d.cold / d.validMin).toFixed(2)
        : null,
    }))
    .sort((a, b) =>
      (+a.PAIR_ID - +b.PAIR_ID) ||
      a.STATION_ROLE.localeCompare(b.STATION_ROLE)
    );

  const columns = [
    "PAIR_ID",
    "PAIR_THEME",
    "STATION_ROLE",
    "STATION",
    "HOT_DAYS",
    "COLD_NIGHTS",
    "VALID_MAX_DAYS",
    "VALID_MIN_DAYS",
    "HOT_DAY_PERCENT",
    "COLD_NIGHT_PERCENT",
  ];

  const csvRows = [
    columns.join(","),
    ...extreme_data_preview.map(row =>
      columns.map(col => {
        const val = row[col] === null || row[col] === undefined ? "" : String(row[col]);
        return val.includes(",") || val.includes('"') || val.includes("\n")
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(",")
    ),
  ];

  fs.writeFileSync(outputPath, csvRows.join("\n") + "\n", "utf8");
  console.log(`Saved ${extreme_data_preview.length} rows to ${outputPath}`);
}

function parseCSVLine(text) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

exportExtremes().catch(console.error);
