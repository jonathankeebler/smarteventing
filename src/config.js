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
  "max": 600,
  "step": 10
},
  {
    "type": "submit",
    "defaultValue": "Save"
  }
];