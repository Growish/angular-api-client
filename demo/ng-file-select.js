app.directive("ngFileSelect", function(){
    return {
        link: function($scope,el) {

            el.bind("change", function(e){
                var file = (e.srcElement || e.target).files[0];
                $scope.getFile(file);
            })

        }

    }

});