'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('sampleDataTable', {
            templateUrl : 'components/sample-data-table/sample-data-table.component.html',
            controller : Controller
    });

    Controller.$inject = ['mockApiService'];
    function Controller(mockApiService){
        var vm = this;

        vm.notifications = [];
        vm.query = {};

        vm.convertStatus = convertStatus;

        activate();

        ///////

        function activate(){
            updateNotifications();

            vm.query = {
                order : 'description',
                limit: 5,
                page: 1                
            }
        }

        function updateNotifications(){
            mockApiService.get('/sample-notifications-list.json').then(function(result){
                console.log('sample', result[0]);
                vm.notifications = result;
            });
        }

        function convertStatus(status){
            if ( status == 0 )
                return "Active";
            else if ( status == 1 )
                return "Inactive";
            else if ( status == 2 )
                return "Something";
        }

    }

})();