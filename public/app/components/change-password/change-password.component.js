(function () {


    angular
        .module('app.component.module')
        .component('changePassword', {
            templateUrl : 'components/change-password/change-password.component.html',
            controller : Controller
        });

    Controller.$inject = [ 'mhpApiService', '$scope', '$mdToast' ,'$window'];
    function Controller( mhpApiService, $scope, $mdToast, $window){
        var vm = this;

        vm.passWordEquals = false;
        vm.submit = submit;
        vm.cancel = cancel;
        vm.comparePasswords = comparePasswords;
        active();

    function active() {
    }


    // will show password don't match from  confirmPassword field and newPassword field
    function showValidationMessages(form){
        form.newPass.$error.validationError = true
        form.confirmPass.$error.validationError = true

        form.newPass.$touched = true;
        form.confirmPass.$touched = true;

        form.newPass.$invalid = true;
        form.confirmPass.$invalid = true;
        form.$invalid = true;
    }

    function removeValidationMessages(form){
        form.newPass.$error.validationError = false;
        form.confirmPass.$error.validationError = false;

        form.newPass.$touched = false;
        form.confirmPass.$touched = false;

        form.newPass.$invalid = false;
        form.confirmPass.$invalid = false;
        form.$invalid = false;
    }

    function submit(){
        upsertChangePassword(function (isSuccess, result) {
            if (isSuccess){
                showToast("Password successfully updated")
            }else {
                if (result.data.modelState['model.NewPassword']){
                    showToast(result.data.modelState['model.NewPassword']); // Toast: new password must be at least 6 characters
                }else if (result.data.modelState['']){   // Toasts: Incorrect password or other message coming from api service
                    showToast(result.data.modelState['']);
                }
                else{
                    showToast('Internal server error: ' + result.statusText);
                }
            }
        })
    }

    function showToast(message){
        $mdToast.show(
            $mdToast.simple()
                .textContent(message)
                .position('bottom center')
                .hideDelay(4000)
        );
    }

    function cancel(){
        $scope.changePassForm.$setPristine();
        $scope.changePassForm.$setUntouched();
        $window.location.href = "#!/";
    }

    function comparePasswords(form){
        if (vm.formData.newPassword && vm.formData.confirmPassword){
            if (vm.formData.newPassword != vm.formData.confirmPassword){
                showValidationMessages(form)
            }else {
                removeValidationMessages(form)
            }
        }

    }

    function upsertChangePassword(callback) {
        var _url = '/api/Account/ChangePassword';

        mhpApiService.post(_url, vm.formData, {}, true).then(function(result){
            console.log('mhpApiService success', result);
            callback(true);
        }, function(result){
            console.log('mhpApiService error', result);
            callback(false, result);
        });
    }

 }

})();