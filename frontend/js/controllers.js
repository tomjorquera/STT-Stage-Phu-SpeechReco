'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('AppCtrl', function($scope, $http, appname) {

    $http({
      method: 'GET',
      url: '/api/name'
    }).
    success(function(data, status, headers, config) {
      $scope.name = appname;
    }).
    error(function(data, status, headers, config) {
      $scope.name = 'Error!';
    })

  /* $http({
      method: 'GET',
      url: '/testnodeJava/os'
    }).
    success(function(data, status, headers, config) {
      $scope.osName = data.osJava;
    }).
    error(function(data, status, headers, config) {
      $scope.osName = 'Error!';
    });*/
  }).

  controller('MyCtrl1', function($scope) {
    // write Ctrl here

  }).
  controller('MyCtrl2', function($scope) {
    // write Ctrl here

  }).
  controller('inputChosenController',function($scope){
    $scope.chooseValue = 0;
    $scope.link ="";
    $scope.chooseOptions = [{value:1,name:"Audio File"},{value:2,name:"Your micro"},{value:3,name:"Corpus"}];//pas encore choisir
    $scope.setValue = function(option){
      $scope.chooseValue = option.value;
    };
    $scope.setLink = function(value){
      switch (value) {
        case 1 :
          $scope.link ="audiofile";
          break;
        case 2 :
          $scope.link ="yourmicro";
          break;
        case 3 :
          $scope.link ="corpus";
          break;
        default:
          $scope.link ="";
          break;
    };
  };
});
