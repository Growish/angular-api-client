# angular-api-client
An API Angular client for the Growish rest API [http://growish.github.io/api-doc/](http://growish.github.io/api-doc/)


####HOW TO USE IT
Include in your project ````/dist/gw-api.min.js````

Inject the module dependency *gwApiClient* in your angular app
````
angular.module('demo', ['gwApiClient']).
````


Initialize the API by:

````js
gwApi.initialize({
    appKey: '1234567890'
});
````

This will initialize the API to use the Growish developing server. Add ````env: 'production'```` to use the API in production mode.

Were needed add the service dependency *gwApi*. From that call any API method from [here](http://growish.github.io/api-doc/) by using:

````js
gwApi.request('methodName', param1, param2).read().then();
````

````js
gwApi.request('methodName').save({foo: 'bar'}).then();
````

Check [http://growish.github.io/api-doc/](http://growish.github.io/api-doc/) for a complete list of methods and examples.


####DEVELOPING

````
npm install
````

Make your modifications inside *src* folder. Run ````grunt```` command to compile a new version. Push to repo.