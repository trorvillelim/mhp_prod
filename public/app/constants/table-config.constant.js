'use strict';
(function(){

    angular
        .module('app.constant.module')

        .constant('tableConfig', {
                "rowsPerPage" : [25, 50, 100],
                "defaultRowCount" : 25
            }
        );

})();

