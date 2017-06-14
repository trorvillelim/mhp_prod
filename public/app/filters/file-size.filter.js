'use strict';
(function(){

    angular
        .module('app.filter.module')
        .filter('fileSize', fileSize);


        fileSize.$inject = [];
        function fileSize(){
    
            return function filter(){   
                             
            }

        }

})(); 