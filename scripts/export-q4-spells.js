import fs from "node:fs";
import readline from "node:readline";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.resolve(__dirname, "../src/data/gsod_all_12_stations_1973_2025.csv");
const spellsPath = path.resolve(__dirname, "../src/data/q4-extreme-spells.csv");
const summaryPath = path.resolve(__dirname, "../src/data/q4-spell-summary.csv");
const dailyPath = path.resolve(__dirname, "../src/data/q4-daily-temperatures.csv");

const HOT_THRESHOLD = 90;
const COLD_THRESHOLD = -10;
const DAY = 24 * 60 * 60 * 1000;

function parseDate(value) {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  const parts = s.split("-");
  return new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
}

function cleanTemp(val) {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) && n !== 999.9 && n !== 9999.9 && n < 200 ? n : null;
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

function identifySpells(rows) {
  const spells = [];
  const types = [
    {
      type: "heat",
      variable: "max",
      threshold: HOT_THRESHOLD,
      condition: value => value >= HOT_THRESHOLD,
      severity: value => value - HOT_THRESHOLD,
    },
    {
      type: "cold",
      variable: "min",
      threshold: COLD_THRESHOLD,
      condition: value => value <= COLD_THRESHOLD,
      severity: value => COLD_THRESHOLD - value,
    },
  ];

  types.forEach(config => {
    let currentSpell = [];

    function finishSpell() {
      if (!currentSpell.length) return;
      const values = currentSpell.map(d => d[config.variable]);
      const severityValues = values.map(config.severity);
      const peak = config.type === "heat" ? Math.max(...values) : Math.min(...values);

      spells.push({
        pair: currentSpell[0].pair,
        role: currentSpell[0].role,
        station: currentSpell[0].station,
        theme: currentSpell[0].theme,
        type: config.type,
        start: currentSpell[0].date,
        end: currentSpell[currentSpell.length - 1].date,
        duration: currentSpell.length,
        peak,
        meanSeverity: severityValues.reduce((a, b) => a + b, 0) / severityValues.length,
        totalSeverity: severityValues.reduce((a, b) => a + b, 0),
      });
      currentSpell = [];
    }

    rows.forEach(d => {
      const value = d[config.variable];
      const isExtreme = value !== null && config.condition(value);
      const previous = currentSpell.length ? currentSpell[currentSpell.length - 1] : null;
      const consecutive = previous && (+d.date - +previous.date === DAY);

      if (isExtreme) {
        if (currentSpell.length && !consecutive) {
          finishSpell();
        }
        currentSpell.push(d);
      } else {
        finishSpell();
      }
    });

    finishSpell();
  });

  return spells;
}

function calculateRecovery(spell, rows) {
  const before = rows.filter(d => d.date < spell.start && d.temp !== null);
  if (before.length < 7) return null;
  const last7 = before.slice(-7);
  const baseline = last7.reduce((a, b) => a + b.temp, 0) / last7.length;

  const recoveryDate = rows.find(d => {
    const daysAfter = (+d.date - +spell.end) / DAY;
    return daysAfter > 0 && daysAfter <= 30 && d.temp !== null && Math.abs(d.temp - baseline) <= 2;
  });

  return recoveryDate ? Math.round((+recoveryDate.date - +spell.end) / DAY) : null;
}

function escapeCSV(val) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

async function exportSpells() {
  const fileStream = fs.createReadStream(inputPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let header = null;
  let colIndex = {};
  const cleaned_data = [];
  const dailyRows = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
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
    const dateStr = row[colIndex["DATE"]] ? row[colIndex["DATE"]].slice(0, 10) : "";
    const date = parseDate(dateStr);

    if (!pair || pair === "null" || !role || !date || isNaN(+date)) continue;

    const temp = cleanTemp(row[colIndex["TEMP"]]);
    const max = cleanTemp(row[colIndex["MAX"]]);
    const min = cleanTemp(row[colIndex["MIN"]]);

    cleaned_data.push({
      pair: String(pair),
      role,
      station,
      theme,
      date,
      dateStr,
      temp,
      max,
      min,
    });

    if (temp !== null) {
      dailyRows.push({
        PAIR_ID: pair,
        STATION_ROLE: role,
        DATE: dateStr,
        TEMP: temp.toFixed(1),
      });
    }
  }

  cleaned_data.sort((a, b) => a.date - b.date);

  // Group by pair and role
  const pairMap = new Map();
  cleaned_data.forEach(d => {
    if (!pairMap.has(d.pair)) pairMap.set(d.pair, new Map());
    const roleMap = pairMap.get(d.pair);
    if (!roleMap.has(d.role)) roleMap.set(d.role, []);
    roleMap.get(d.role).push(d);
  });

  const all_spells = [];
  for (const [pair, stations] of pairMap) {
    for (const [role, rows] of stations) {
      const spells = identifySpells(rows);
      spells.forEach(s => {
        s.recovery = calculateRecovery(s, rows);
        all_spells.push(s);
      });
    }
  }

  all_spells.sort((a, b) => a.start - b.start);

  // Format spells CSV
  const spellColumns = [
    "PAIR_ID",
    "PAIR_THEME",
    "STATION_ROLE",
    "STATION",
    "EXTREME_TYPE",
    "START_DATE",
    "END_DATE",
    "DURATION_DAYS",
    "PEAK_TEMP",
    "AVG_SEVERITY",
    "TOTAL_SEVERITY",
    "RECOVERY_DAYS",
  ];

  const spellCsvLines = [
    spellColumns.join(","),
    ...all_spells.map(s => {
      const startStr = s.start.toISOString().slice(0, 10);
      const endStr = s.end.toISOString().slice(0, 10);
      return [
        s.pair,
        escapeCSV(s.theme || ""),
        s.role,
        escapeCSV(s.station),
        s.type === "heat" ? "Extreme heat" : "Extreme cold",
        startStr,
        endStr,
        s.duration,
        s.peak.toFixed(1),
        s.meanSeverity.toFixed(1),
        s.totalSeverity.toFixed(1),
        s.recovery !== null ? s.recovery : "",
      ].join(",");
    }),
  ];
  fs.writeFileSync(spellsPath, spellCsvLines.join("\n") + "\n", "utf8");
  console.log(`Saved ${all_spells.length} spells to ${spellsPath}`);

  // Summary per station
  const summaryColumns = [
    "PAIR_ID",
    "PAIR_THEME",
    "STATION_ROLE",
    "STATION",
    "EXTREME_TYPE",
    "SPELL_COUNT",
    "TOTAL_EXTREME_DAYS",
    "AVG_DURATION",
    "LONGEST_SPELL",
    "AVG_SEVERITY",
    "AVG_RECOVERY",
  ];

  const summaryRows = [];
  for (const [pair, stations] of [...pairMap.entries()].sort((a, b) => +a[0] - +b[0])) {
    for (const [role, rows] of [...stations.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const station = rows[0]?.station;
      const theme = rows[0]?.theme;
      ["heat", "cold"].forEach(type => {
        const spells = all_spells.filter(s => s.pair === pair && s.role === role && s.type === type);
        const durations = spells.map(s => s.duration);
        const severities = spells.map(s => s.meanSeverity);
        const recoveries = spells.map(s => s.recovery).filter(r => r != null);

        summaryRows.push({
          PAIR_ID: pair,
          PAIR_THEME: theme,
          STATION_ROLE: role,
          STATION: station,
          EXTREME_TYPE: type === "heat" ? "Extreme heat" : "Extreme cold",
          SPELL_COUNT: spells.length,
          TOTAL_EXTREME_DAYS: durations.reduce((a, b) => a + b, 0),
          AVG_DURATION: spells.length ? +(durations.reduce((a, b) => a + b, 0) / spells.length).toFixed(1) : 0,
          LONGEST_SPELL: spells.length ? Math.max(...durations) : 0,
          AVG_SEVERITY: spells.length ? +(severities.reduce((a, b) => a + b, 0) / spells.length).toFixed(1) : 0,
          AVG_RECOVERY: recoveries.length ? +(recoveries.reduce((a, b) => a + b, 0) / recoveries.length).toFixed(1) : "",
        });
      });
    }
  }

  const summaryCsvLines = [
    summaryColumns.join(","),
    ...summaryRows.map(row =>
      summaryColumns.map(col => escapeCSV(row[col])).join(",")
    ),
  ];
  fs.writeFileSync(summaryPath, summaryCsvLines.join("\n") + "\n", "utf8");
  console.log(`Saved ${summaryRows.length} summary rows to ${summaryPath}`);

  // Daily temperatures CSV
  const dailyColumns = ["PAIR_ID", "STATION_ROLE", "DATE", "TEMP"];
  const dailyCsvLines = [
    dailyColumns.join(","),
    ...dailyRows.map(r => `${r.PAIR_ID},${r.STATION_ROLE},${r.DATE},${r.TEMP}`),
  ];
  fs.writeFileSync(dailyPath, dailyCsvLines.join("\n") + "\n", "utf8");
  console.log(`Saved ${dailyRows.length} daily rows to ${dailyPath}`);
}

exportSpells().catch(console.error);
