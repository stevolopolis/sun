export default {
  title: "Team SUN",
  root: "src",
  sidebar: true,
  pages: [
    {name: "Milestone 1", path: "/milestone-1"},
    {name: "Milestone 2", path: "/milestone-2"},
    {
      name: "Milestone 3",
      pages: [
        {name: "Intro", path: "/milestone-3/intro"},
        {name: "Data & Methods", path: "/milestone-3/data-methods"},
        {name: "Q0: Raw Daily Temperatures", path: "/milestone-3/q0"},
        {name: "Q1: Temperature Distributions", path: "/milestone-3/q1"},
        {name: "Q2: Seasonal Patterns", path: "/milestone-3/q2"},
        {name: "Q3: Extreme Frequency", path: "/milestone-3/q3"},
        {name: "Q4: Extreme Duration", path: "/milestone-3/q4"},
        {name: "Q5: Extreme Trends", path: "/milestone-3/q5"},
        {name: "Q6: Temperature Fluctuations", path: "/milestone-3/q6"},
        {name: "AI Use", path: "/milestone-3/ai-use"},
      ],
    },
  ],
  toc: true,
  pager: false,
  footer: "Team 7 · NOAA Global Surface Summary of the Day",
};
