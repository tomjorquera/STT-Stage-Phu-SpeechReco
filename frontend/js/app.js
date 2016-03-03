'use strict';

// Declare app level module which depends on filters, and services

angular.module('myApp', [
  'ngRoute',
  'myApp.controllers',
  'myApp.filters',
  'myApp.services',
  'myApp.factories',
  'myApp.directives',
  'ngFileUpload',
  'btford.socket-io',
  'chart.js'
]).
config(function($routeProvider, $locationProvider) {
  $routeProvider.
    when('/audiofile', {
      templateUrl: 'partials/audioFilePartial'
    }).
    when('/yourmicro', {
      templateUrl: 'partials/microPartial'
    }).
    when('/corpus', {
      templateUrl: 'partials/corpusPartial'
    }).
    otherwise({
      templateUrl: 'partials/acceuilPartial'
    });

  $locationProvider.html5Mode(true);
});
