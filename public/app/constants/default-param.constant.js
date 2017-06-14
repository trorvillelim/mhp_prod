'use strict';
(function(){

    angular
        .module('app.constant.module')

        .constant('defaultParam', {
                "startDate" : '01/01/2001',
                "endDate" : '01/01/2051',
            }
        );

})();