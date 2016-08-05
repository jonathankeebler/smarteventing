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
});

// Open Button and Display
var txtOnLabel = new UI.Text({
    position: new Vector2(0, 50),
    size: new Vector2(144, 30),
    font: 'Bitham 42 Bold',
    text: '0',
    textAlign: 'center',						
    color: 'white'
});

var subText = new UI.Text({
    position: new Vector2(0, 100),
    size: new Vector2(144, 30),
    font: 'Gothic 18',
    text: '',
    textAlign: 'center',						
    color: 'white'
});

function success(pos) {
  
  console.log(pos);
  
  var crd = pos.coords;
  
  // If it's not accurate enough
  if(crd.accuracy && crd.accuracy > 50 && is_started)
  {
    // Disregard it
    
    draw_distance_travelled();
		subText.text("Accuracy: " + crd.accuracy.toFixed(0))
    
    return;
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
  
  if(!is_started)
  setTimeout(function()
   {
     pos.coords.latitude += 0.0010;
     pos.coords.longitude += 0.0010;
     if(!is_started) success(pos);
   }, 1000);
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
  localStoage.setItem("distance_travelled", 0);
});





// Display Main Window
main.backgroundColor('black');
main.add(txtOnLabel);
main.add(subText);
main.show();
