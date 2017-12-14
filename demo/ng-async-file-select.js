app.directive("ngFileSelectAsync", [function () {
    return {
        scope: {
            target: "=",
            name: "="
        },
        link: function (scope, element) {
            element.bind("change", function (e) {
                scope.$apply(function () {
                    scope.target = (e.srcElement || e.target).files[0];
                    scope.name = scope.target.name;
                });

            });
        }
    }
}]);