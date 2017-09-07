# angular-api-client
An API Angular client for the Growish rest API [http://growish.github.io/api-doc/](http://growish.github.io/api-doc/)


#### HOW TO USE IT
Include in your project ````/dist/gw-api.min.js````

**RECOMMENDED**

````
bower install https://github.com/Growish/angular-api-client.git
````

Inject the module dependency *gwApiClient* in your angular app
````
angular.module('demo', ['gwApiClient']).
````


Inject "gwApi" service were needed and initialize the API by:

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


#### Mapping data
This client allows you to map data going out from your application o coming from the Growish API.
A mapper process data before or/and after a request is made. For example, if you request the user information
by ````gwApi.request('user', 'someUserId').read()```` the field *birthday* is formatted as: "1986-03-19 00:00:00"
you can let the client handle a format conversion every time you make this request by 
setting a mapper:

````js
gwApi.addMapper('user', 
{   
    in: function(user) {
        user.creationDate = moment(user.creationDate, 'YYYY-MM-DD hh:mm:ss').format('DD/MM/YYYY');
        return user;
    },
    out: function() {
      return user;
    }
});
````

Now every time you request the user method, birthday will be formatted as DD/MM/YYYY.

*listWallet.statement* returns a quite complicated data, take a look of the demo application in the demo folder to see
 how the statementMapper helps you have a clean view code.

#### Error Management

##### 400 - Format error
Some parameters in the request body does not complain. The response contains an object with the list of errors in Italian:
````js
gwApi.request('user', '123').update({firstName: 'T'}).then(
    function success(user) {
      
    },
    function error(err) {
        console.log(err);
        //{
        //    code: 400,
        //    validationErrors: {
        //        firstName: "Il nome è troppo corto, almeno 2 cartteri"
        //    },
        //    ...
        //}
    }
);
````

**PROTIP: Take a look at demo.html to see how to effectively manage this in the UI**

##### 401 - Session Lost
The user's session is lost or expired, this type of error can be manage globally by the API client by setting a global function when initializing the API:

 ````js
 gwApi.initialize({
     appKey: '1234567890',
     error401: function () {
         alert("Token missing or invalid, you should ask the user to login again");
     }
 });
  ````

##### 403 - Unauthorized
It fires when doing an unauthorized query (ex. requesting the statement of a wallet not own by the logged user).
This error always respond with a text that must be show to the user, by using a modal, an alert or any other means. We recommend to declare a global function for the error.

 ````js
 gwApi.initialize({
     appKey: '1234567890',
     error403: function (response) {
         alert(response.message);
     }
 });
  ````
  
##### 417 - PIN required
Documentation in progress...



#### DEVELOPING

Read this only if you are a collaborator of this repo.

````
npm install
````

Make your modifications inside *src* folder. Run ````grunt```` command to compile a new version. Push to repo.