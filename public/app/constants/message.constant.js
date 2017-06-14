'use strict';
(function(){

    angular
        .module('app.constant.module')

        .constant('$msg', {
                "errorAPI" : "An error occurred. Please contact system administrator.",
                "errorUpdate" : "Unable to update details. Please contact system administrator."
            }
        );

})();