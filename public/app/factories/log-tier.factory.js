'use strict';
(function(){
    
    angular
        .module('app.factory.module')
        .factory('logTierService', Service);

    Service.$inject = ['$filter'];
    function Service($filter){

        var _tiers = {
            tier_1 : {
                minutes : 20,
                next_tier_increment : 40,
                billing_code : "CPT 99490",
                billing_amount : 46
                
            },
            tier_2 : {
                minutes : 60,
                next_tier_increment : 30,
                billing_code : "CPT 99487",
                billing_amount : 92
            }
        }

        var services = {
            getCurrentTierInMinutes : getCurrentTierInMinutes, 
            getNextTierInMinutes: getNextTierInMinutes,
            getFormattedTierInfo : getFormattedTierInfo,
            getFormattedTotalDurationInMinutes : getFormattedTotalDurationInMinutes,
            getTierBillingCode : getTierBillingCode, 
            getTierBillingAmount : getTierBillingAmount,
            isFirstTier : isFirstTier,
            convertToDecimal : convertToDecimal
        }
        
        return services;
        
        //////////


        /**
         * Get current tier
         * 
         * 20 min - CPT 99490 -~$46
         * 60 min - CPT 99487 ~$92
         * 90 min - CPT 99487 + CPT 99489 ~$138
         * 120 min - CPT 99487 + CPT 99490x2 ~$184
         */
        function getCurrentTierInMinutes(duration_in_seconds){
            var _in_minutes = duration_in_seconds / 60;

            if ( _in_minutes < _tiers.tier_1.minutes )
                return 0;
                
            if ( isFirstTier(duration_in_seconds) )
                return _tiers.tier_1.minutes;
            
            return ( _in_minutes - (_in_minutes % _tiers.tier_2.next_tier_increment) );
        }

        /**
         * Get next tier
         */
        function getNextTierInMinutes(duration_in_seconds){
            var _in_minutes = duration_in_seconds / 60;

            var _next_tier_counter = _tiers.tier_2.next_tier_increment;

            if ( _in_minutes < _tiers.tier_1.minutes )
                _next_tier_counter = _tiers.tier_1.minutes;
            else if ( services.isFirstTier(duration_in_seconds) )//first tier
                _next_tier_counter = _tiers.tier_2.minutes; 
                
            var _next_in_minutes = _next_tier_counter - (_in_minutes % _next_tier_counter);
            return services.convertToDecimal(_next_in_minutes, 2);
        }
        
        /**
         * Get Formatted Tier Info
         */
        function getFormattedTierInfo(duration_in_seconds){

            var current_tier_in_minutes = services.getCurrentTierInMinutes(duration_in_seconds);
            var next_tier_in_minutes = services.getNextTierInMinutes(duration_in_seconds);

            var _elegibility_to_next_tier = _tiers.tier_2.next_tier_increment / 2;     

            //less than first tier
            if ( current_tier_in_minutes < _tiers.tier_1.minutes)
                return next_tier_in_minutes + " minutes until eligible for billing."

            if ( services.isFirstTier(duration_in_seconds) )
                _elegibility_to_next_tier = _tiers.tier_2.minutes / 2;
                

            if ( next_tier_in_minutes <= _elegibility_to_next_tier )
                return next_tier_in_minutes + " minutes until next billing tier.";
            
            return "";
        }

        /**
         * 
         * 20 min - CPT 99490 -~$46
         * 60 min - CPT 99487 ~$92
         * ------ ** ---
         * 90 min - CPT 99487 + CPT 99489 ~$138
         * 120 min - CPT 99487 + CPT 99490x2 ~$184
         *
         * Review Log Reports Page.
             When more than 90 minutes are spent on a patient in a month,
             it should be CPT 99487 for the first 60 minutes plus CPT 99489 for each complete 30 min block.
            The report shows CPT 99490 instead. For example 125min should correspond to CPT 99487 + CPT 99489x2, but it shows CPT 99487 + CPT 99490x2. Bug.
         */
        function getTierBillingCode(duration_in_seconds){
           var _in_minutes = duration_in_seconds / 60;

            //not within tier 1
            if ( _in_minutes < _tiers.tier_1.minutes )
                return "";

            // greater than 20 min but less than 60 min
            if ( isFirstTier(duration_in_seconds)  )
                return _tiers.tier_1.billing_code;

            // greater than 60 but less than 90 min
            var _billing_code = _tiers.tier_2.billing_code;

            var _remaining = _in_minutes - _tiers.tier_2.minutes;
            if ( _remaining < _tiers.tier_2.next_tier_increment )
                return _billing_code;

            // greater than 90 min
            _billing_code += " + " + "CPT 99489";
            var _multiply = Math.floor(_remaining / _tiers.tier_2.next_tier_increment);
            if ( _multiply > 1 )
                _billing_code += "x" + _multiply;

            return _billing_code;            
        }

        /**
         * Get total billing amount
         */
        function getTierBillingAmount(duration_in_seconds){
           var _in_minutes = duration_in_seconds / 60;

            //not within tier 1
            if ( _in_minutes < _tiers.tier_1.minutes )
                return 0;

            if ( isFirstTier(duration_in_seconds)  )
                return _tiers.tier_1.billing_amount;
            
            var _billing_amount = _tiers.tier_2.billing_amount;
            
            var _remaining = _in_minutes - _tiers.tier_2.minutes;
            if ( _remaining < _tiers.tier_2.next_tier_increment )
                return _billing_amount;

            var _multiply = Math.floor(_remaining / _tiers.tier_2.next_tier_increment);
            _billing_amount += (_tiers.tier_1.billing_amount * _multiply );

            return _billing_amount;   
        }

        /**
         * Convert duration in seconds to minutes, with 
         * converted decimal value
         */
        function getFormattedTotalDurationInMinutes(duration_in_seconds){
            var _in_minutes = duration_in_seconds / 60;
            // return convertToDecimal(_in_minutes, 2) + " minutes";
            return ($filter('currency')(_in_minutes, '_', 2) + ' minutes').replace('_', '');
        }

        /**
         * Check if First Tier
         */
        function isFirstTier(duration_in_seconds){
            var _in_minutes = duration_in_seconds / 60;
            return ( _in_minutes >= _tiers.tier_1.minutes && _in_minutes <= _tiers.tier_2.minutes )
        }

        /**
         * Convert to desired decimal
         */
        function convertToDecimal(_float_value, _decimal_value){
            return parseFloat(Math.round(_float_value * 100) / 100).toFixed(_decimal_value)
        }        

    }

})();