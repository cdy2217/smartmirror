var http = require('http');
var querystring = require('querystring');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

var http_get = function(url, data, callback) {

    var query = querystring.stringify(data);
    if (query !== '')
        url = url + '&' + query;

    console.log(url);

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
    parser.parseString(resData, function(err, obj) {
          if(err) {

          }else {

            var json_str = JSON.stringify(obj);
            var json = JSON.parse(json_str);
            console.log(json.rss);
            console.log(json.rss.channel);
            console.log(json.rss.channel[0].item[0].category[0]);
            console.log(json.rss.channel[0].item[0].description[0].body[0].data[0].temp[0]);
            console.log(json.rss.channel[0].item[0].description[0].body[0].data[0].wfKor[0]);
            console.log(json.rss.channel[0].item[0].description[0].body[0].data[0].reh[0]);
            //console.log(json.rss.channle.item);
            //console.log(JSON.stringify(obj));
            //console.log(obj.channel.item.description.body[0]);ß
          }
    });
});
