angular
    .module('bpListService',[])
    .service('bpListFilterService', ['$http', 
    function($http){
        
        this.bpArray = [];

        this.addToBpServiceList = function(bpMeasurementsList){
           this.bpArray = bpMeasurementsList;
        };

        this.getData = function() { return this.bpArray; };

    }]);