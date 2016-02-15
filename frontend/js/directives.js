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
			controller: function($scope, Upload){
				//Changement de la couleur
				var el = document.querySelector('#drop');
				el.ondragover = function() {
					this.className = "hover";
					this.innerHTML = "Drop the file";
					return false;
				}
				el.ondragleave =  function(){
					this.className = "";
					this.innerHTML = "Drop your file here";
					return false;
				}
				el.ondrop = function(e){
					e.preventDefault();
					this.className="";
					this.innerHTML = "Drop your file here";
					//uploading file
					var uploadFile = e.dataTransfer.files[e.dataTransfer.files.length-1];
					$scope.upload(uploadFile);					
				}
				$scope.upload = function (file) {
					$scope.uploadAudioStatus="";
					$scope.uploadTextStatus="";
			        Upload.upload({
			            url: 'upload/stream',
			            method: 'POST',
			            file: file
			        })
			        if (file.type === "audio") 
			        	$scope.uploadAudioStatus="Audio file was uploaded";
			        else if (file.type === "text/plain")
			        	$scope.uploadTextStatus="Text file was uploaded";
			    };
			},
		}
	}).
	directive('chooseFile', function(){
		return {
			restrict: 'E',
			templateUrl: 'partials/choose-file',
			controller: function($scope, Upload){
				$scope.uploadAudioStatus="";
				$scope.uploadTextStatus="";
                $scope.upload = function (file) {
                	if(file !== null){
				        Upload.upload({
				            url: 'upload/stream',
				            method: 'POST',
				            file: file
				        });
				        if (file.type === "audio/wav") 
				        	$scope.uploadAudioStatus="Audio file was uploaded";
				        else if (file.type === "text/plain")
				        	$scope.uploadTextStatus="Text file was uploaded";
				    }
			    }; 
			}
		}
	}).
	directive('chooseTool', function(){
		return {
			restrict: 'EA',
			templateUrl: 'partials/choose-tool',
			controller: function($scope, toolSelectedFactory){
				$scope.chooseValue = 0;
    			$scope.chooseTools = [{value:1,name:"Sphinx-4"},{value:2,name:"Kaldi"},{value:3,name:"pocketSphinx"}];//pas encore choisir
    			$scope.messageVisible = false;
    			$scope.message = "";
    			$scope.setValue = function(value){
      				$scope.chooseValue = value;
    			};
    			$scope.setTool = function(tool){
	      			toolSelectedFactory.setSelectedTool(tool);
	      			toolSelectedFactory.setTranscribeLink();
				};
				$scope.showMessage = function(){
					switch ($scope.chooseValue) {
			        	case 1 :
			          		$scope.message = "Sphinx-4 toolkit was selected"
			          		$scope.messageVisible = true;
			          		break;
			        	case 2 :
			          		$scope.message = "Kaldi toolkit was selected"
			          		$scope.messageVisible = true;
			          		break;
			          	case 3 :
			          		$scope.message = "pocketSphinx toolkit was selected"
			          		$scope.messageVisible = true;
			          		break;
			        	default:
			          		$scope.selectedTool ="Please tell us which toolkit that you would like to use";
			          		$scope.messageVisible = true;
			          		break;
		    			};
				};
			}
		}
	}).
	directive('transcribeAudio',function(){
		return {
			restrict: 'E',
			templateUrl: 'partials/transcribe-audio',
			controller: function($scope, $http, toolSelectedFactory){
				$scope.isShow = false;
				var adr = location.href.substr(location.href.lastIndexOf('/'));
				if (adr === '/audiofile'){
					$scope.link=toolSelectedFactory.getTranscribeLink();
					document.getElementById('transcribeButton').addEventListener('click', function(){
						$scope.errorMessage ="";
						$scope.isShow = true;
						var link = toolSelectedFactory.getTranscribeLink();
						document.getElementById("compareObject").innerHTML = "Compare text here :";
						$scope.transcribedText = "";
						$scope.originalText = "";
						$http({
					      method: 'GET',
					      url: toolSelectedFactory.getTranscribeLink()+'/audio'
					    }).
					    success(function(data, status, headers, config) {
					      console.log(data.transcribedText);
					      $scope.uploadAudioStatus="";
						  $scope.uploadTextStatus="";
					      $scope.isShow = false;
					      $scope.transcribedText = data.transcribedText;
					      //affichage de comparaison
					      if (data.compareObject !== undefined){
						      if (data.compareObject !== ""){
							      var display = document.getElementById("compareObject");
							      display.innerHTML = "Compare text here : ";
							      data.compareObject.forEach(function(part){
							        // green for additions, red for deletions
							        // grey for common parts
							        var color = part.added ? 'green' :
							          part.removed ? 'red' : 'grey';
							        var span = document.createElement('span');
							        span.style.color = color;
							        span.appendChild(document
							          .createTextNode(part.value));
							        display.appendChild(span);
							      });
							      $scope.originalText = data.originalTextExport;
						       }
						   }
						  else $scope.errorMessage = "Choose a toolkit before!";
					    }).
					    error(function(data, status, headers, config) {
					      $scope.transcribedText = 'Error!';
					    });
					});
				}
				else if (adr === '/yourmicro'){
					$scope.link=toolSelectedFactory.getTranscribeLink();
					document.getElementById('transcribeButton').addEventListener('click', function(){
						document.getElementById("compareObject").innerHTML = "Compare text here :";
						$scope.errorMessage ="";
						$scope.isShow = true;
						var link = toolSelectedFactory.getTranscribeLink();
						$http({
					      method: 'GET',
					      url: toolSelectedFactory.getTranscribeLink()+'/micro'
					    }).
					    success(function(data, status, headers, config) {
					      $scope.isShow = false;
					      if (data.compareObject !== undefined){   
					      	  $scope.errorMessage=""; 
						      console.log(data.transcribedText);
						      $scope.transcribedText = data.transcribedText;
						      //affichage de comparaison
						      var display = document.getElementById("compareObject");
						      display.innerHTML = "Compare text here : "+data.compareObject;
						      //$scope.compareObject = data.compareObject;
						      $scope.originalText = data.originalTextExport;
						  }
						  else $scope.errorMessage = "Choose a toolkit before!";
					    }).
					    error(function(data, status, headers, config) {
					      $scope.transcribedText = 'Error!';
					    });
					});
				}
			},
		}
	}).
	directive('audioRecord',function(){
		return{
			restrict:'E',
			templateUrl: 'partials/audio-record',
			controller: function($scope, $http){
				var startRecording = document.getElementById('start-recording');
				var stopRecording = document.getElementById('stop-recording');
				var audioPreview = document.getElementById('audio-preview');
				var audio = document.querySelector('audio');
				var recordAudio;
				var audioRecordedFile;
				startRecording.onclick = function() {
					startRecording.disabled = true;
					document.getElementById('recordStatus').innerHTML="";
					navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);
					navigator.getUserMedia({
				        	audio: true
				    	}, 
				    	function(stream) {
				        	recordAudio = RecordRTC(stream, {
				        	    bufferSize: 16384,
								type: 'audio'
				        	});
				        	recordAudio.startRecording();
				    	}, 
				    	function(error) {
            				alert(JSON.stringify(error));
        				}	
        			);
      				stopRecording.disabled = false;			 	
				};
				stopRecording.onclick = function() {
					recordAudio.stopRecording(function() {
        				onStopRecording();
    				});
    				function onStopRecording() {
            			recordAudio.getDataURL(function(audioDataURL) {
            				//postFiles(audioDataURL);
            				var fileName = getRandomString();
			                audioRecordedFile = {
			            		name: fileName + '.wav',
			            		type: 'audio/wav',
			            		contents: audioDataURL
			    			};
			    			//play preview
			    			audioPreview.src = audioDataURL;
                    		audioPreview.play();
                    		//post file
                    		$http({
				      			method: 'POST',
				      			url: '/upload/file',
								data: JSON.stringify(audioRecordedFile)
				    		}).
                    		success(function(data, status, headers, config) {
                    			console.log("sent ok");
                    		}).
                    		error(function(data, status, headers, config) {
				      			console.log('Error!');
				    		});
				    		//clear button
				    		stopRecording.disabled = true;
				    		startRecording.disabled = false;

				    		//var href = location.href.substr(0, location.href.lastIndexOf('/') + 1);
				    		//var downloadLink = href+'upload/stream/'+fileName;
				    		document.getElementById('recordStatus').innerHTML = "Your recording was saved on my server"+"<br>" 
				    		+"Now, you could choose a toolkit and click transcribe button to transcribe it or listen to the preview above";
		    			});
		    		};	
                };
    				
				function getRandomString() {
	                if (window.crypto) {
	                    var a = window.crypto.getRandomValues(new Uint32Array(3)),
	                        token = '';
	                    for (var i = 0, l = a.length; i < l; i++) token += a[i].toString(36);
	                    return token;
	                } else {
	                    return (Math.random() * new Date().getTime()).toString(36).replace( /\./g , '');
	                }
	            };			
				
				startRecording.disabled = false;
	    		stopRecording.disabled = true;
            }
		};
	}).
	directive('chooseInput',function(){
		return {
			restrict: 'E',
			templateUrl: 'partials/choose-input',
			controller: function($scope){
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
				}
			}
		};
	}).
	directive('convertAudio',function(){
		return {
			restrict: 'E',
			templateUrl: 'partials/convert-audio',
			controller: function($scope, $http, toolSelectedFactory){
				$scope.showIcon = false;
				$scope.convertMsg;
			    $scope.convertAudio = function(){
			    	$scope.showIcon = true;
			    	var toolName = toolSelectedFactory.getSelectedTool();
					var inputType = location.href.substr(location.href.lastIndexOf('/'));
					console.log('/convert/'+toolName+inputType);
			    	$http({
		      			method: 'GET',
		      			url: '/convert/'+toolName+inputType,
		    		}).
            		success(function(data, status, headers, config) {
            			$scope.showIcon = false;
            			console.log(data.convertMsg);
            			$scope.convertMsg = data.convertMsg;
            		}).
            		error(function(data, status, headers, config) {
		      			console.log('Error!');
		    		});
				}
			}
		};
	})





















