angular.module('gwApiClient').provider('gwApiConfig', function () {

    var _options = null;

    return {
        set: function (opts) {
            _options = opts;
        },
        $get: function () {
            return {
                get: function () {
                    return _options;
                }
            }
        },

    }


});