/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var Vector2 = require('vector2');

// Import the Clay package
var Settings = require('settings');
var Clay = require('clay');
var clayConfig = require('config');
var clay = new Clay(clayConfig, null, {autoHandleEvents: false});

var main = new UI.Window();

var id, target, options;

var distance_travelled = 0; // kilometers
var speed = Settings && Settings.state && Settings.state.options && Settings.state.options.speed ? Settings.state.options.speed : 300;
var last_coord = null;

var is_started = false;


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
	
	if(Settings && Settings.state && Settings.state.options && Settings.state.options.speed)
	{
		speed = Settings.state.options.speed;	
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

var fake_last_pos = null;

function success(pos) {
  
  var crd = pos.coords;
  
  // If it's not accurate enough
  if(crd.accuracy && crd.accuracy > 50 && is_started)
  {
    // Disregard it
    
    draw_distance_travelled();
		subText.text("Accuracy: " + crd.accuracy.toFixed(0) + "m")
    
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

function draw_distance_travelled()
{
	if(distance_travelled < 99)
		{
			txtOnLabel.text((distance_travelled*1000).toFixed(0));
			subText.text("meters");
		}
	else
		{
			txtOnLabel.text((distance_travelled).toFixed(0));		
			subText.text("kilometers");
		}
	
	var time = distance_travelled * 1000 / speed * 60;
	
	var seconds = Math.floor(time % 60);
	var minutes = Math.floor(time / 60);
	
	//var time_friendly = ( minutes ? minutes.toFixed(0) + ":" : "" ) + (minutes && seconds < 10 ? "0" : "") + seconds.toFixed(0) + "s";
	var time_friendly = minutes.toFixed(0) + ":" + (seconds < 10 ? "0" : "") + seconds.toFixed(0);
	
	timeLabel.text(time_friendly);
}

id = navigator.geolocation.watchPosition(success, error, options);    


main.on('click', 'up', function(e) {
  is_started = true;
  if(!id) id = navigator.geolocation.watchPosition(success, error, options);
  draw_distance_travelled();
});

main.on('click', 'select', function(e) {
  is_started = true;
  navigator.geolocation.clearWatch(id);
  id = null;
  draw_distance_travelled();
});

main.on('click', 'down', function(e) {
  is_started = true;
	
	navigator.geolocation.clearWatch(id);
  id = null;
  draw_distance_travelled();
  distance_travelled = 0;
  last_coord = null;
  localStorage.setItem("distance_travelled", 0);
});





// Display Main Window
main.backgroundColor('black');
main.add(timeLabel);
main.add(txtOnLabel);
main.add(subText);
main.show();
