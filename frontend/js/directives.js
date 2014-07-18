'use strict';

/* Directives */

angular.module('myApp.directives', []).
  directive('appName', function(appname) {
    return function(scope, elm, attrs) {
      elm.text(appname);
    };
  });
