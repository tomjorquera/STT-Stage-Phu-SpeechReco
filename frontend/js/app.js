'use strict';

// Declare app level module which depends on filters, and services

angular.module('myApp', [
  'ngRoute',
  'myApp.controllers',
  'myApp.filters',
  'myApp.services',
  'myApp.directives'
]).
config(function($routeProvider, $locationProvider) {
  $routeProvider.
    when('/audiofile', {
      templateUrl: 'partials/partial1',
      controller: 'MyCtrl1'
    }).
    when('/yourmicro', {
      templateUrl: 'partials/partial2',
      controller: 'MyCtrl2'
    }).
    when('/corpus', {
      templateUrl: 'partials/partial2',
      controller: 'MyCtrl2'
    }).
    otherwise({
      templateUrl: 'partials/partial2'
    });

  $locationProvider.html5Mode(true);
});
