'use strict';
(function(){

    angular
        .module('app.filter.module')
        .filter('isLocationActive', isLocationActive);

        /**
         * 
         * FIELDS
         *  - _target_location ( string or array ) *target location to set as active
         *  - custom_class ( string ) *overwrite default class 'active'
         * 
         * TO USE EXAMPLE
         * single (string)
         *      {{'#!/parent-location/here' | isLocationActive }}
         * 
         * multiple (array)
         *      {{['#!/parent-location/here', '#!/parent-location/there', '#!/parent-location/everywhere'] | isLocationActive }}      
         */
        isLocationActive.$inject = ['$location'];
        function isLocationActive($location){
        
            var filter = filter;

            return function filter(_target_location, custom_class){
                var _current_location = $location.path();
                var _class = (!custom_class)?'active':custom_class;

                if ( _target_location instanceof Array ){
                    for ( var i in _target_location ){
                        if ( isCurrentLocation(_target_location[i]) )
                            return _class;
                    }
                } else if ( isCurrentLocation(_target_location) ){
                    return _class;
                }
                return '';
            }

            function isCurrentLocation(_target_location){
                var _current_location = $location.path();
                if ( _target_location && _current_location ) {
                    _target_location = _target_location
                                            .replace(/^\s+|\s+$/g, '')
                                            .replace(/\#/g, '')
                                            .replace(/\!/g, '');
                                            
                    _current_location = _current_location
                                            .replace(/^\s+|\s+$/g, '');

                    if ( _current_location.indexOf(_target_location) == 0 )
                        return true;
                    return false;
                }
                return false;                
            }

        }

})(); 