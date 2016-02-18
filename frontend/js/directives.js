'use strict';

/* Directives */
angular.module('myApp.directives', []).
	directive('appName', function(appname) {
		return function(scope, elm, attrs) {
		  elm.text(appname);
		};
	}).
	//the drag zone the choose file
	directive('dragBox', function(){
		return {
			restrict: 'E',
			templateUrl: 'partials/drag-box',
			controller: function($scope, Upload, clientDistinct){
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
					var uploadFile = e.dataTransfer.files[e.dataTransfer.files.length-1];
					$scope.upload(uploadFile);					
				}
				//upload funtion uses the Upload object and upload methode of angular-file-upload
				$scope.upload = function (file) {
					$scope.uploadAudioStatus="";
					$scope.uploadTextStatus="";
					if (file.type === "audio/wav" && clientDistinct.getNameClient() === 'unknown'){
			        	$scope.uploadAudioStatus=file.name+" was uploaded";
			        	clientDistinct.setNameClient(getRandomString()+'.wav');
			        }
			        else if (file.type === "text/plain" && clientDistinct.getNameClient() === 'unknown'){
			        	$scope.uploadTextStatus=file.name+" was uploaded";
			        	clientDistinct.setNameClient(getRandomString()+'.txt');
            		}
			        Upload.upload({
			            url: 'upload/stream/'+clientDistinct.getNameClient(),
			            method: 'POST',
			            file: file
			        });
			    };
			},
		}
		//fonction create random name
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
	}).
	//choose file by button
	directive('chooseFile', function(){
		return {
			restrict: 'E',
			templateUrl: 'partials/choose-file',
			controller: function($scope, Upload, clientDistinct){
				$scope.uploadAudioStatus="";
				$scope.uploadTextStatus="";
				var filename = "";
                $scope.upload = function (file) {
                	if(file !== null){
                		if (clientDistinct.getNameClient() === 'unknown'){
                			clientDistinct.setNameClient(getRandomString());
                		}
	                	if (file.type === "audio/wav"){
				        	$scope.uploadAudioStatus=file.name+" was uploaded";
				        	filename = clientDistinct.getNameClient()+'.wav';
				        }
				        else if (file.type === "text/plain"){
				        	$scope.uploadTextStatus=file.name+" was uploaded";
				        	filename = clientDistinct.getNameClient()+'.txt';
	            		}
				        Upload.upload({
				            url: 'upload/stream/'+filename,
				            method: 'POST',
				            file: file
				        });
				        
				    }
			    }; 
			}
		}
		//fonction create random name
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
	}).
	//choose tool directive links to choose-tool template
	directive('chooseTool', function(){
		return {
			restrict: 'EA',
			templateUrl: 'partials/choose-tool',
			controller: function($scope, toolSelectedFactory){
				$scope.chooseValue = 0;
    			$scope.chooseTools = [{value:1,name:"Sphinx-4"},{value:2,name:"Kaldi"},{value:3,name:"pocketSphinx"}];
    			//update choosen tool after choosing
    			$scope.setValue = function(value){
      				$scope.chooseValue = value;
    			};
    			//update the tool variable and the link variable in toolSelectedFactory. 
    			//The transcribe directive will use the link variable to send request to server
    			$scope.setTool = function(tool){
	      			toolSelectedFactory.setSelectedTool(tool);
	      			toolSelectedFactory.setTranscribeLink();
				};
				//message show to user after choosing the tool
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
	//transcribe directive that sent request of transcribing audio to server
	directive('transcribeAudio',function(){
		return {
			restrict: 'E',
			templateUrl: 'partials/transcribe-audio',
			controller: function($scope, $http, toolSelectedFactory, mySocket, clientDistinct){
				//scope.isShow decide show or hide the loading icon and the transcribe text part
				//isShow = false => transcribe text part is showed and loading icon is hided
				$scope.isShow = false;
				//adr varible is the url part that makes we know what input is choose
				var adr = location.href.substr(location.href.lastIndexOf('/'));
				var transcribeButton = document.getElementById('transcribe-button');
			
				//take result if it's sent by socket (for kaldi case)
				mySocket.on('send msg',function(data){	
					if (adr === '/audiofile'){
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
						   else {
						   		var display = document.getElementById("compareObject");
							    display.innerHTML = "Text file is missing so we can not campare it";
						   }
						}
					}
					else if (adr === '/yourmicro'){
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
					}
					mySocket.disconnect();
					transcribeButton.removeAttribute("disabled");
				});	
				mySocket.on('send error', function(data){
					$scope.isShow = false;
					$scope.transcribedText = data.transcribedText;
					var display = document.getElementById("compareObject");
					display.innerHTML = "";
					$scope.originalText = "";
					transcribeButton.removeAttribute("disabled");
					mySocket.disconnect();
				});
				mySocket.disconnect();
				//function executes when clicking transcribe button
				$scope.trancribeRequest =function (){
					//if tool is not choosen, just give the error msg and end
					if (toolSelectedFactory.getTranscribeLink()==='') {
						$scope.errorMessage = "Choose a toolkit before!";
						return 0;
					};
					//if the toolkit is kaldi, create a socket to server
					if (toolSelectedFactory.getTranscribeLink() === "/transcribe/kaldi"){
						mySocket.connect('http://localhost:8080/',{'forceNew':true });
					}
					//reset all upload file status, convert status, error message
					$scope.uploadAudioStatus="";
					$scope.uploadTextStatus="";
					$scope.convertMsg="";
					$scope.errorMessage ="";
					//disable the transcribe button to make sure client can not click it twice
					transcribeButton.setAttribute("disabled", true);
					//when input choosen is audio file
					if (adr === '/audiofile'){
						//show loading icon and hide the transcribe zone
						$scope.isShow = true;						
						//reset all part of transcribe template
						document.getElementById("compareObject").innerHTML = "Compare text here :";
						$scope.transcribedText = "";
						$scope.originalText = "";
						//send request to server
						$http({
					      method: 'GET',
					      url: toolSelectedFactory.getTranscribeLink()+'/audio/'+clientDistinct.getNameClient()
					    }).
					    success(function(data, status, headers, config) {
					      console.log('requete accepte');
					      //take result when it's sent by res.json (sphinx4 case)
					      if (toolSelectedFactory.getTranscribeLink() === "/transcribe/sphinx4"){
					      	console.log(data.transcribedText); 
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
							   } else {
							   		var display = document.getElementById("compareObject");
							    	display.innerHTML = "Text file is missing so we can not campare it";
							   }
							}
							else {
								$scope.errorMessage = "Any error happends so the compare object is undefined";
							}
							transcribeButton.removeAttribute("disabled");
					      }
					    }).
					    error(function(data, status, headers, config) {
					      $scope.transcribedText = 'Error!';
					      transcribeButton.removeAttribute("disabled");
					    });
					}
					else if (adr === '/yourmicro'){
						//clear error message and show loading icon
						$scope.errorMessage ="";
						$scope.isShow = true;
						//sent request
						$http({
					      method: 'GET',
					      url: toolSelectedFactory.getTranscribeLink()+'/micro'+clientDistinct.getNameClient()
					    }).
					    success(function(data, status, headers, config) {
							//take result when it's sent by res.json (sphinx4 case)
					      	if (toolSelectedFactory.getTranscribeLink() === "/transcribe/sphinx4"){
								$scope.isShow = false;
								$scope.errorMessage=""; 
								console.log(data.transcribedText);
								$scope.transcribedText = data.transcribedText;
								//affichage de comparaison
								var display = document.getElementById("compareObject");
								display.innerHTML = "Compare text here : "+data.compareObject;
								//$scope.compareObject = data.compareObject;
								$scope.originalText = data.originalTextExport;
								transcribeButton.removeAttribute("disabled");
							}
					    }).
					    error(function(data, status, headers, config) {
					      $scope.transcribedText = 'Error!';
					      transcribeButton.removeAttribute("disabled");
					    });
					}
				}	
			},
		}
	}).
	//record audio application
	directive('audioRecord',function(){
		return{
			restrict:'E',
			templateUrl: 'partials/audio-record',
			controller: function($scope, $http, clientDistinct){
				//get element in the template
				var startRecording = document.getElementById('start-recording');
				var stopRecording = document.getElementById('stop-recording');
				var audioPreview = document.getElementById('audio-preview');
				var audio = document.querySelector('audio');
				var recordAudio;
				var audioRecordedFile;
				//when stat recording
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
				    		//Record RTC is an object in recordrtc component of angular
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
        				recordAudio.getDataURL(function(audioDataURL) {
            				//postFiles(audioDataURL);
			                audioRecordedFile = {
			            		type: 'audio/wav',
			            		contents: audioDataURL
			    			};
			    			//play preview
			    			audioPreview.src = audioDataURL;
                    		audioPreview.play();

                    		//post file
                    		clientDistinct.setNameClient(getRandomString());
                    		$http({
				      			method: 'POST',
				      			url: '/upload/file/'+clientDistinct.getNameClient(),
								data: JSON.stringify(audioRecordedFile)
				    		}).
                    		success(function(data, status, headers, config) {
                    			console.log("sent ok");
                    		}).
                    		error(function(data, status, headers, config) {
				      			console.log('Error!');
				    		});
				    		//clear button and update message after recording
				    		stopRecording.disabled = true;
				    		startRecording.disabled = false;
				    		document.getElementById('recordStatus').innerHTML = "Your recording was saved on my server"+"<br>" 
				    		+"Now, you could choose a toolkit and click transcribe button to transcribe it or listen to the preview above";
		    			});
    				});	
                };
    			//fonction create random name for each recorded audio file
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
			controller: function($scope, $http, toolSelectedFactory, clientDistinct){
				$scope.showIcon = false;
				$scope.convertMsg;
			    $scope.convertAudio = function(){
			    	$scope.convertMsg ="";
			    	if (toolSelectedFactory.getSelectedTool() !== ''){
				    	$scope.showIcon = true;
				    	var toolName = toolSelectedFactory.getSelectedTool();
						var inputType = location.href.substr(location.href.lastIndexOf('/'));
						console.log('/convert/'+toolName+inputType+'/'+clientDistinct.getNameClient());
				    	$http({
			      			method: 'GET',
			      			url: '/convert/'+toolName+inputType+'/'+clientDistinct.getNameClient(),
			    		}).
	            		success(function(data, status, headers, config) {
	            			$scope.showIcon = false;
	            			console.log(data.convertMsg);
	            			$scope.convertMsg = data.convertMsg;
	            		}).
	            		error(function(data, status, headers, config) {
	            			$scope.showIcon = false;
	            			$scope.convertMsg = data.convertMsg;
			      			console.log('Error!');
			    		});
	            	}
	            	else $scope.convertMsg = 'Have you chosen a toolkit yet?';
				}
			}
		};
	})





















