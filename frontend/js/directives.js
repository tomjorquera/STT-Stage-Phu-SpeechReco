'use strict';

/* Directives */
angular.module('myApp.directives', []).
	directive('appName', function(appname) {
		return function(scope, elm, attrs) {
		  elm.text(appname);
		};
	}).
	directive('dragBox', function(){
		return {
			restrict: 'E',
			templateUrl: 'partials/drag-box',
			controller: function(){
				//Changement de la couleur
				var el = document.querySelector('#drop');
				el.ondragover = function() {
					this.className = "hover";
					this.innerHTML = "Drop the file";
					return false;
				}

				el.ondragleave =  function(){
					this.className = "";
					this.innerHTML = "Drop the icon here";
					return false;
				}

				el.ondrop = function(e){
					e.preventDefault();
					this.className="";
					this.innerHTML = "Drop the icon here";

					//uploading file
					//var uploadFile = e.dataTransfer.files[e.dataTransfer.files.length-1];

					//document.forms["uploadForm"].append('<input type="hidden" name="myparam " value="{{uploadFile}}" />')
					document.forms["uploadForm"].submit();
				}
			},
			controllerAs: 'dragbox',
		}
	}).
	directive('chooseFile', function(){
		return {
			restrict: 'E',
			templateUrl: 'partials/choose-file',
			controller: function($scope){
				var uploadStatus = document.getElementById('uploadStatus');
				document.getElementById('uploadButton').addEventListener('click', function(){
					if ((document.getElementById('myfile').files.length !== 0)){
						document.forms["uploadForm"].submit();
						uploadStatus.innerHTML = "File was uploaded.";
					} else {
						uploadStatus.innerHTML = "Choose a file first.";
					}
				});
			}
		}
	});
