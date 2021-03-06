/**
 * Created by apizzimenti on 12/29/15.
 */

var http = require('http'),
    https = require('https'),
    chalk = require('chalk'),
    Format = require('./format');

function weatherRequest(location, units, args) {
    var weather_options = {
        host: 'api.forecast.io',
        path: '/forecast/deafb90d798fb611a5a3e0f2791881a6/' + location.lat + ',' + location.long + '?units=' + units.type,
        method: 'GET'
    };

    https.get(weather_options, function(res) {
        var json  = '';
        res
            .on('data', function (chunk) {
                json += chunk;
            })
            .on('end', function() {
                if (args.v || args.verbose) {
                    console.log(chalk.green('✓ got data from weather server'));
                }
                var weather = Format(json, units);
                console.log(weather.currentWeather);
                console.log(weather.tabled());
                process.exit();
            });
    });
}

function address(addr, callback, units, args) {

    var location_options = {
        host: 'maps.googleapis.com',
        path: '/maps/api/geocode/json?address=' + encodeURIComponent(addr.toString()),
        method: 'GET'
    };

    http.get(location_options, function (res) {
        var text = '',
            position = {};
        res
            .on('data', function (chunk) {
                text +=  chunk.toString();
            })
            .on('end', function () {
                var json = JSON.parse(text);
                if (json.status == "OK" && json.results[0]) {
                    if (args.v || args.verbose) {
                        console.log(chalk.green('✓ got geo location server response'));
                        console.log(chalk.green('✓ got location: ') + chalk.bgBlack.white(json.results[0].formatted_address));
                    }
                    position.lat = json.results[0].geometry.location.lat;
                    position.long = json.results[0].geometry.location.lng;
                    callback(position, units, args);
                } else {
                    console.log(chalk.red('✗ address not found'));
                }
            });
    });
}

function automatic(ip, callback, units, args) {

    var location_options = {
        host: 'freegeoip.net',
        path: '/json/' + ip,
        method: 'GET'
    };

    http.get(location_options, function (res) {
        var text = '',
            position = {};
        res
            .on('data', function (chunk) {
                if (args.v || args.verbose) {
                    console.log(chalk.green('✓ got location server response'));
                }
                text +=  chunk.toString();
            })
            .on('end', function () {
                try {
                    var json = JSON.parse(text);
                    var location = json.city + ', ' + json.region_name + ', ' + json.country_name;
                    position.lat = json.latitude;
                    position.long = json.longitude;

                    if (args.v || args.verbose) {
                        console.log(chalk.green('✓ got location: ') + chalk.bgBlack.white(location));
                    }
                    callback(position, units, args);
                } catch (e) {
                    console.log(chalk.red('Sorry, we couldn\'t parse return data :/\n it\'s not our fault, it\'s the geoip server'));
                }
            });
    }).on('error', function () {
        console.log(chalk.red('Sorry, we got a socket hangup error :/'));
    });
}

module.exports = {
    weatherRequest: weatherRequest,
    address: address,
    automatic: automatic
};
