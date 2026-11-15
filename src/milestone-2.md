# Milestone 2

${html`<a href="${await FileAttachment("./files/milestone-2-report.pdf").url()}">Open the original report (PDF)</a>`}

${html`<a href="${await FileAttachment("./files/Team7.M2.feedback.md.txt").url()}" download="Team7.M2.feedback.md">Download Team 7 feedback (Markdown)</a>`}

${html`<a href="${await FileAttachment("./files/milestone-2-dataset.zip").url()}" download="milestone-2-dataset.zip">Download the dataset (ZIP)</a>`}

## Data Analysis & Sketches

Team - Sun

AI was used to assist in identifying candidate stations from among the 9000 total stations, and merging the individual datasets into one larger file.

### Anchor question

Do similar average temperatures hide different extremes?

### Domain questions


### Common to all questions


### Station Selection

Stations were chosen to investigate the limitations of using mean temperature as a standalone climate metric. The main goal was to illustrate how two locations can share nearly identical daily mean temperatures across years while actually experiencing vastly different weather extremes, seasonal amplitudes, and daily variability. First, candidate stations were chosen isolated from the over 9,000 worldwide stations in NOAA's station master directory (isd-history.csv). In order to be considered, stations needed to have unbroken daily records from January 1973 through August 2025, and be high reliability observatories or international airport stations. After the candidates were determined, we then chose specific stations to be in pairs based on similar averages with differing conditions:

- Maritime Moderation vs. Continental Extremes
  - Arcata, CA vs. Des Moines, IA
  - Arcata is a warm-summer Mediterranean climate with little seasonal swing
  - Des Moines is a hot-summer humid continental climate in the Midwest continental basin, having severe cold in winter and extreme heatwaves in summer
  - Both average ~51°F
- Coastal Mediterranean vs. Mid-Latitude Swings
  - San Francisco, CA vs. St. Louis, MO
  - San Francisco is a warm-summer Mediterranean climate that is generally cool, with chilly summers and winters, and warm falls
  - St. Louis is a humid subtropical climate with four distinct continental seasons
  - Both average ~57°F
- Hemispheric Seasonal Inversion
  - Seattle, WA vs. Christchurch, NZ
  - Both locations are maritime with moderate climate, but sit in vastly different areas with opposite seasonal cycles (due to hemisphere)
  - Both average ~52°F
- Equatorial Highland vs. Subtropical Four Seasons
  - Addis Ababa, Ethiopia vs. Atlanta, GA
  - Addis Ababa is a mild, subtropical highland climate, generally feeling like spring all year
  - Georgia has hot humid summers and cold winters
  - Both average ~62°F
- Subpolar Oceanic vs. Subarctic Continental
  - Reykjavik, Iceland vs. Caribou, ME
  - Reykjavik is a subpolar oceanic climate with mild winters and cool summers
  - Caribou is a humic continental climate with severe winters and mild summers
  - Both average ~41°F
- Arid Desert vs. Humid Delta
  - Tucson, AZ vs. New Orleans, LA
  - Tucson is a hot arid climate with dry, hot summers that are cooler in the night, and mild winters
  - New Orleans is a humid subtropical climate with long, hot, humid summers, short winters, and heavy rainfall
  - Both average ~70°F

### Data Transformation


Once the yearly files were downloaded, each station's 53 annual files were concatenated chronologically into a one station-level CSV file. These individual datasets were then merged into two core data files:

- gsod_10_stations_1973_2025.csv
  - All records from the first 10 stations (Pairs 1 to 5), totaling 186,275 rows
- gsod_all_12_stations_1973_2025.csv
  - An extended record covering all 12 stations (including the final Tucson, AZ vs. New Orleans, LA pair), totaling 224,732 rows

The data itself was not transformed, left in the original NOAA units, with original missing data markers (such as 999.9). The only transformations applied were to the structure of the data:

- Merging individual annual files into a file with continuous dates
- Ensuring column headers were the same across all stations and years
- Added three tags to the data to more easily keep track of pairs
  - PAIR_ID
    - Which pair is the station part of (e.g. 1, 2, 3, …)
  - PAIR_THEME
    - What is the pair looking at (e.g. Temperate Coastal Maritime Fog Belt vs. Continental Severe Seasons)
  - STATION_ROLE
    - Is the station the first or second in the pair (e.g. Station A or Station B)
    - Useful for keeping track of which station is which without needing to rely on station ID

### Data Table


To create the sample dataset in gsod_all_12_stations_sample.csv, we took a stratified sample of five rows per station across the 53-year period (at the 5%, 25%, 50%, 75%, and 95% points of each station's timeline). This produced a balanced, 60-row file that represents all 12 stations, capturing conditions across the whole timeframe

See the original PDF for the sample table.

## Domain Question 1: Among our selected station pairs, how do daily high and low temperature distributions differ?

- Variables to use
- PAIR_ID, STATION_ROLE
- Identifying pairs and the stations that make up the pairs
- DATE
- Used to examine temporal patterns
- MAX, MIN (temperature in Fahrenheit)
- The main variables of interest for this question
- Data adjustments
- Filter out missing data (those with entries like 999.9)
- What to look at
- Quartiles
- Interquartile range identifies how much the middle 50% of daily highs and lows fluctuate throughout the year
- The whiskers will allow us to observe extremes and outliers
- Medians
- The median lines will allow us to compare typical highs and lows and determine if daily peaks and lows align
- Min/max distance
- The vertical distance between max and min in the plot will allow us to assess daily temperature range, and seasonal trends

See the original PDF for the sketch.

## Domain Question 2: How do seasonal temperature patterns differ between locations with similar annual averages?

- Variables to use
- PAIR_ID, STATION_ROLE
- Identifying pairs and the stations that make up the pairs
- DATE
- We will look at ranges of months to assess seasonal changes
- TEMP
- Daily mean temperature
- Data adjustments
- Filter out missing data (those with entries like 999.9)
- What to extract/look at
- Seasonal peaks and valleys
- The difference between the highest and lowest monthly mean temperature
- Seasonal inversion
- For locations like Seattle and Christchurch, which are in different hemispheres, see if their curves are generally inversions of one another
- Seasonal delay
- See if certain regions experience peak/minimum temperatures earlier or later in the year than other regions
- Mean equivalence
- Look at which parts of each respective location’s temperatures across the year contribute to them having similar averages despite different overall conditions

See the original PDF for the sketch.

## Domain Question 3: How often does each location experience extremely hot days or freezing nights?

- Variables to use
- PAIR_ID, STATION_ROLE
- Identifying pairs and the stations that make up the pairs
- MAX, MIN
- MAX will be filtered to only include days over ~90F
- MIN will be filtered to only include days under ~32F
- Data adjustments
- Filter out missing data (those with entries like 999.9)
- What to extract/look at
- Extreme weather disparity
- Examine significant contrast in days exhibiting extremes between paired stations
- Extreme types
- Examine which locations experience frequent days with both extremes, only one extreme (mostly only high extremes or only low extremes), or no extremes

See the original PDF for the sketch.

## Domain Question 4: When extreme temperatures occur, how long do they last in each location?

- Variables to use
- PAIR_ID, STATION_ROLE
- Identifying pairs and the stations that make up the pairs
- DATE
- Timestamps over a selected time window
- TEMP (daily mean), MIN, MAX
- Compare daily readings against thresholds for extremes
- e.g. >= 90F for extreme heat, <= -10F for extreme cold
- Data adjustments
- Filter out missing data (those with entries like 999.9)
- What to extract/look at
- Spells
- In a given timeframe, identify unbroken chains (spells) of days exhibiting extreme weather
- Spell duration
- Examine differences in lengths of the chains of consecutive extremes
- Are they persistent or transient
- Spell recurrence
- Do the same extreme spells show up at similar times across years
- Spell severity
- How far above or below the threshold do the temperatures in spells go
- e.g. Do they go vastly beyond thresholds or just meet them
- Recovery
- How quickly does temperature recover after a spell

See the original PDF for the sketch.

## Domain Question 5: How have temperature extremes changed within each pair over time, and have their average temperatures remained similar?

- Variables to use
- PAIR_ID, STATION_ROLE
- Identifying pairs and the stations that make up the pairs
- DATE
- Enable grouping by year and week across given timeframe
- TEMP (mean), MIN, MAX
- Means used to track cycles
- MIN and MAX used to look at how the range of temperature changes through time
- Data adjustments
- Filter out missing data (those with entries like 999.9)
- What to extract/look at
- Mean equivalence
- Determine if averages remain similar across time
- Have baseline temperatures between paired locations changed synchronously with one another
- Changes in extremes
- Compare peaks and minimums across time
- Are peaks or minimums higher/lower than they were in earlier years
- Widening extremes
- Examine if the distance between the yearly peak and minimum temperatures is growing while averages remain similar

See the original PDF for the sketch.

## Domain Question 6: Do locations with similar average temperatures have different transitions between seasons?

- Variables to use
- PAIR_ID, STATION_ROLE
- Identifying pairs and the stations that make up the pairs
- DATE
- Examine
- TEMP (mean), MIN, MAX
- Means used to track cycles
- MIN and MAX used to look at how the range of temperature changes through seasonal transitions
- Data adjustments
- Filter out missing data (those with entries like 999.9)
- What to extract/look at
- Transition duration
- The amount of days a location takes to change to the temperature thresholds of the next season (if applicable)
- Rate of temperature change
- How quickly do the temperatures rise or fall in transitions
- Seasonal timing
- Differences in when seasons appear to arrive between locations
- Contrast between seasons and means
- Examine how two locations share the same mean while having significantly different experiences within the same seasons
- Does one have drawn out seasons while the other quickly flips between seasons, etc

See the original PDF for the sketch.
