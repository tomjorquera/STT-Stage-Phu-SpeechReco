'use strict';

//var glo
function File(path, visible){
	this.path = path;
	this.visible = visible;
};

var file = new File("null",false);

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
					var transcribedText = document.getElementById('transcribedText');
					transcribedText.innerHTML = "Transcribed text here: ";
					file.path = e.dataTransfer.files[e.dataTransfer.files.length-1].path;
					var testAudio = file.path.indexOf(".wav");
					if (testAudio !== -1) {		
						audioPath.innerHTML = "Audio path: "+file.path;
						audioPath.className = 'hover';
					} else {
						audioPath.innerHTML = "Le fichiez que vous avez choisi n'est pas un audio. Choisissez un audio.";
						audioPath.className = 'hover';
						file.path = "null";
					}
				}
			},
			controllerAs: 'dragbox',
		}
	}).
	directive('chooseFile', function(){
		return {
			restrict: 'E',
			templateUrl: 'partials/choose-file',
			controller: function(){
				//get path when cliking button
				document.getElementById("getPathButton").addEventListener("click", function(){
					//upload file
					//var uploadFile = document.getElementById('myfile').files[0];
					console.log();
					if (document.getElementById('myfile').files[0] !== undefined){
						var transcribedText = document.getElementById('transcribedText');
						transcribedText.innerHTML = "Transcribed text here: ";
						file.path = document.getElementById('myfile').files[0].path;
						var audioPath = document.getElementById('audioPath');
						audioPath.innerHTML = "Audio path: "+file.path;
						audioPath.className = 'hover';
						console.log(file.path);
						var testAudio = file.path.indexOf(".wav");
						if (testAudio !== -1) {		
							audioPath.innerHTML = "Audio path: "+file.path;
							audioPath.className = 'hover';
						} else {
							var audioPath= document.getElementById('audioPath');
							audioPath.innerHTML = "Le fichiez que vous avez choisi n'est pas un audio. Choisissez un audio.";
							audioPath.className = 'hover';
							file.path = "null"
						}
					}
				});
			},
			controllerAs: 'choosefile',
		}
	}).
	directive('transcribe',function(){
		return {
			restrict: 'EA',
			templateUrl: 'partials/transcribe',
			controller: function(){
				document.getElementById("transcribeBtn").addEventListener("click",function(){
					if (file.path !== "null"){
						//execute code java de sphinx-4 par node-java
						var stt = java.import("AppTestSpeechReco");
						var appSpeech = new stt();
						var result = appSpeech.transcribeSync(file.path);
						transcribedText.innerHTML = result;
					} else { transcribedText.innerHTML ="choisir d'abord un fichier d'audio";}
				});
			}
		}
	});
