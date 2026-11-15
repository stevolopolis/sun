# Milestone 1

${html`<a href="${await FileAttachment("./files/milestone-1-proposal.pdf").url()}">Open the original proposal PDF</a>`}

${html`<a href="${await FileAttachment("./files/Team7.M1.feedback.pdf").url()}">Open Team 7 feedback (PDF)</a>`}

## Project Proposal


### 1. Group Details


**Team members**

- Daeun Park (dp4488)
- Abrar Zaki (az3911)
- Steven Tin Sui Luo (sl9148)

**Team name**

Sun

### 2. Problem Statement/Background

- Weather information usually focuses on hourly forecasts, averages, and weekly highs and lows. Yet places with similar forecasts can feel very different due to overlooked factors such as atmospheric pressure, storm cycles, and large-scale wind patterns.
- We will use daily weather observations to compare climates across regions, explore relationships between weather variables, and track changes in extremes over time.
- We will compare weather variables through visualizations to identify typical and unusual conditions.
- The goal is to reveal overlooked weather patterns through visualizations, without statistical testing or claims beyond what the visuals support.

### 3. Dataset

- The Global Surface Summary of the Day (GSOD) dataset is collected and maintained by NCEI, part of NOAA, a U.S. federal agency focused on weather, oceans, and the atmosphere.
- The data comes from the Integrated Surface Hourly dataset, covering over 9,000 weather stations worldwide. Each station provides daily weather measurements, though some values may be missing.
- Attributes that we can use are the following:
  - Date ■ Allows us to track trends, seasonality, yearly variation
  - Station ID, name, lat, long ■ Allows us to track geographical locations and create maps
  - Mean, max, and min temperatures ■ Allows us to see typical and extreme conditions
  - Precipitation ■ Allows for tracking of wet and dry cycles/seasons
  - Mean and max wind speed ■ Allows for tracking of wind patterns and periods where wind is especially common or rare
  - Dew point ■ Useful for tracking air moisture, humidity
  - Sea-level pressure ■ Enables tracking of atmospheric pressure and changing conditions
  - Visibility ■ Includes low visibility conditions like fog, smog, etc
  - Snow depth ■ Where reported, contains useful information that can be used to see intensity of winters
  - Weather indicators ■ General reports of fog, rain, snow, hail, thunderstorms, and other similar weather events
- Preprocessing
  - Download and combine data ■ Data is split into many csv files, so it would need to be brought together into one larger dataset we can use
  - Deal with missing and flagged values ■ Find out what NOAA generally does when they have a missing value or something looks wrong ■ Shouldn’t record missed information as 0 as this can be misleading for a lot of these facets, especially temp, precipitation, etc
  - Standardize all units if they are conflicting ■ I.e. all temps in celsius, wind in km/h, etc
  - Add useful features by extracting from what is present ■ Month, season, year, temp range (cold, cool, warm, hot), precipitation present, indicator for days that have extreme weather
  - Check comparability ■ Do not use stations which have inadequate coverage in some facets ■ If a given station seems to have changes in coverage or consistency, then make note of it, even if we can resolve it

### 4. Domain Questions

- How do typical weather conditions differ across locations?
  - Visualization: geographic maps that show the different facets
  - Compare average temps, precipitation, wind speed, and dew points across selected stations
  - Established geographic context and introduces the main variables we’re looking at
- How does weather change throughout the year in different climates?
  - Visualization: heatmaps that show month by year, and seasonal line charts
  - Identify seasonal temp cycles, rainy seasons, and periods of snowfall
  - Compare how timing and magnitude of seasonal changes differ by location and over time
- How have typical weather conditions changed over the past 25 (or more) years?
  - Visualization: Annual line charts with baselines shown for reference
  - Track annual/seasonal averages for temperature, precipitation, and dew point
  - Show year to year variability, not smoothing out fluctuations
- Do similar average temperatures conceal vastly different extremes?
  - Visualization: box plots
  - Compare full distributions of daily maximum and minimum temperatures
  - Examine hot and cold tails in addition to averages to see whether locations that show similar means actually have substantially different ranges of conditions that happen to average out similarly
- Do wetter places experience frequent light rain, or fewer days which have heavy rain?
  - Visualization: geographic maps, wet day bar graphs, calendar heatmaps
  - Separate number of days with measurable precipitation from total precipitation
  - Examine whether comparable annual totals arise from different rainfall patterns ■ Station coverage and reporting conventions can influence this
- How do temperature, dew point, and wind speed vary together?
  - Visualization: scatterplots
  - Examine whether hotter days tend to have higher dew points, if windier days tend to differ in temp, and how patterns change by season and location
- Are unusually hot, cold, wet, or windy days becoming more/less common in different regions?
  - Visualization: Bar graphs for annual counts, extremes
  - Have a predetermined threshold/minimum for temp or location dependent percentiles and see how often they are over/undershot
  - Tells us whether a distribution’s tail end suggests something different to the annual averages
- Which locations have the most distinctive weather profiles? What makes them different?
  - Visualization: a collection of some of the previously mentioned visualizations
  - Identify locations with similar avg temps but different rain, wind, or extremes, as well as locations where weather has seemingly changed significantly over time
