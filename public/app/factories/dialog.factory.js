'use strict';
(function(){
    
    angular
        .module('app.factory.module')
        .factory('mhpDialog', Service);

    Service.$inject = ['$mdDialog','countDownTimerService'];
    function Service($mdDialog, countDownTimerService){
        
        var services = {
            showDialog : showDialog,
            showConfirmDialog: showConfirmDialog,
            closeDialog : closeDialog,
            showSessionTimerDialog : showSessionTimerDialog
        }

        return services;

        function showDialog(title, content, ev) {
            $mdDialog.show(
                $mdDialog.alert()
                .parent(angular.element(document.querySelector('#popupContainer')))
                .clickOutsideToClose(true)
                .title(title)
                .textContent(content)
                .ok('Ok')
                .targetEvent(ev));

        }

        function showConfirmDialog(title, content, ev, confirmText, cancelText, callback) {

            var confirm = $mdDialog.confirm()
                .parent(angular.element(document.querySelector('#popupContainer')))
                .clickOutsideToClose(true)
                .textContent(content)
                .targetEvent(ev)
                .ok(confirmText)
                .cancel(cancelText);

            $mdDialog.show(confirm).then(function() {
                callback(true);
            }, function() {
                callback(false);
                $mdDialog.hide();
            });
        }

        function showSessionTimerDialog(title,  ev, confirmText, cancelText, callback) {
            countDownTimerService.startCount();
            
            var content = 'The session has been idle for 15 minutes. You will be logged off automatically in ' + countDownTimerService.count + ' seconds.'
           
            var confirm = $mdDialog.confirm()
                .title(title)
                .textContent(content)
                .targetEvent(ev)
                .ok(confirmText)
                .cancel(cancelText);

            $mdDialog.show(confirm).then(function() {
                callback(true);
                countDownTimerService.stopAndResetCount();
            }, function() { 
                callback(false);
                $mdDialog.hide();
                countDownTimerService.stopAndResetCount();
            });
        }
        
        function proceed() {
            
        }

        function closeDialog() {
            // Easily hides most recent dialog shown...
            // no specific instance reference is needed.
            $mdDialog.hide();            
        };

    }

})();