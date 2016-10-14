(function(annyang) {
    'use strict';

    function WeatherService($http) {
        var service = {};
        service.forcast = null;

        service.init = function() {
          return $http.get('http://www.kma.go.kr/wid/queryDFSRSS.jsp?zone=1129062000').then(function(response){
            var x2js = new X2JS();
            var jsonData = x2js.xml_str2json(response.data);

            //console.log("response",response);
            console.log(jsonData);
            //console.log(jsonData.rss.channel.item.description.body.data[0].temp);
            service.forcast = jsonData;
          });
        };

        service.getForcast = function(){
          if(service.forcast === null){
                return null;
          }
          service.forcast.temperature = service.forcast.rss.channel.item.description.body.data[0].temp;
          service.forcast.wfKor = service.forcast.rss.channel.item.description.body.data[0].wfKor;
          service.forcast.reh = service.forcast.rss.channel.item.description.body.data[0].reh;
          service.forcast.where = service.forcast.rss.channel.item.category;
          console.log(service.forcast.wfKor);
          return service.forcast;
          //return service.forcast;
        };

        //Returns the current forcast along with high and low tempratures for the current day
        service.currentForcast = function() {

            var http = require('http');
            var querystring = require('querystring');
            var xml2js = require('xml2js');
            var parser = new xml2js.Parser();
            var http_get = function(url, data, callback) {

                var query = querystring.stringify(data);
                if (query !== '')
                    url = url + '&' + query;


                http.get(url, function(res) {
                        var body = '';
                        res.setEncoding('utf8');

                        res.on('readable', function() {
                            var chunk = this.read() || '';

                            body += chunk;
                        });

                        res.on('end', function() {
                            callback(body);
                        });

                        res.on('error', function(e) {
                            console.log('error', e.message);
                        });
                    });
            };
            http_get('http://www.kma.go.kr/wid/queryDFSRSS.jsp?zone=1129062000', {}, function(resData) {
                service.forcast = resData;
                //console.log("http-get resData",service.forcast);
                parser.parseString(resData, function(err, obj) {
                      if(err) {

                      }else {

                        var json_str = JSON.stringify(obj);
                        var json = JSON.parse(json_str);
                        //console.log(json.rss);
                        //console.log(json.rss.channel);
                        //console.log(json.rss.channel[0].item[0].category[0]);
                        //console.log(json.rss.channel[0].item[0].description[0].body[0].data[0].temp[0]);
                        //console.log(json.rss.channel[0].item[0].description[0].body[0].data[0].wfKor[0]);
                        //console.log(json.rss.channel[0].item[0].description[0].body[0].data[0].reh[0]);

                        //console.log(service.forcast);

                        //console.log(json.rss.channle.item);
                        //console.log(JSON.stringify(obj));
                        //console.log(obj.channel.item.description.body[0]);ß

                        //console.log(json.rss.channel[0].item[0].description[0].body[0].data[0].temp[0]);
                        service.forcast = json.rss.channel[0].item[0].description[0].body[0].data[0];
                        service.forcast.temperature = json.rss.channel[0].item[0].description[0].body[0].data[0].temp[0];
                        service.forcast.wfKor = json.rss.channel[0].item[0].description[0].body[0].data[0].wfKor[0];

                        //console.log("service forcast", service.forcast.temperature);

                        console.log(service.forcast.temperature);
                        console.log(service.forcast.wfKor);

                        console.log("return service.forcast",service.forcast);

                        return service.forcast;
                      }
                });
            });

            //service.forcast.data.currently.day = service.forcast.rss.channel[0].item[0].category[0];

        }

        service.weeklyForcast = function(){
            if(service.forcast === null){
                return null;
            }
            // Add human readable info to info
            for (var i = 0; i < service.forcast.data.daily.data.length; i++) {

                /** 한글 UI 변경 - KimJeongChul*/
                var day = moment.unix(service.forcast.data.daily.data[i].time).format('ddd');
                if(day == "Mon") service.forcast.data.daily.data[i].day = "월";
                else if(day == "Tue") service.forcast.data.daily.data[i].day = "화";
                else if(day == "Wed") service.forcast.data.daily.data[i].day = "수";
                else if(day == "Thu") service.forcast.data.daily.data[i].day = "목";
                else if(day == "Fri") service.forcast.data.daily.data[i].day = "금";
                else if(day == "Sat") service.forcast.data.daily.data[i].day = "토";
                else if(day == "Sun") service.forcast.data.daily.data[i].day = "일";

                //service.forcast.data.daily.data[i].day = moment.unix(service.forcast.data.daily.data[i].time).format('ddd');
                service.forcast.data.daily.data[i].temperatureMin = parseFloat(service.forcast.data.daily.data[i].temperatureMin).toFixed(1);
                service.forcast.data.daily.data[i].temperatureMax = parseFloat(service.forcast.data.daily.data[i].temperatureMax).toFixed(1);
                service.forcast.data.daily.data[i].wi = "wi-forecast-io-" + service.forcast.data.daily.data[i].icon;
            };
            return service.forcast.data.daily;
        }

        service.hourlyForcast = function() {
            if(service.forcast === null){
                return null;
            }
            service.forcast.data.hourly.day = moment.unix(service.forcast.data.hourly.time).format('ddd')
            return service.forcast.data.hourly;
        }

        service.refreshWeather = function(){
            return service.init(geoloc);
        }

        return service;
    }

    angular.module('SmartMirror')
        .factory('WeatherService', WeatherService);

}());
