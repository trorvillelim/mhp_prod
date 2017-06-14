'use strict';
(function(){

    angular
        .module('app.constant.module')
        .constant('intervalsConfig', {
            auto_update_patients_counts : 10000,
            auto_log_patients_view : 30000,
            auto_update_patients_messages_counts : 3000
        });

})();

