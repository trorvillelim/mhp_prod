'use strict';
(function(){
    
    angular
        .module('app.factory.module')
        .factory('apiUrlBuilderService', Service);

    Service.$inject = [];
    function Service(){

        var services = {
            getBuilder: getBuilder
        }
        
        return services;
        
        //////////

        /**
         * 
         */
         function getBuilder(base_url){

            if ( !base_url )
                throw 'base_url is required';

            return {
                base_url : base_url,
                params : [],
                _addToParams : function(label, value) {
                    var _this = this;
                    _this.params.push(label + '=' + value);
                },               
                addParam : function(label, value, default_value){
                    var _this = this;
                    if ( (value || value == '' || value == 0 || value == false) || default_value)
                        _this._addToParams(label, (value?value:default_value))
                },
                addBooleanParam : function(label, value, expected_true){
                    var _this = this;
                    _this._addToParams(label, (value === expected_true ));
                },
                build : function(){
                    var _this = this;
                    var _built_url = _this.base_url;
                    var _initial_param = _this.params.shift();
                    if ( _initial_param ) // has param
                        _this.params.unshift('?' + _initial_param);
                        _built_url += _this.params.join('&');
                    return _built_url;
                }
            }

         }

    }

})();