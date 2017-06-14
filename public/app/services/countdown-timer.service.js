angular
    .module('countDownService',[])
    .service('countDownTimerService', ['$interval', 
    function($interval){
        var vm = this;

        vm.count = 0;
        vm.startCount = startCount;
        vm.stopAndResetCount = stopAndResetCount;
        vm.countDownInterval = null;

        function startCount(){
            vm.count = 120;
            vm.countDownInterval = $interval(function(){
                vm.count--;
                // console.log("count", vm.count);

                if ( vm.count <= 0 ){
                    stopAndResetCount()
                }
            }, 1000);
        }

        function stopAndResetCount(){
            $interval.cancel(vm.countDownInterval);
            vm.count = 0;
            console.log("stop count", vm.count);
            
        }


      

    }]);