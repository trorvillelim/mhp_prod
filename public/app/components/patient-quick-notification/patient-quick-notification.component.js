'use strict';
(function(){

     angular
        .module('app.component.module')
        .component('patientQuickNotification', {
            templateUrl : 'components/patient-quick-notification/patient-quick-notification.component.html',
            bindings : {
                notifications : '=',
                notificationBaseController : '='
            },
            controller : Controller

    });

    Controller.$inject = ['$scope', '$routeParams',  '$msg' , 'mhpApiService',
                            'utilityService', 'defaultParam', 'mhpDialog' , 'mhpInhouseApiService','$mdToast'];
    function Controller($scope, $routeParams,  $msg, mhpApiService, 
                            utilityService, defaultParam ,mhpDialog, mhpInhouseApiService , $mdToast){
        var vm = this;

        vm.cancel = cancel;
        vm.submit = submit;
        vm.dateRegex = /[/\d/]{4}[-][/\d/]{2}[-][/\d/]{2}[/\s/][-][/\s/][/\d/]{4}[-][/\d/]{2}[-][/\d/]{2}$/;
        vm.patientUserId = $routeParams.patientId;
        vm.physicianId;
        vm.notification_to_view = {}
        vm.notificationBases = [];
        vm.patientIntId = null;
        vm.lastNotifBase = {};
        vm.baseController = vm.notificationBaseController; // notificationBaseController
        vm.isRunning = false;


        activate();

        ///////

        function activate(){
          
            vm.dateRangeOptions = {
                locale:{format:'YYYY-MM-DD'},
                ranges: {
                    'Next 7 Days': [moment(), moment().add(6, 'days') ],
                    'Next 30 Days': [moment(), moment().add(29, 'days')]
                }
            }
            getPhysicianID()
        }

        function getPhysicianID(){
            var _url = '/api/GetMePhysicianV1';            
                        
            mhpApiService.get(_url, {}, true).then(function(result){
            vm.physicianId = result.id;           

            }, function(result){
            console.log('mhpApiService error', result);
            });
        }

        function cancel() {
            vm.notification_to_view.subject = "";
        }

        function submit(){
            getNotificationBases(function(success){
            vm.isRunning = true;
                if (success){
                    // console.log('getNotificationBases 1',vm.lastNotifBase)
                    sendNewNotification();
                }
            });
        }

        function sendNewNotification() {
            var currentDate = new Date();
            // console.log('currentDate',currentDate)
                
            var _startDate = moment( currentDate ).format('YYYY-MM-DD HH:mm');
            var _endDate = moment( currentDate ).format('YYYY-MM-DD HH:mm');

            // console.log('_startDate', _startDate)
            // console.log('_endDate', _endDate)

            vm.notification_to_view = { "id":0,
                                        "patientId": vm.patientIntId,
                                        "description": vm.notification_to_view.subject.trim(),
                                        "notificationtype":0,
                                        "type":5,
                                        "subject": vm.notification_to_view.subject.trim(),
                                        "endAfterNumberOfOccurrencies":1,
                                        "dayOfWeek":0,
                                        "hoursInterval":0,
                                        "status":0,
                                        "howToEnd":0,
                                        "startDate": _startDate,
                                        "endDate": _endDate,
                                        "physicianId":vm.physicianId }
            
            

                var obj = {"notificationBases":[vm.notification_to_view]};
                console.log('notifbase obj', obj)
                var notifications = [];

                // console.log('1 UPSERT the Notification Base first ')

                /** Upsert the Notification Base first and create the notification object**/
                var isNotifBaseCreated = false;
                upsertMePhysicianPatientV2(obj,function(success){
                    if (success) {
                        /** RETRIEVE latest added notif base id */
                        // console.log('2 RETRIEVE latest added notif base id')
                         getNotificationBases(function(success){
                            if (success){
                                console.log('return latest',vm.lastNotifBase)
                                var notifications =  { "id": 0,
                                                "eventDate": _startDate,
                                                "deliverydDate": _endDate,
                                                "confirmationDate": null,
                                                "responseType": 0,
                                                "notificationBaseId": vm.lastNotifBase.id,
                                                "status": 0 }

                                /** PUSH the notification json object to notificationBase */ 
                                vm.lastNotifBase.notifications.push(notifications);
                                vm.lastNotifBase.startDate = _startDate;
                                vm.lastNotifBase.endDate = _endDate;
                                

                                var NewNotification = {"notificationBases":[ vm.lastNotifBase ]};
                                // console.log('3 UPSERT NewNotification obj after RETRIEVE and PUSH', NewNotification)

                                /** CALL upsertMePhysicianPatientV2 to upsert the notification */         
                                
                                upsertMePhysicianPatientV2(NewNotification,function(success){
                                    if (success) {
                                        var params = {
                                            "notificationBaseId": vm.lastNotifBase.id,
                                            "deliverydDate": _startDate,
                                            "eventDate" : _endDate
                                        };


                                        // console.log('4 UPSERT success NewNotification and Call GetNotificationPushDetails ', NewNotification)
                                        // updateListUi();
                                        // showToast("Notification Sent.")

                                        mhpInhouseApiService.post('/api/GetNotificationPushDetails', params, true)
                                        .then(function (result) {
                                            // console.log("5 result in GetNotificationPushDetails sending", result)

                                            if ( (result.status == 200)){
                                                var _messages = result.message;

                                                _messages.forEach(function(_msg){

                                                console.log('_msg',_msg.snstatusmessage)           

                                                });
                                                
                                                if (_messages[0].isSuccess){
                                                    showToast("Notification Sent.")
                                                    vm.baseController.updateNotifications(); // refresh notification list from base controller
                                                }else{
                                                    mhpDialog.showDialog('Error in Sending', 'Please contact administrator');
                                                    console.log('SNS ERROR ', _messages[0].snstatusmessage )
                                                }

                                            }else{
                                                mhpDialog.showDialog('Error in Sending', 'Please contact administrator');
                                            }
                                             vm.isRunning = false;

                                        }, function (err) {
                                            mhpDialog.showDialog('Get Notification Push Details', $msg.errorAPI);
                                            console.log('/api/GetNotificationPushDetails Error', err);
                                        });

                                    }else {
                                        mhpDialog.showDialog('Patient Create Notification under latest Notification Bases', $msg.errorAPI);
                                    }
                                })
                                
                            }
                        });
                    } else {
                        mhpDialog.showDialog('Patient Create Notification Bases', $msg.errorAPI);
                    }
                    
                })
                

        }

        function upsertMePhysicianPatientV2(data,callback) {
            var _url = '/api/UpsertMePhysicianPatientV2';
            var _request_param = '?patientUserId=' + vm.patientUserId;

            mhpApiService.post(_url + _request_param, data, {}, true).then(function(result){
                console.log('mhpApiService success', result);
                callback(true);
            }, function(result){
                console.log('mhpApiService error', result);
                callback(false);
            });
        }

        function getNotificationBases(callback){
            var _url = '/api/GetMePhysicianPatientV2';
            var _request_param = '?patientUserId=' + vm.patientUserId + 
                            '&startDate=' + defaultParam.startDate +
                            '&endDate=' + defaultParam.endDate +
                            '&bCondition=false' + 
                            '&bBpm=false' + 
                            '&bNotification=true' + 
                            '&bRecommendation=false' + 
                            '&bDrug=false' + 
                            '&bPhysician=false' +
                            '&bRA=false'+
                            '&bReviewLog=false';
                            

            vm.process_updateNotifications = true;
            vm.get_notifications = mhpApiService.get(_url + _request_param, {}, true).then(function(result){
                vm.notificationBases = result.notificationBases;    
                vm.patientIntId = result.id;

                var lastNotifBase = vm.notificationBases[vm.notificationBases.length - 1];
                vm.lastNotifBase = lastNotifBase;

                callback(true)

            }, function(result){
                callback(false)
                console.log('mhpApiService getNotificationBases error', result);
            });
        }

        function showToast(message){
            vm.notification_to_view.subject = "";
            $mdToast.show(
                $mdToast.simple()
                    .textContent(message)
                    .position('top center')
                    .hideDelay(4000)
            );
        }

    }

})();