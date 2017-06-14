'use strict';
(function(){

    angular
        .module('app.filter.module')
        .filter('gender', function() {
            return function(gender) {
                switch (gender) {
                    case 0:
                        return "Male";
                    case 1:
                        return "Female";
                    default:
                        return "";
                }
            }
        })
        .filter('race', function() {
            return function(race) {
                switch (race) {
                    case 0:
                        return "Black";
                    case 1:
                        return "Hispanic";
                    case 2:
                        return "WhiteNotHispanic";
                    default:
                        return "";
                }
            }
        })
        .filter('age', function() {
            return function(birthday) {
                   
                if (!birthday)
                    return " ";
                    
                var ageDifMs = Date.now() - new Date(birthday);
                var ageDate = new Date(ageDifMs);
                return Math.abs(ageDate.getUTCFullYear() - 1970);
            }
        })
        .filter('status', function() {
            return function(status) {
                switch (status) {
                    case 0:
                        return "Active";
                    case 1:
                        return "Disabled";
                    case 2:
                        return "Suspended";
                    default:
                        return "";
                }

            }
        })
        .filter('notificationtypeEnum', function() {
            return function(notificationtypeEnum) {
                switch (notificationtypeEnum) {
                    case 0:
                        return "Reminder";
                    case 1:
                        return "Alert";
                    default:
                        return "";
                }

            }
        })
        .filter('typeEnum', function() {
            return function(typeEnum) {
                switch (typeEnum) {
                    case 0:
                        return "MeasureBP";
                    case 1:
                        return "SBPOutOfRange";
                    case 2:
                        return "DBPOutOfRange";
                    case 3:
                        return "TakeDrug";
                    case 4:
                        return "BuyDrug";
                    case 5:
                        return "DoctorAttention";
                    default:
                        return "";
                }

            }
        })
        .filter('howToEndEnum', function() {
            return function(howToEndEnum) {
                switch (howToEndEnum) {
                    case 0:
                        return "noEnd";
                    case 1:
                        return "byEndDate";
                    case 2:
                        return "Occurrences";
                    default:
                        return "";
                }
            }
        })
        .filter('dayOfWeekEnum', function() {
            return function(dayOfWeekEnum) {
                switch (dayOfWeekEnum) {
                    case 0:
                        return "None";
                    case 1:
                        return "Sunday";
                    case 2:
                        return "Monday";
                    case 4:
                        return "Tuesday";
                    case 8:
                        return "Wednesday";
                    case 16:
                        return "Thursday";
                    case 32:
                        return "Friday";
                    case 64:
                        return "Saturday";
                    case 62:
                        return "Weekdays";
                    case 65:
                        return "Weekend";
                    case 127:
                        return "Weekend";
                    default:
                        return "";
                }
            }
        })
        .filter('MeasurementStatusDTO', function() {
            return function(MeasurementStatusDTO) {
                switch (MeasurementStatusDTO) {
                    case 0:
                        return "noEnd";
                    case 1:
                        return "byEndDate";
                    case 2:
                        return "Occurrences";
                    default:
                        return "";
                }

            }
        })
        .filter('MeasurementStatusDTO', function() {
            return function(MeasurementStatusDTO) {
                switch (MeasurementStatusDTO) {
                    case 1:
                        return "Resting";
                    case 2:
                        return "After exercise";
                    case 3:
                        return "Before exercise";
                    case 4:
                        return "Tired";
                    case 5:
                        return "Unwell";
                    case 6:
                        return "Excited";
                    case 7:
                        return "Surprised";
                    case 8:
                        return "Sad";
                    case 9:
                        return "Angry";
                    case 10:
                        return "In love";
                    default:
                        return "";
                }

            }
        })
        .filter('location', function() {
            return function(location) {
                switch (location) {
                    case 0:
                        return "Home";
                    case 1:
                        return "DrOffice";
                    default:
                        return "";
                }
            }
        })

        .filter('responseType', function() {
            return function(location) {
                switch (location) {
                    case 0:
                        return "Acknowledge";
                    case 1:
                        return "Postpone";
                    case 2:
                        return "Kill";
                    default:
                        return "";
                }
            }
        })

        ;
})(); 