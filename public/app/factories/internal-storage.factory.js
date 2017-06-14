'use strict';
(function(){
    
    /*
        User Info
    */

    angular
        .module('app.factory.module')
        .factory('internalStorageService', Service);

    Service.$inject = [];
    function Service(){

        //public services
        var services = {
            store: store,
            retrieve : retrieve
        }
        
        return services;
        
        //////////

        function store(name, value){
            sessionStorage[name] = value;
        }

        function retrieve(name){
            return sessionStorage[name];
        }

    }

})();