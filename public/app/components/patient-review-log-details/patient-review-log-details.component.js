'use strict';
(function () {

    angular
        .module('app.component.module')
        .component('patientReviewLogDetails', {
            templateUrl: 'components/patient-review-log-details/patient-review-log-details.component.html',
            bindings: {
                showDetails: '=',
                data: '=',
                patients: '=',
                logValue: '=',
                pageReviewedList: '=',
                isManual: '=',
                // timeLogsToView : '=',
                timeLogsToViewCopy: '<'
            },
            controller: Controller
        });

    Controller.$inject = ['mhpInhouseApiService', 'mhpApiService', '$routeParams', 'mhpDialog', '$msg', '$route', '$scope'];
    function Controller(mhpInhouseApiService, mhpApiService, $routeParams, mhpDialog, $msg, $route, $scope) {
        var vm = this;

        vm.onSubmit = onSubmit;
        vm.onCancelLog = onCancelLog;
        vm.onUpdate = onUpdate;
        vm.commentSelected = commentSelected;
        vm.patientLog = vm.timeLogsToViewCopy;
        vm.userId;

        vm.dateRegex = /[/\d/]{4}[-][/\d/]{2}[-][/\d/]{2}[/\s/][/\d/]{2}[:][/\d/]{2}[/\s/](am|pm)$/;
        vm.commentChoices = [
            {"comment": "Telephone call with patient/care team"},
            {"comment": "Physician review of Labs and Tests"},
            {"comment": "Prescription Refills"},
            {"comment": "Referrals"},
            {"comment": "Other"}
        ];

        activate();

        ///////

        function activate() {

        // console.log("vm.patientLog", vm.patientLog);
            if (jQuery.isEmptyObject(vm.patientLog)) {
                vm.logValue.ReviewedDate = moment();
                vm.mustUpdate = false;
                vm.comment = "Other";
                vm.logValue.Note = vm.comment
            }
            else {

                 mhpApiService.getUserId().then(function(result){
                    vm.userId = result;
                
                    vm.logValue.ReviewedDate = vm.patientLog.latestDateTimeReviewed;
                    vm.logValue.Note = vm.patientLog.Note;
                    vm.comment = vm.patientLog.Note;
                    vm.logValue.PageReviewed = vm.patientLog.pageReviewed;
                    vm.logValue.Duration = parseInt(vm.patientLog.Minutes);
                    vm.logValue.LogId = vm.patientLog.id;
                    vm.logValue.UserId = vm.userId;

                }, function(err){
                    console.log('getUserId issue', err);
                });
                
                vm.mustUpdate = true;
            }
        }

        function commentSelected(comment) {
            vm.logValue.Note = comment;
        }

        function onSubmit() {


            var _logValue = {};
            angular.copy(vm.logValue, _logValue);

            // convert duration to seconds
            var _duration = _logValue.Duration;
            if (_duration && _duration > 0) {
                _logValue.Duration = _duration * 60;
            }

            if (vm.mustUpdate) {
                onUpdate(_logValue);
            } else {
                addNewLog(_logValue);
            }
        }


        function onUpdate(_logValue) {
            mhpInhouseApiService.post('/api/UpdateLogTime', _logValue).then(function (result) {
                // mhpDialog.showDialog('Patient Review Log Details', 'Time logged successfully.');
                // update manual listing
                getLogsByPatientId(function () {

                });

                vm.showDetails = false;
                resetFormValidation();

            }, function (err) {
                mhpDialog.showDialog('Patient Review Log Details', $msg.errorAPI);
                console.log('/api/UpdateLogTime Error', err);
            });
        }

        function addNewLog(_logValue) {
            console.log('request body', _logValue);
            mhpInhouseApiService.post('/api/LogTime', _logValue).then(function (result) {
                // mhpDialog.showDialog('Patient Review Log Details', 'Time logged successfully.');

                // update manual listing
                getLogsByPatientId(function () {

                });

                vm.showDetails = false;
                resetFormValidation();

            }, function (err) {
                mhpDialog.showDialog('Patient Review Log Details', $msg.errorAPI);
                console.log('/api/LogTime Error', err);
            });
        }

        function onCancelLog() {
            vm.logValue.text = vm.logValue.text;
            vm.showDetails = false;
            resetFormValidation();
        }

        function resetFormValidation() {
            $scope.timeLogDetailsForm.$setPristine();
            $scope.timeLogDetailsForm.$setUntouched();
        }

        function getLogsByPatientId(callback) {
            vm.post_patient_logs = mhpInhouseApiService.post('/api/PatientLogs', vm.data).then(function (result) {
                filterManualAuto(result.message, function (filteredLogged) {
                    if (vm.isManual) {
                        vm.patients = filteredLogged;
                    } else {
                        getLatestLogged(filteredLogged, function (latestLogged) {
                            vm.patients = latestLogged;
                            callback(true);
                        })
                    }
                });
            }, function (err) {
                console.log('err', err);
            });
        }

        function filterManualAuto(logs, callback) {
            var _filteredLogged = [];

            _.each(logs, function (log, i) {
                if (vm.isManual && (!log.Note || log.Note.indexOf('[auto-log]') === -1)) {
                    _filteredLogged.push(log);

                } else if (!vm.isManual && (log.Note && log.Note.indexOf('[auto-log]') !== -1)) {
                    _filteredLogged.push(log);
                }
            });

            callback(_filteredLogged);
        }

        function crudeImpl(logs, callback) {
            var _processed_logs = [];
            _.each(logs, function (_log) {
                // "pageReviewed": "BP Measurements",
                // "id": 1647,
                // "Note": null,
                // "Name": "patient1LN, patient1FN",
                // "totalDuration": "00 hr 09 min 00 sec ",
                // "latestDateTimeReviewed": "12/15/2016 3:11:49 AM",
                // "patientId": 1,
                // "Seconds": 540,
                // "Minutes": "9.00"
                var _latest_notification = _.findWhere(_processed_logs, {
                    pageReviewed: _log.pageReviewed,
                    Note: _log.note,
                    Name: _log.name,
                });
                if (!_latest_notification) {
                    _processed_logs.push(_log);
                } else {
                    _latest_notification.Seconds += _log.Seconds;
                }
            });

            callbacK(_processed_logs);
        }

        function getLatestLogged(logs, callback) {
            var _latestNotifications = [];
            var _latestPatientDrugs = [];
            var _latestBpMeasurements = [];
            var _recommendations = [];
            var _others = [];
            var _latestLogged = [];

            // filter by page
            _latestNotifications = _.where(logs, {pageReviewed: 'Notifications'});
            _latestPatientDrugs = _.where(logs, {pageReviewed: 'Patient Drugs'});
            _latestBpMeasurements = _.where(logs, {pageReviewed: 'BP Measurements'});
            _recommendations = _.where(logs, {pageReviewed: 'Recommendations'});

            // get latest for each page
            if (_latestNotifications.length > 0) {
                _latestLogged.push(getDuration(_latestNotifications));
            }

            if (_latestPatientDrugs.length > 0) {
                _latestLogged.push(getDuration(_latestPatientDrugs));
            }

            if (_latestBpMeasurements.length > 0) {
                _latestLogged.push(getDuration(_latestBpMeasurements));
            }

            if (_recommendations.length > 0) {
                _latestLogged.push(getDuration(_recommendations));

            }
            if (_others.length > 0) {
                _latestLogged.push(getDurationAll(_others));
            }

            callback(_latestLogged);
        }

        function getDuration(logs) {
            var _log = {};
            var _seconds = [];

            logs.map(function (log) {
                _log = log;
            }).sort().reverse()[0];

            return _log;
        }

        function getDurationAll(logs) {
            var _log = {};
            var _seconds = [];

            logs.map(function (log) {
                _log = log;
            }).sort();

            return _log;
        }

        /**
         * ================================================================================
         */
    }

})();