/**
 * Created by orvillelim on 13/01/2017.
 */
angular.module('app.directive.module')
    .directive('calendarFormat', ['$timeout', '$filter', function ($timeout, $filter, ngModelCtrl)
    {
        return {
            require: 'ngModel',

            link: function ($scope, $element, $attrs, $ctrl)
            {
                var dateFormat = 'yyyy-MM-dd H:mm a';
                console.log(dateFormat);
                $ctrl.$parsers.push(function (viewValue)
                {
                    //convert string input into moment data model
                    var pDate = Date.parse(viewValue);
                    if (isNaN(pDate) === false) {
                        return new Date(pDate);
                    }
                    return undefined;

                });
                $ctrl.$formatters.push(function (modelValue)
                {
                    console.log('formatter');
                    var pDate = Date.parse(modelValue);
                    if (isNaN(pDate) === false) {
                        return $filter('date')(new Date(pDate), dateFormat);
                    }
                    return undefined;
                });

                $element.on("change", function (event)
                {
                    $timeout(function ()
                    {
                       $scope.upDateValue();
                    }, 1000);
                });

                $element.on('blur', function (event)
                {
                    $scope.upDateValue();
                });

                $scope.upDateValue = function () {
                    var pDate = Date.parse($ctrl.$modelValue);
                    if (isNaN(pDate) === true) {
                        $ctrl.$setViewValue(null);
                        $ctrl.$render();
                    } else {
                        if ($element.val() !== $filter('date')(new Date(pDate), dateFormat)) {
                            $ctrl.$setViewValue($filter('date')(new Date(pDate), dateFormat));
                            $ctrl.$render();
                        }
                    }
                }
            }
        };
    }]);