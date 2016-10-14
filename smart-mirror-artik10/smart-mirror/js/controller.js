(function(angular) {
    'use strict';

    function MirrorCtrl(
            AnnyangService,
            GeolocationService,
            WeatherService,
            MapService,
            CalendarService,
            TrafficService,
            SubwayService,
            YoutubeService,
            ConversationService,
            $scope, $timeout, $interval, $sce) {

        var _this = this;
        var command = COMMANDS.ko;
        var emotionDB = EMOTIONDB;
        var functionService = FUNCTIONSERVICE;
        var DEFAULT_COMMAND_TEXT = command.default;
        var PHOTO_INDEX=0;
        var VIDEO_INDEX=0;
        /* 릴레이 관련 */
        var MOTION_ALL_RELAY = 0;
        var MOTION_SMARTMIRROR_RELAY = 0;
        var MOTION_ARTIK0_RELAY1 = 0;
        var MOTION_ARTIK0_RELAY2 = 1;
        var MOTION_ARTIK0_RELAY3 = 1;

        $scope.listening = false;
        $scope.complement = command.hi;
        $scope.debug = false;
        $scope.focus = "default";
        $scope.greetingHidden = "true";
        $scope.user = {};
        $scope.interimResult = DEFAULT_COMMAND_TEXT;

        /** Smart Mirror IP */
        /*
        var os = require('os');
        var networkInterfaces = os.networkInterfaces();
        $scope.ipAddress = networkInterfaces.wlan0[0].address;
*/
        /** Sound Cloud Service */
        /*
        SC.initialize({
        	client_id : config.soundcloud.key
        });

        $scope.musicplay = null;
        SC.stream('/tracks/1').then(function(player){
        	$scope.musicplay = player
        	//player.play();
        });
        */

        // Update the time
        function updateTime(){
            $scope.date = new Date();
        }

        // Reset the command text
        var restCommand = function(){
          $scope.interimResult = DEFAULT_COMMAND_TEXT;
        }

        _this.init = function() {
        	$scope.map = MapService.generateMap("Seoul,Korea");
            var tick = $interval(updateTime, 1000); // 1초 마다
            updateTime();

            /** GPS 정보를 가져온다 */
            GeolocationService.getLocation({enableHighAccuracy: true}).then(function(geoposition){
                console.log("Geoposition", geoposition);
                $scope.map = MapService.generateMap(geoposition.coords.latitude+','+geoposition.coords.longitude);
            });
            restCommand();

            /** 현재 장소를 가져오며, 날씨 정보를 가져온다. */
            var refreshMirrorData = function() {

                  //$scope.currentForcast = WeatherService.currentForcast();
                  WeatherService.init().then(function(response){
                    $scope.currentForcast = WeatherService.getForcast();
                    //console.log("Current", $scope.currentForcast);
                  },function(error){
                    console.log(error);
                  });

                  //console.log("Temperature",$scope.currentForcast);
                  //console.log("Weather Korean",$scope.currentForcast.wfKor)

                  //console.log("Current forcast", $scope.currentForcast);

                //Get our location and then get the weather for our location

                GeolocationService.getLocation({enableHighAccuracy: true}).then(function(geoposition){
                    console.log("Geoposition", geoposition);

                }, function(error){
                    console.log(error);
                });

                /** icals로 연동된 달력의 정보를 가져온다. */
                CalendarService.getCalendarEvents().then(function(response) {
                    $scope.calendar = CalendarService.getFutureEvents();
                }, function(error) {
                    console.log(error);
                });

                /** config.js의 greeting 배열(인사말의 정보)를 랜덤으로 가져온다 */
                $scope.greeting = config.greeting[Math.floor(Math.random() * config.greeting.length)];
            };

            refreshMirrorData();
            $interval(refreshMirrorData, 3600000);

            /** 출근에서 퇴근지 교통 정보 나오기*/
            var refreshTrafficData = function() {
                TrafficService.getTravelDuration().then(function(durationTraffic) {
                    console.log("Traffic", durationTraffic);
                    $scope.traffic = {
                        name:config.traffic.name,
                        origin: config.traffic.origin,
                        destination : config.traffic.destination,
                        hours : durationTraffic.hours(),
                        minutes : durationTraffic.minutes()
                    };
                }, function(error){
                    $scope.traffic = {error: error};
                });
            };


            refreshTrafficData();
            $interval(refreshTrafficData, config.traffic.reload_interval * 60000);

            /* Default뷰는 홈 화면*/
            var defaultView = function() {
            	functionService.defaultHome($scope);
            }

            // 미러는 누구니
            AnnyangService.addCommand(command.whois,function() {
            	functionService.whoIsSmartMirror($scope);
            });

            // 사용가능한 명령을 보여준다.
            AnnyangService.addCommand(command.whatcanisay, function() {
               functionService.whatCanISay($scope);
            });

            // 홈화면으로
            AnnyangService.addCommand(command.home, defaultView);

            // 미러의 화면을 끈다.
            AnnyangService.addCommand(command.sleep, function() {
            	functionService.goSleep($scope);
            });

            // 미러의 화면을 켠다.
            AnnyangService.addCommand(command.wake, function() {
            	functionService.wake($scope);
            });

            // 디버그의 정보를 보여준다.
            AnnyangService.addCommand(command.debug, function() {
                console.debug("Boop Boop. Showing debug info...");
                $scope.debug = true;
            });

            // 현재 위치의 지도를 보여준다.
            AnnyangService.addCommand(command.map, function() {
                functionService.map($scope,GeolocationService,MapService);
             });

            // 특정 위치의 지도를 보여준다.
            AnnyangService.addCommand(command.locaiton, function(location) {
            	console.debug("Getting map of", location);
                $scope.map = MapService.generateMap(location);
                $scope.focus = "map";
            });

            // 지도를 확대한다.
            AnnyangService.addCommand(command.zoomin, function() {
                console.debug("Zoooooooom!!!");
                $scope.map = MapService.zoomIn();
            });

            // 지도를 축소한다.
            AnnyangService.addCommand(command.zoomout, function() {
                console.debug("Moooooooooz!!!");
                $scope.map = MapService.zoomOut();
            });

            // 지도의 줌 값을 정한다.
            AnnyangService.addCommand(command.zoomvalue, function(value) {
                console.debug("Moooop!!!", value);
                $scope.map = MapService.zoomTo(value);
            });

            // 지도의 줌 값을 리셋 한다.
            AnnyangService.addCommand(command.zoomreset, function() {
                console.debug("Zoooommmmmzzz00000!!!");
                $scope.map = MapService.reset();
                $scope.focus = "map";
            });


            /** Youtube API */
            // Youtube 동영상 재생
            AnnyangService.addCommand(command.playyoutube, function(term) {
              YoutubeService.getYoutube(term,'video').then(function(){
                if(term){
                  var videoId = YoutubeService.getVideoId()
                  $scope.focus = "youtube";
                  $scope.youtubeurl = "http://www.youtube.com/embed/" + videoId + "?autoplay=1&enablejsapi=1&version=3&playerapiid=ytplayer"
                  $scope.currentYoutubeUrl = $sce.trustAsResourceUrl($scope.youtubeurl);
                }
              });
            });

            // Youtube 플레이어 리스트 재생
            AnnyangService.addCommand(command.ytbplaylist, function(term) {
              YoutubeService.getYoutube(term,'playlist').then(function(){
                if(term){
                  var playlistId = YoutubeService.getPlaylistId()
                  $scope.focus = "youtube";
                  $scope.youtubeurl = "http://www.youtube.com/embed?autoplay=1&listType=playlist&enablejsapi=1&version=3&list="+playlistId
                  $scope.currentYoutubeUrl = $sce.trustAsResourceUrl($scope.youtubeurl);
                }
              });
            });

            // Youtube 동영상, 플레이어 리스트 정지
            AnnyangService.addCommand(command.stopyoutube, function() {
              var iframe = document.getElementsByTagName("iframe")[0].contentWindow;
              iframe.postMessage('{"event":"command","func":"' + 'stopVideo' +   '","args":""}', '*');
              $scope.focus = "default";
            });

            /** Subway */
            // 지하철 도착 정보
            AnnyangService.addCommand(command.subway, function(station,linenumber,updown) {
              SubwayService.init(station).then(function(){
                SubwayService.getArriveTime(linenumber,updown).then(function(data){
                  if(data != null){
                    $scope.subwayinfo1 = data[1].ARRIVETIME + "에 " + data[1].SUBWAYNAME + "행 열차";
                    $scope.subwayinfo2 = data[2].ARRIVETIME + "에 " + data[2].SUBWAYNAME + "행 열차";
                    $scope.subwayinfo3 = data[3].ARRIVETIME + "에 " + data[3].SUBWAYNAME + "행 열차";
                    $scope.subwayinfo4 = data[4].ARRIVETIME + "에 " + data[4].SUBWAYNAME + "행 열차";

                    if(responsiveVoice.voiceSupport()) {
                    	responsiveVoice.speak(data[1].ARRIVETIME + "에 " + data[1].SUBWAYNAME + "행 열차가 있습니다. 이어서,"+data[2].ARRIVETIME + "에 " + data[2].SUBWAYNAME + "행 열차가 있습니다.","Korean Female");
                    }
                  }else{
                    $scope.subwayinfo = "운행하는 열차가 존재 하지 않습니다.";
                  }
                  $scope.focus = "subway";
                });
              });
            });

            /** Google News */
            // 구글 뉴스를 보여준다.
            AnnyangService.addCommand(command.news, function() {
            	functionService.news($scope);
            });
            /** Raspberry Camera */
            // 라즈베리 카메라를 이용해 사진 촬영
            AnnyangService.addCommand(command.photo, function() {
            	functionService.photo(PHOTO_INDEX);
            	PHOTO_INDEX++;
            });

            // 동영상 촬영
            AnnyangService.addCommand(command.video, function() {
            	functionService.video(VIDEO_INDEX);
        		VIDEO_INDEX++;
            });

            /** Relay Switch control Light */
            /* npm install onoff */
            // 릴레이 스위치 ON -> Light on
            AnnyangService.addCommand(command.lighton,function(state,action) {
            	functionService.lightOn();
            });

            // 릴레이 스위치 OFF -> Light off
            AnnyangService.addCommand(command.lightoff,function() {
            	functionService.lightOff();
            });

            /** 캠 테스트 */
            AnnyangService.addCommand(command.cam,function() {
            	functionService.camOpenCV();
            });

            /** 모션 인식 제어 */
            AnnyangService.addCommand(command.motioncontrol,function() {
            	functionService.motionControl();
            });

            /** 표정 인식 */
            AnnyangService.addCommand(command.emotionrecog,function() {
            	functionService.emotionRecog();
            });

            /** 인공지능 대화체 */
            AnnyangService.addCommand(command.conversation,function() {
              functionService.conversationAI();
            });

            /** Sound Cloud */
            /*
            // 음악 재생
            AnnyangService.addCommand(command.musicplay,function(state,action) {
            	console.log("음악 시작");
            	$scope.musicplay.play(); // 음악 시작

            });

            // 음악정지
            AnnyangService.addCommand(command.musicplay,function(state,action) {
            	console.log("음악 정지");
            	$scope.musicplay.pause(); // 음악 정지
            });
            */


          var sender = require('remote').getGlobal('sender');

          /** 안드로이드에서 보낸 SST 명령어를 미러와 동작하게 하는 부분*/
     	    sender.on('android',function(android){
     	    $scope.interimResult = android.command; // 미러의 음성인식된 문구에 보여짐
	    		console.log("Android Command :: "+android.command);
	    		var androidCommand = android.command+"";
          var locationExist = androidCommand.indexOf("위치");
          var subwayExist = androidCommand.indexOf("역");
          var youtubeExist = androidCommand.indexOf("동영상");

    			if(androidCommand === command.sleep) { functionService.goSleep($scope);}
    			else if(androidCommand === command.whois) { functionService.whoIsSmartMirror($scope); }
    			else if(androidCommand === command.home) { functionService.defaultHome($scope); }
    			else if(androidCommand === command.wake) { functionService.wake($scope); }
    			else if(androidCommand === command.whatcanisay) { functionService.whatCanISay($scope); }
    			else if(androidCommand === command.map) { functionService.map($scope,GeolocationService,MapService); }
    			else if(androidCommand === command.news) { functionService.news($scope); }
    			else if(androidCommand === command.photo) { functionService.photo(); }
    			else if(androidCommand === command.video) { functionService.video(); }
          else if(androidCommand === command.monitorOn) {functionService.monitorOn();}
          else if(androidCommand === command.monitorOff) {functionService.monitorOff();}
          else if(androidCommand === command.humidifierOn) {functionService.humidifierOn();}
          else if(androidCommand === command.humidifierOff) {functionService.humidifierOff();}
          else if(androidCommand === command.fanOn) { functionService.fanOn();}
          else if(androidCommand === command.fanOff) { functionService.fanOff();}
    			else if(androidCommand === command.lightOn) { functionService.lightOn();}
    			else if(androidCommand === command.lightOff) { functionService.lightOff();}
          else if(androidCommand === command.emotionrecog) { functionService.emotionRecog();}
          else if(androidCommand === command.motioncontrol) {functionService.motionControl();}
          else if(androidCommand === command.locaition || (locationExist != -1)) {
            console.log("CONTROLLER 구글 맵");
            /* Map Service ***의 위치 보여줘 */
  	    		if(locationExist != -1) {
  	    			var locationValue = androidCommand.split("위치");
  	    			console.log(locationValue[0]);
  	    			functionService.location(locationValue[0],$scope,GeolocationService,MapService);
  	    		}
          }
          else if(androidCommand === command.subway || subwayExist != -1) {
            console.log("CONTROLLER 지하철 도착 정보");
            /* 지하철 **역 *호선 *행성 */

  	    		if(subwayExist != -1) {
  	    			// OO역 OO호선 상(하)행선
  	    			var temp1 = androidCommand.split("역");
  	    			var temp2 = temp1[1].split("호선");

  	    			var subwayStation = temp1[0];
  	    			var subwayLineNumber = temp2[0].trim();
  	    			var subwayUpDown = temp2[1].trim();
  	    			console.log(subwayStation+"역"+subwayLineNumber+"호선"+subwayUpDown);
  	    			functionService.subway(subwayStation,subwayLineNumber,subwayUpDown,$scope,SubwayService);
  	    		}
          }else if(androidCommand === command.playYoutube || (youtubeExist != -1)) {
            console.log("CONTROLLER 유투브 동영상 재생");
            /* Youtube *** 동영상 보여줘 */
  	    		if(youtubeExist != -1) {
  	    			if(androidCommand === "동영상 정지") {
  	    				functionService.stopYoutube($scope);
  	    			}else {
  		    			var youtubeValue = androidCommand.split("동영상");
  		    			console.log(youtubeValue[0]);
  		    			functionService.playYoutube(youtubeValue[0],$scope,$sce,YoutubeService);
  	    			}
     	    	}
          }
          else {
            ConversationService.init(androidCommand).then(function(response){
               var response = ConversationService.getConversation().response;
               if(responsiveVoice.voiceSupport()) {
                 responsiveVoice.speak(response,"Korean Female");
               }
              //console.log("Current", $scope.currentForcast);
            },function(error){
              console.log(error);
            });
          }

          /** 모션 인식 프로그램에서 보낸 data를 아틱 클라우드로 전송*/
          sender.on('motion',function(data){
            var id = data.id;
            /* id = 5 전부다 켠다, 끈다 id = 4 미러와 연결된 릴레이를 켠다, 끈다.
            id = 3 아틱0의 1번 릴레이를 켠다, 끈다 id = 2 아틱0의 2번 릴레이를 켠다, 끈다. id = 1 아틱 0의 1번 릴레이를 켠다, 끈다.
            var MOTION_ALL_RELAY = true;
            var MOTION_SMARTMIRROR_RELAY = true;
            var MOTION_ARTIK0_RELAY1 = true;
            var MOTION_ARTIK0_RELAY2 = true;
            var MOTION_ARTIK0_RELAY3 = true;
            */
            console.log("Motion Command :: "+id);
            if(id == 5){
              MOTION_ALL_RELAY++;
              if(MOTION_ALL_RELAY % 2 == 1){
                functionService.humidifierOn();
              } else {
                functionService.humidifierOff();
              }


            }else if(id == 4) {
              MOTION_SMARTMIRROR_RELAY++;
              if(MOTION_SMARTMIRROR_RELAY % 2 == 1){
                functionService.monitorOn();
              }else {
                functionService.monitorOff();
              }


            }else if(id == 3 ){
              MOTION_ARTIK0_RELAY1++;
              if(MOTION_ARTIK0_RELAY1 % 2 == 1){
                functionService.fanOn();
              } else {
                functionService.fanOff();
              }


            }else if(id == 2 ){
              if(MOTION_ARTIK0_RELAY2){
                functionService.fanOn();
              } else {
                functionService.fanOff();
              }
              MOTION_ARTIK0_RELAY2 ^= MOTION_ARTIK0_RELAY2;
            }else if(id == 1 ){
              if(MOTION_ARTIK0_RELAY3){
                functionService.humidifierOn();
              } else {
                functionService.humidifierOff();
              }
              MOTION_ARTIK0_RELAY3 ^= MOTION_ARTIK0_RELAY3;
            }
          });

          sender.on('emotion',function(data){
            var id = data.id;
            var speakEmotion = null;
            var indexMotionDB = Math.floor(Math.random() * emotionDB.normal.length);
            // 0 평상시 상태 1 화남 2 역겨움 3 기쁜것  4 슬픈것  5 깜짝놀란것
            console.log("Emotion Command :: " +id);
            if(id == 0) {
              speakEmotion = emotionDB.normal[indexMotionDB];
            }else if(id == 1) {
              speakEmotion = emotionDB.angry[indexMotionDB];
            }else if(id == 2) {
              speakEmotion = emotionDB.disgust[indexMotionDB];
            }else if(id == 3) {
              speakEmotion = emotionDB.happy[indexMotionDB];
            }else if(id == 4) {
              speakEmotion = emotionDB.sad[indexMotionDB];
            }else if(id == 5) {
              speakEmotion = emotionDB.surprise[indexMotionDB];
            }
            if(responsiveVoice.voiceSupport()) {
              responsiveVoice.speak(speakEmotion,"Korean Female");
            }
          });


    	    });


            var resetCommandTimeout;
            //Track when the Annyang is listening to us
            AnnyangService.start(function(listening){
                $scope.listening = listening;
            }, function(interimResult){
                $scope.interimResult = interimResult;
                $timeout.cancel(resetCommandTimeout);
            }, function(result){
                $scope.interimResult = result[0];
                resetCommandTimeout = $timeout(restCommand, 5000);
            });


            $scope.interimResult = DEFAULT_COMMAND_TEXT; // 미러의 음성인식된 문구에 보여짐
        };

        _this.init();
    }

    angular.module('SmartMirror')
        .controller('MirrorCtrl', MirrorCtrl);

}(window.angular));
