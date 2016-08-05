/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var Vector2 = require('vector2');

// Import the Clay package
var Clay = require('pebble-clay');
// Load our Clay configuration file
var clayConfig = require('./config');
// Initialize Clay
var clay = new Clay(clayConfig);

var main = new UI.Card({
  subtitle: 'SmartEventing',
  subtitleColor: '#000000', // Named colors
  bodyColor: '#000000' // Hex colors
});

var id, target, options;

var distance_travelled = 0; // kilometers
var last_coord = null;

var is_started = false;

function success(pos) {
  
  console.log(pos);
  
  var crd = pos.coords;
  
  // If it's not accurate enough
  if(crd.accuracy && crd.accuracy > 50 && is_started)
  {
    // Disregard it
    
    main.body((distance_travelled*1000).toFixed(0) + "m\nBad accuracy: " + crd.accuracy);
    
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
  
  main.body((distance_travelled*1000).toFixed(0) + "m");
  
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

if(localStorage.getItem("distance_travelled") != null)
{
  is_started = true;
  distance_travelled = parseFloat(localStorage.getItem("distance_travelled"));
  if(localStorage.getItem("last_coord") != null)
  {
    last_coord = JSON.parse(localStorage.getItem("last_coord"));
  }
  main.body((distance_travelled*1000).toFixed(0) + "m");
}

id = navigator.geolocation.watchPosition(success, error, options);    

main.show();


main.on('click', 'up', function(e) {
  is_started = true;
  if(!id) id = navigator.geolocation.watchPosition(success, error, options);
  main.body((distance_travelled*1000).toFixed(0) + "m");
});

main.on('click', 'select', function(e) {
  is_started = true;
  navigator.geolocation.clearWatch(id);
  id = null;
  main.body((distance_travelled*1000).toFixed(0) + "m");
});

main.on('click', 'down', function(e) {
  is_started = true;
  navigator.geolocation.clearWatch(id);
  id = null;
  main.body((distance_travelled*1000).toFixed(0) + "m");
  distance_travelled = 0;
  last_coord = null;
  localStoage.removeItem("distance_travelled");
});
