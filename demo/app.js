var app = angular.module('demo', ['gwApiClient'])


    .config(function (gwApiConfigProvider) {

        //THIS SET THE API CONFIG AND INITIALIZE IT
        gwApiConfigProvider.set({
            //appKey: '1234567890',
            appKey: '0987654321',
            error401: function () {
                alert("Token missing or invalid, you should ask the user to login again");
            },
            error403: function (response) {
                alert(response.message);
            },
            useCookies: true
        });

    })

    .run(function (gwApi, statementMapper) {

        //LEGACY METHOD TO LOAD CONFIG AND INITIALIZE
        // gwApi.initialize({
        //     //appKey: '1234567890',
        //     appKey: '0987654321',
        //     error401: function () {
        //         alert("Token missing or invalid, you should ask the user to login again");
        //     },
        //     error403: function (response) {
        //         alert(response.message);
        //     },
        //     useCookies: true
        // });

        gwApi.addMapper('listWallet.statement', statementMapper);


    });