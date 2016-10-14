/*
* ARTIK 1 릴레이 첫번째 ON
*/

var webSocketUrl = "wss://api.artik.cloud/v1.1/websocket?ack=true";
// 홍기형님
//var device_id = "0918e361ab72458483d8de4ee080c9e9";
//var device_token = "ad2faa9e1ce34232a150e967e8d0f08f";
//김정출
var device_id = "0b40fc690f5644b889632c73c07967d1";
var device_token = "dbf4b637487f449588da522b41c702c6";


var WebSocket = require('ws');
var isWebSocketReady = false;
var ws = null;

var puts = require('sys').puts;


function getTimeMillis(){
    return parseInt(Date.now().toString());
}

function start() {
    //Create the WebSocket connection
    isWebSocketReady = false;
    ws = new WebSocket(webSocketUrl);
    ws.on('open', function() {
        console.log("WebSocket connection is open ....");
        register();
        sendSensorValueToArtikCloud();
    });
    ws.on('message', function(data) {
       console.log("Received message: " + data + '\n');
         handleRcvMsg(data);
    });
    ws.on('close', function() {
        console.log("WebSocket connection is closed ....");
        //exitClosePins();
    });
}

function register(){
    console.log("Registering device on the WebSocket connection");
    try{
        var registerMessage =
           '{"type":"register", "sdid":"'+device_id+'", "Authorization":"bearer '+device_token+'", "cid":"'+getTimeMillis()+'"}';
         console.log('Sending register message ' + registerMessage + '\n');
         ws.send(registerMessage, {mask: true});
                   isWebSocketReady = true;
   }catch (e) {
     console.error('Failed to register messages. Error in registering message: '+ e.toString());
   }
}

function handleRcvMsg(msg){
    var msgObj = JSON.parse(msg);
    if (msgObj.type != "action") return; //Early return;

    var actions = msgObj.data.actions;
    var actionName = actions[0].name;
    console.log("The received action is " + actionName);
    var newState;
    if (actionName.toLowerCase() == "seton") { newState = 1; }
    else if (actionName.toLowerCase() == "setoff") { newState = 0; }
    else {
        console.log('Do nothing since receiving unrecognized action ' + actionName);
        return;
    }
    console.log('toggled');
//    sendStateToArtikCloud();
}

function sendSensorValueToArtikCloud(){
    try{
        ts = ', "ts": '+getTimeMillis();
        var temperature = Math.floor((Math.random() * 100) + 1);
        var data = {
              "command":3
            };

        var payload = '{"sdid":"'+device_id+'"'+ts+', "data": '+JSON.stringify(data)+', "cid":"'+getTimeMillis()+'"}';

        console.log('Sending payload ' + payload + '\n');
        ws.send(payload, {mask: true});
    } catch (e) {
        console.error('Error in sending a message: ' + e.toString() +'\n');
    }
}

function exitClosePins() {
    console.log('Exit and destroy all pins!');
    process.exit();
}

start();
