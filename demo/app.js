var app = angular.module('demo', ['gwApiClient']).run(function (gwApi, statementMapper) {

    gwApi.initialize({
        appKey: '1234567890',
        error401: function () {
            alert("Token missing or invalid, you should ask the user to login again");
            gwApi.killSession();
        },
        error403: function (response) {
            alert(response.message);
        }
    });

    gwApi.addMapper('listWallet.statement', statementMapper);

});