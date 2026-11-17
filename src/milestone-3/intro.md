# Project Introduction

**Team SUN (Team 7)** · Daeun Park, Abrar Zaki, and Steven Tin Sui Luo

> **Anchor Question:** *Do similar average temperatures hide different weather extremes?*

## Project Overview

Annual mean temperature is one of the most widely cited climate statistics, yet relying on it alone can be deeply misleading. Two locations on opposite sides of the globe can share nearly identical multi-decade average temperatures while experiencing fundamentally different climates: one may enjoy year-round maritime stability, while the other endures scorching summer heatwaves, sub-zero winter blizzards, or wide day-to-night temperature swings.

This project investigates the limitations of mean temperature as a standalone climate indicator. Using daily observation records from the NOAA Global Surface Summary of the Day (GSOD) archive spanning **1973 through 2024** (over 50 continuous years per station), we compare **six carefully matched pairs of weather stations**. Each pair shares nearly the same long-term average temperature (differing by less than 0.5 °F), but represents contrasting geographical and climatic environments.

Across our analysis, we investigate:
- **[Q1: Temperature Distributions](./q1)** — How daily high, low, and diurnal temperature ranges spread across locations.
- **[Q2: Seasonal Patterns](./q2)** — How monthly seasonal temperature amplitudes contrast despite identical annual averages.
- **[Q3: Extreme Frequency](./q3)** — How often each station records extreme heat days (>90 °F) or freezing nights (<32 °F).
- **[Q4: Extreme Duration](./q4)** — How long multi-day heatwaves and severe cold snaps persist, and how rapidly temperatures recover.
- **[Q5: Extreme Trends](./q5)** — How extreme temperature patterns have evolved across the five-decade observation window.
- **[Q6: Seasonal Transitions](./q6)** — How stations differ in the timing, rate, and volatility of temperature fluctuations.

---

## Station Pairs & Climate Contrasts

Candidate stations were selected from over 9,000 global observatories in NOAA's historical directory (`isd-history.csv`), focusing on high-reliability airport weather stations with continuous 50-year observation records. Each pair represents a distinct climatic dynamic:

### Pair 1: Maritime Moderation vs. Continental Extremes (~51 °F)
- **Arcata, CA (Station A):** A coastal Mediterranean fog belt climate moderated by the cold California Current, featuring narrow diurnal ranges and minimal seasonal variation.
- **Des Moines, IA (Station B):** A humid continental climate situated in the central North American landmass, subject to severe sub-zero winter cold and intense summer heatwaves.

### Pair 2: Coastal Mediterranean vs. Midwestern Four-Season Extremes (~57 °F)
- **San Francisco, CA (Station A):** A coastal Mediterranean environment with cool, damp summers, mild maritime winters, and modest annual swings.
- **St. Louis, MO (Station B):** A continental humid subtropical climate with four pronounced seasons, high summer humidity, and frequent winter freezes.

### Pair 3: Northern vs. Southern Hemisphere Seasonal Phase Inversion (~52 °F)
- **Seattle, WA (Station A):** A temperate maritime climate in the Pacific Northwest with cool, wet winters and warm, dry summers.
- **Christchurch, New Zealand (Station B):** A temperate oceanic climate in the Southern Hemisphere. Both stations experience similar thermal moderation, but their seasonal cycles are inverted by six months.

### Pair 4: Equatorial Highland "Eternal Spring" vs. Subtropical Four Seasons (~62 °F)
- **Addis Ababa, Ethiopia (Station A):** An equatorial highland climate at ~7,700 feet elevation, providing a mild, steady "eternal spring" with almost zero seasonal temperature variation.
- **Atlanta, GA (Station B):** A humid subtropical climate characterized by hot, humid summers, distinct winter cold snaps, and wide seasonal amplitude.

### Pair 5: Subpolar Oceanic Moderation vs. Continental Subarctic Severe Winter (~41 °F)
- **Reykjavík, Iceland (Station A):** A subpolar oceanic climate strongly moderated by the North Atlantic Current, keeping winters relatively mild despite its high latitude.
- **Caribou, ME (Station B):** An interior continental subarctic climate experiencing prolonged, brutal winter freezes with frequent temperatures below -10 °F.

### Pair 6: Arid Subtropical Desert vs. Humid Subtropical Gulf Delta (~70 °F)
- **Tucson, AZ (Station A):** An arid Sonoran Desert climate characterized by intense solar heating, very high daily maximum temperatures, dry air, and large day-to-night swings.
- **New Orleans, LA (Station B):** A humid subtropical delta climate with abundant moisture from the Gulf of Mexico, moderating daytime peaks but keeping overnight lows warm and humid.

---

For technical details on data cleaning, missing observation handling, station pairing metrics, and data transformations, visit the **[Data & Methods](./data-methods)** page.
