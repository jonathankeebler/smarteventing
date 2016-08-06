module.exports = [
  {
    "type": "heading",
    "defaultValue": "Horse Trial Settings"
  },
	{
  "type": "input",
		"appKey": "distance",
  "defaultValue": "2000",
		"label": "Distance (meters)"
},
	{
  "type": "input",
		"appKey": "optimum_time",
  "defaultValue": "120",
		"label": "Optimum Time (seconds)"
},
	{
  "type": "slider",
  "appKey": "speed",
  "defaultValue": 350,
  "label": "Speed (meters/minute)",
  "min": 200,
  "max": 900,
  "step": 10
},
	{
  "type": "slider",
  "appKey": "warning_seconds",
  "defaultValue": 20,
  "label": "Warning when off pace (seconds)",
  "min": 5,
  "max": 60,
  "step": 5
},
  {
    "type": "submit",
    "defaultValue": "Save"
  }
];