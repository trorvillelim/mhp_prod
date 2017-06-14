'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('forgotPassword', {
            templateUrl : 'components/forgot-password/forgot-password.component.html',
            controller : Controller
    });

    Controller.$inject = ['mhpInhouseApiService', 'mhpApiService', '$scope', '$location'];
    function Controller(mhpInhouseApiService, mhpApiService, $scope, $location){
        var vm = this;

        vm.forgotPasswordValue   = {}
        vm.emailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;

        vm.onSubmit = onSubmit;
        vm.success = false;
        vm.back = back;
        
        activate();

        ///////

        function activate(){
            vm.forgotPasswordValue = {
                email : ''
            }
        }

        function back(){
            $scope.forgotPasswordForm.$setPristine();
            $scope.forgotPasswordForm.$setUntouched();
            $location.path('/login')
        }

        function onSubmit(){
            mhpApiService.post('/api/Account/ForgotPassword', vm.forgotPasswordValue).then(function(result){
                console.log('mhpApiService success', result);
                vm.success = true;
            }, function(result){
                console.log('mhpApiService error', result);
            });
        }

    }

})();