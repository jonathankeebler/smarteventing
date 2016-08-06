/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var Vector2 = require('vector2');

var main = new UI.Window();
main.backgroundColor('black');
main.show();

// Import the Clay package
var Settings = require('settings');
var Clay = require('clay');
var clayConfig = require('config');
var clay = new Clay(clayConfig, null, {autoHandleEvents: false});



var id, target, options;

var distance_travelled = 0; // kilometers
var speed = Settings.option("speed") || 300;
var time_elapsed = Settings.option("time_elapsed") || 0;

var last_coord = null;
var start = Settings.option("start") || Date.now();
var paused_time = Settings.option("paused_time") || 0;
var pause_started = null;
var warning_seconds = Settings.option("warning_seconds") || 20;

var is_started = false;

var is_race_mode = false;


Pebble.addEventListener('showConfiguration', function(e) {
  Pebble.openURL(clay.generateUrl());
});

Pebble.addEventListener('webviewclosed', function(e) {
  if (e && !e.response) {
    return;
  }
  var dict = clay.getSettings(e.response);

  // Save the Clay settings to the Settings module. 
  Settings.option(dict);
	
	if(Settings.option("speed"))
	{
		speed = Settings.option("speed");	
	}
	
	if(Settings.option("warning_seconds"))
	{
		warning_seconds = Settings.option("warning_seconds");
	}
	
});

// Open Button and Display
var txtOnLabel = new UI.Text({
    position: new Vector2(0, 70),
    size: new Vector2(144, 30),
    font: 'Bitham 42 Bold',
    text: '0',
    textAlign: 'center',						
    color: 'white'
});

var subText = new UI.Text({
    position: new Vector2(0, 120),
    size: new Vector2(144, 30),
    font: 'Gothic 18',
    text: 'meters',
    textAlign: 'center',						
    color: 'white'
});

var timeLabel = new UI.Text({
    position: new Vector2(0, 20),
    size: new Vector2(144, 30),
    font: 'Bitham 42 Bold',
	text: '0:00',
    textAlign: 'center',						
    color: 'white'
});

main.add(timeLabel);
main.add(txtOnLabel);
main.add(subText);


var fake_last_pos = null;

var latest_position = null;

function success(pos)
{
	latest_position = pos;
}

var last_draw = null;

setInterval(function()
{
	var pre_distance_travelled = distance_travelled;
	
	if(latest_position &&
		( !last_draw || Date.now() - last_draw > 900 )
	)
	{
		var pos = latest_position;
		latest_position = null;
		last_draw = Date.now();
		if(id) process_position(pos);
	}
	
	var time_elapsed = 0;
	if(pre_distance_travelled == 0 && distance_travelled == 0)
	{
		start = Date.now();
		Settings.option("start", Date.now());
		paused_time = 0;
		Settings.option("paused_time", 0);
	}
	else
	{
		time_elapsed = Math.floor((Date.now() - start - paused_time) / 1000);
	}
	
	if(is_race_mode && id)
	{	
		var seconds = Math.floor(time_elapsed % 60);
		var minutes = Math.floor(time_elapsed / 60);

		var time_friendly = minutes.toFixed(0) + ":" + (seconds < 10 ? "0" : "") + seconds.toFixed(0);
		
		var time_goal = distance_travelled * 1000 / speed * 60;

		if(timeLabel.text() != time_friendly) timeLabel.text(time_friendly);
		
		if(time_elapsed < time_goal - warning_seconds)
		{
			if(main.backgroundColor() != "green")
			{
				main.backgroundColor('green');
				timeLabel.color("white");
			}
		}
		else if(time_elapsed > time_goal + warning_seconds)
		{
			if(main.backgroundColor() != "red")
			{
				main.backgroundColor('red');
				timeLabel.color("black");
			}
		}
		else
		{
			if(main.backgroundColor() != "black")
			{
				main.backgroundColor('black');
				timeLabel.color("white");
			}
		}
	}
}, 1000);

function process_position(pos) {
  
  var crd = pos.coords;
  
  // If it's not accurate enough
  if(crd.accuracy && crd.accuracy > 50 && is_started)
  {
    // Disregard it
    
    draw_distance_travelled("Accuracy: " + crd.accuracy.toFixed(0) + "m");
    
    return;
  }
	else if(!is_started)
	{
		if(!fake_last_pos)
		{
			fake_last_pos = pos;
		}
		else
		{
			fake_last_pos.coords.latitude += 0.0001;
			fake_last_pos.coords.longitude += 0.0001;
			pos = fake_last_pos;
			crd = pos.coords;
		}
	}
  
  if(last_coord)
  {
    var distance_from_last = calculateDistance(last_coord.latitude, last_coord.longitude, crd.latitude, crd.longitude );
    
    if(distance_from_last > 0.01)
    {
      distance_travelled += distance_from_last;  
      last_coord = JSON.parse(JSON.stringify(crd));
    }
  }
  else
  {
    last_coord = JSON.parse(JSON.stringify(crd));
  }
  
	draw_distance_travelled();
  
  localStorage.setItem("distance_travelled", distance_travelled);
  if(last_coord) localStorage.setItem("last_coord", JSON.stringify(last_coord));
  
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = (lat2 - lat1).toRad();
  var dLon = (lon2 - lon1).toRad(); 
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
          Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  var d = R * c;
  return d;
}
Number.prototype.toRad = function() {
  return this * Math.PI / 180;
}

function error(err) {
  console.warn('ERROR(' + err.code + '): ' + err.message);
}

target = {
  latitude : 0,
  longitude: 0
};

options = {
  enableHighAccuracy: true,
  timeout: 50000000,
  maximumAge: 0
};

if(localStorage.getItem("distance_travelled") != null && parseFloat(localStorage.getItem("distance_travelled")) > 0)
{
  is_started = true;
  distance_travelled = parseFloat(localStorage.getItem("distance_travelled"));
  if(localStorage.getItem("last_coord") != null)
  {
    last_coord = JSON.parse(localStorage.getItem("last_coord"));
  }
  draw_distance_travelled();
}

function draw_distance_travelled(pSubText)
{
	var distance_string_m = (distance_travelled*1000).toFixed(0).toString();
	var distance_string_km = (distance_travelled).toFixed(0).toString();
	
	var time_goal = distance_travelled * 1000 / speed * 60;
	
	if(distance_travelled < 99)
	{
		if(txtOnLabel.text() != distance_string_m) txtOnLabel.text(distance_string_m);
		if(!pSubText && subText.text() != "meters") subText.text("meters");
	}
	else
	{
		if(txtOnLabel.text() != distance_string_km) txtOnLabel.text(distance_string_km);		
		if(!pSubText && subText.text() != "kilometers") subText.text("kilometers");
	}
	
	if(is_race_mode)
	{
		
	}
	else
	{
		if(pSubText && subText.text() != pSubText)
		{
			subText.text(pSubText);
		}
		
		var seconds = Math.floor(time_goal % 60);
		var minutes = Math.floor(time_goal / 60);

		var time_friendly = minutes.toFixed(0) + ":" + (seconds < 10 ? "0" : "") + seconds.toFixed(0);

		if(timeLabel.text() != time_friendly) timeLabel.text(time_friendly);
	}
		
}

id = navigator.geolocation.watchPosition(success, error, options);    


main.on('click', 'up', function(e) {
	if(pause_started)
	{
		paused_time += Date.now() - pause_started;
		pause_started = null;
		Settings.option("paused_time", paused_time);
	}
	
  if(!id) id = navigator.geolocation.watchPosition(success, error, options);
  draw_distance_travelled();
});

main.on("longClick", 'up', function(e)
{
	is_race_mode = !is_race_mode;
	
	main.backgroundColor('black');
	
	if(is_race_mode)
	{
		timeLabel.text("-");
		txtOnLabel.remove();
		subText.remove();
		txtOnLabel.color("#666666");
		subText.color("#666666");
	}
	else
	{
		txtOnLabel.color("white");
		subText.color("white");
		timeLabel.color("white");
		main.add(txtOnLabel);
		main.add(subText);
	}
	
	draw_distance_travelled();
});

main.on('click', 'select', function(e) {
	if(!pause_started) pause_started = Date.now();
  navigator.geolocation.clearWatch(id);
  id = null;
  draw_distance_travelled();
	subText.text("PAUSED");
});

main.on('click', 'down', function(e) {
  is_started = true;
	
	navigator.geolocation.clearWatch(id);
  id = null;
  draw_distance_travelled();
  distance_travelled = 0;
  last_coord = null;
  localStorage.setItem("distance_travelled", 0);
	localStorage.setItem("last_coord", 0);
	subText.text("STOPPED");
	time_elapsed = 0;
});
