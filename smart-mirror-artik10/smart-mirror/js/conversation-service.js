(function() {
    'use strict';

    function ConversationService($http) {
        var service = {};
        service.conversation = null;

        service.init = function(string){
          // http://api.simsimi.com/request.p?key=958cddf8-cfc5-4db1-86f4-b3ccf4e7141a&lc=ko&ft=1.0&text=%EC%95%88%EB%85%95

          return $http.get("http://api.simsimi.com/request.p?key="+config.conversation.key+"&lc="+config.language+"&ft=1.0&text="+string).
              then(function(response) {
                  return service.conversation = response.data;
              });
        };

        service.getConversation = function() {
          if(service.conversation === null){
              return null;
          }
          console.log(service.conversation.response);
          return service.conversation;
        };

        return service;
    }

    angular.module('SmartMirror')
        .factory('ConversationService', ConversationService);
}());
