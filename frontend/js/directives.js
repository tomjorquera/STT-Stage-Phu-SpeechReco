'use strict';

/* Directives */
angular.module('myApp.directives', ['chart.js']).
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
					$scope.uploadByDragging(uploadFile);					
				}
				//upload funtion uses the Upload object and upload methode of angular-file-upload
				$scope.uploadByDragging = function (file) {
					$scope.convertMsg='';
					console.log(clientDistinct.getNameClient());
            		if (clientDistinct.getNameClient() === 'unknown'){
            			clientDistinct.setNameClient(getRandomString());
            		}
					if (file.type === "audio/wav"){
			        	$scope.uploadAudioStatus=file.name+" was uploaded";
			        	var filename = clientDistinct.getNameClient()+'.wav';
			        	Upload.upload({
				            url: 'upload/stream/'+filename,
				            method: 'POST',
				            file: file
			        	});
			        }
			        else if (file.type === "text/plain"){
			        	$scope.uploadTextStatus=file.name+" was uploaded";
			        	var filename = clientDistinct.getNameClient()+'.txt';
			        	Upload.upload({
				            url: 'upload/stream/'+filename,
				            method: 'POST',
				            file: file
			        	});
            		}
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
                	$scope.convertMsg='';
                	if(file !== null){
                		console.log(clientDistinct.getNameClient());
                		if (clientDistinct.getNameClient() === 'unknown'){
                			clientDistinct.setNameClient(getRandomString());
                		}
	                	if (file.type === "audio/wav"){
				        	$scope.uploadAudioStatus=file.name+" was uploaded";
				        	filename = clientDistinct.getNameClient()+'.wav';
				        	Upload.upload({
					            url: 'upload/stream/'+filename,
					            method: 'POST',
					            file: file
				        	});
				        }
				        else if (file.type === "text/plain"){
				        	$scope.uploadTextStatus=file.name+" was uploaded";
				        	filename = clientDistinct.getNameClient()+'.txt';
				        	Upload.upload({
					            url: 'upload/stream/'+filename,
					            method: 'POST',
					            file: file
				        	});
	            		}
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
			controller: function($scope, toolSelectedFactory, dataResult, seriesDraw){
				var inputType = location.href.substr(location.href.lastIndexOf('/'));
				console.log(inputType);
    			$scope.tools = ["Sphinx-4","Kaldi"];
    			$scope.selectionTool = toolSelectedFactory.getSelectedTool();
    			//update the tool variable and the link variable in toolSelectedFactory. 
    			//The transcribe directive will use the link variable to send request to server
    			$scope.setTool = function(tool){
    				switch (inputType) {
    					case "/corpus":
    						if (toolSelectedFactory.getSelectedTool().length === 0){
    							dataResult.clear();
    						}
	    					if (toolSelectedFactory.getSelectedTool().indexOf(tool) > -1){
		    					toolSelectedFactory.rmSelectedTool(tool);
		    					seriesDraw.rmSeries(tool);
		    					$scope.selectionTool = toolSelectedFactory.getSelectedTool();
		    					console.log($scope.selectionTool);
		    				}
			      			else {
			      				toolSelectedFactory.setSelectedTool(tool);
			      				seriesDraw.setSeries(tool);
			      				$scope.selectionTool = toolSelectedFactory.getSelectedTool();
			      				console.log($scope.selectionTool);
			      			}
			      			break;
			      		case "/audiofile":
			      			toolSelectedFactory.clearList();
			      			toolSelectedFactory.setSelectedTool(tool);
		      				$scope.selectionTool = toolSelectedFactory.getSelectedTool();
		      				console.log($scope.selectionTool);
		      				break;
		      			default:
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
				var transcribeButton = document.getElementById('transcribe-button');
			
				//take result if it's sent by socket (for kaldi case)
				mySocket.on('send msg audio',function(data){	
					$scope.isShow = false;
					$scope.transcribedText = data.transcribedText;
					//affichage de comparaison
					if (data.compareObject !== undefined){
					  if (data.compareObject !== ""){
					      var display = document.getElementById("compareObject");
					      display.innerHTML = "&bull; Compare text here : ";
					      data.compareObject.forEach(function(part){
					        // green for additions, red for deletions
					        // black for common parts
					        var color = part.added ? 'green' :
					          part.removed ? 'red' : 'black';
					        var span = document.createElement('span');
					        span.style.color = color;
					        span.appendChild(document.createTextNode(part.value));
					        if (part.removed) span.appendChild(document.createTextNode(' '));
					        display.appendChild(span);
					      });
					      $scope.originalText = data.originalTextExport;
					   }
					   else {
					   		$scope.originalText = "Missing!!";
					   		var display = document.getElementById("compareObject");
						    display.innerHTML = "Text file is missing so we can not campare it";
					   }
					}
					
					transcribeButton.removeAttribute("disabled");
				});	
				mySocket.on('send error audio', function(data){
					$scope.isShow = false;
					$scope.transcribedText = data.transcribedText;
					var display = document.getElementById("compareObject");
					display.innerHTML = "";
					$scope.originalText = "";
					transcribeButton.removeAttribute("disabled");
				});

				//function executes when clicking transcribe button
				$scope.transcribeRequest =function (){
					var tool = toolSelectedFactory.getSelectedTool()[0];
					//if tool is not choosen, just give the error msg and end
					if (toolSelectedFactory.getSelectedTool()===[]) {
						$scope.errorMessage = "Choose a toolkit before!";
						return 0;
					}; 
					//if the toolkit is kaldi, create a socket to server
					if (tool === "Kaldi"){
						mySocket.connect('http://localhost:8080/',{'forceNew':true });
					}
					//if the toolkit is sphinx-4, disconnect the socket
					if (tool === "Sphinx-4"){
						mySocket.disconnect();
						console.log('socket disconnected');
					}
					//reset error message
					$scope.errorMessage ="";
					//disable the transcribe button to make sure client can not click it twice
					transcribeButton.setAttribute("disabled", true);
					//show loading icon and hide the transcribe zone
					$scope.isShow = true;						
					//reset all part of transcribe template
					document.getElementById("compareObject").innerHTML = "&bull; Compare text here :";
					$scope.transcribedText = "";
					$scope.originalText = "";
					//send request to server
					$http({
				      method: 'GET',
				      url: '/transcribe/'+tool+'/audio/'+clientDistinct.getNameClient()
				    }).
				    success(function(data, status, headers, config) {
				      console.log('requete accepte');
				      if (tool === "Sphinx-4"){
				      	mySocket.connect('http://localhost:8080/',{'forceNew':true });
				      }
				    }).
				    error(function(data, status, headers, config) {
				      $scope.transcribedText = 'Error!';
				      $scope.isShow = false;
				      transcribeButton.removeAttribute("disabled");
				    });
				}	
			},
		}
	}).
	directive('transcribeMicro', function(){
		return{
			restrict: 'E',
			templateUrl: 'partials/transcribe-micro',
			controller: function($scope, $http, toolSelectedFactory, mySocket, clientDistinct){
				var tool = toolSelectedFactory.getSelectedTool()[0];
				//scope.isShow decide show or hide the loading icon and the transcribe text part
				//isShow = false => transcribe text part is showed and loading icon is hided
				$scope.isShow = false;
				var transcribeButton = document.getElementById('transcribe-button');

				//take result if it's sent by socket (for kaldi case)
				mySocket.on('send msg micro',function(data){	
					$scope.isShow = false; 
					$scope.errorMessage=""; 
					console.log(data.transcribedText);
					$scope.transcribedText = data.transcribedText;
					transcribeButton.removeAttribute("disabled");
				})

				//function executes when clicking transcribe button
				$scope.transcribeRequest =function (){
					//if tool is not choosen, just give the error msg and end
					if (toolSelectedFactory.getSelectedTool()===[]) {
						$scope.errorMessage = "Choose a toolkit before!";
						return 0;
					};
					//if the toolkit is kaldi, create a socket to server
					if (tool === "Kaldi"){
						mySocket.connect('http://localhost:8080/',{'forceNew':true });
					}
					//if the toolkit is sphinx-4, disconnect the socket
					if (tool === "Sphinx-4"){
						mySocket.disconnect();
					}
					$scope.errorMessage="";
					//disable the transcribe button to make sure client can not click it twice
					transcribeButton.setAttribute("disabled", true);

					//clear error message and show loading icon
					$scope.errorMessage ="";
					$scope.isShow = true;
					//sent request
					$http({
				      method: 'GET',
				      url: '/transcribe/'+tool+'/micro/'+clientDistinct.getNameClient()
				    }).
				    success(function(data, status, headers, config) {
				      	if (tool === "Sphinx-4"){
					      	mySocket.connect('http://localhost:8080/',{'forceNew':true });
					    }
				    }).
				    error(function(data, status, headers, config) {
				      	$scope.transcribedText = 'Error!';
				      	$scope.isShow = false;
				      	transcribeButton.removeAttribute("disabled");
				    });
				}
			}
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
			controller: function($scope, $http){
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
			    	if (toolSelectedFactory.getSelectedTool() !== 'unknown'){
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
	}).
	directive('chooseCorpus',function(){
		return {
			restrict:'E',
			templateUrl: 'partials/choose-corpus',
			controller: function($scope,$http,choosedCorpus){
				$scope.guide =false;
				$scope.delMsg='';
				$http({
	      			method: 'GET',
	      			url: '/getcorpus'
	    		}).
        		success(function(data, status, headers, config) {
					//list corpus
					$scope.corpuses = data;
					//selected corpus
					$scope.selection = [];
        		}).
        		error(function(data, status, headers, config) {
	      			console.log('Error!');
	    		});
				//clear selected corpus list
	    		$scope.clearList = function(){
					for (var i=0;i<$scope.selection.length;i++){
						$scope.selection.pop();
					}
				};
				//method to get selected corpus
				$scope.chooseCorpusAction = function(corpus){
					$scope.delMsg = '\''+corpus+'\' corpus was selected';
					$scope.selection.push(corpus);
					choosedCorpus.setCorpusName(corpus);
				};
				//delete corpus
				$scope.delCorpus = function(){
					$scope.delMsg='';
					var corpusCible = $scope.selection.pop();
					$http({
	      				method: 'GET',
	      				url: '/delcorpus/'+corpusCible
		    		}).
	        		success(function(data, status, headers, config) {
	        			$scope.delMsg='\''+corpusCible+'\' was deleted';
	        			$http({
			      			method: 'GET',
			      			url: '/getcorpus'
			    		}).
		        		success(function(data, status, headers, config) {
							//list corpus
							$scope.corpuses = data;
							//selected corpus
							$scope.selection = [];
		        		}).
		        		error(function(data, status, headers, config) {
			      			console.log('Error!');
		    			});
	        		}).
	        		error(function(data, status, headers, config) {
		      			console.log('Error!');
		    		});
				}
			}
		}
	}).
	directive('transcribeCorpus',function(){
		return {
			restrict:'E',
			templateUrl: 'partials/transcribe-corpus',
			controller: function($scope,$http,toolSelectedFactory,choosedCorpus, mySocket, dataResult){
				$scope.showIcon = false;
				$scope.errorMsg;
				$scope.average;
				var transcribeButton = document.getElementById('transcribe-button');
				var result = document.getElementById('res');
				var werSum;
				var numAudio;
				var precisionSum;
				var recallSum;
				var fScoreSum;
				//take result if it's sent by socket (for kaldi case)
				mySocket.on('send msg',function(data){	
					console.log('recoie un message from server');
					numAudio += 1;
					var br = document.createElement("br");
					var info = document.createTextNode('Audio '+numAudio+' - WER: '+data.WER+', Precision: '+data.precision+', Recall: '+data.recall+', F-Score: '+data.fScore);
					result.appendChild(info);
					result.appendChild(br);
					werSum += parseFloat(data.WER);
					precisionSum += parseFloat(data.precision);
					recallSum += parseFloat(data.recall);
					fScoreSum += parseFloat(data.fScore);	
					
				});	
				mySocket.on('send last msg', function(data){
					console.log('recoie dernier message from server');
					numAudio += 1;
					var info = document.createTextNode('Audio '+numAudio+' - WER: '+data.WER+'/Precision: '+data.precision+'/Recall: '+data.recall+'/F-Score: '+data.fScore);
					result.appendChild(info);
					werSum += parseFloat(data.WER);
					precisionSum += parseFloat(data.precision);
					recallSum += parseFloat(data.recall);
					fScoreSum += parseFloat(data.fScore);
					//average
					var averageWer = werSum/parseFloat(numAudio);
					var averagePrecision = precisionSum/parseFloat(numAudio);
					var averageRecall = recallSum/parseFloat(numAudio);
					var averageFScore = fScoreSum/parseFloat(numAudio);
					dataResult.setValue(averageWer.toFixed(3)*100,
										averagePrecision.toFixed(3)*100,
										averageRecall.toFixed(3)*100,
										averageFScore.toFixed(3)*100);
					$scope.showIcon = false;
					transcribeButton.removeAttribute("disabled");
				});

				mySocket.on('error', function(data){
					$scope.showIcon = false;
					transcribeButton.removeAttribute("disabled");
					$scope.errorMsg = data.toString();
				});

				//function when click transcribe button
				$scope.requestAction = function(){
					werSum = 0;
					numAudio = 0;
					precisionSum = 0;
					recallSum = 0;
					fScoreSum = 0;
					$scope.average ='';
					switch ((toolSelectedFactory.getSelectedTool()).length){
					 	case 0:
					 		$scope.errorMsg="Have you choosen a tool yet?";
					 		break;
					 	case 1:
					 		var tool = toolSelectedFactory.getSelectedTool()[0];
					 		//if the toolkit is sphinx-4, disconnect the socket
							gestionSocket(tool);
							//verify if error cases
							if (choosedCorpus.getCorpusName() === "unknown"){
								$scope.errorMsg="Have you choosen a corpus yet?";
							}
							else {
								//disable the transcribe button to make sure client can not click it twice
								transcribeButton.setAttribute("disabled", true);				
								$scope.errorMsg="";
								$scope.showIcon = true;
								result.innerHTML="";
								$http({
					      			method: 'GET',
					      			url: '/transcribecorpus/'+tool+'/'+choosedCorpus.getCorpusName(),
					    		}).
			            		success(function(data, status, headers, config) {
			            			//request sent
			            			console.log('transcribe corpus request sent');
			            			//affichage de result
			            			if (tool === "Sphinx-4"){
			            				mySocket.connect('http://localhost:8080/',{'forceNew':true });
				            		}

			            		}).
			            		error(function(data, status, headers, config) {
			            			$scope.showIcon = false;
			            			transcribeButton.removeAttribute("disabled");
			            			console.log('transcribe corpus request error');
					    		});
					    	}
					    	toolSelectedFactory.rmSelectedTool(tool);
					    	break;
					    case 2:
					    	var tool = toolSelectedFactory.getSelectedTool()[0];
					 		//if the toolkit is sphinx-4, disconnect the socket
							gestionSocket(tool);
							//verify if error cases
							if (choosedCorpus.getCorpusName() === "unknown"){
								$scope.errorMsg="Have you choosen a corpus yet?";
							}
							else {
								//disable the transcribe button to make sure client can not click it twice
								transcribeButton.setAttribute("disabled", true);				
								$scope.errorMsg="";
								$scope.showIcon = true;
								result.innerHTML="";
								$http({
					      			method: 'GET',
					      			url: '/transcribecorpus/'+tool+'/'+choosedCorpus.getCorpusName(),
					    		}).
			            		success(function(data, status, headers, config) {
			            			//request sent
			            			console.log('transcribe corpus request sent');
			            			//affichage de result
			            			mySocket.connect('http://localhost:8080/',{'forceNew':true });
			            		}).
			            		error(function(data, status, headers, config) {
			            			$scope.showIcon = false;
			            			transcribeButton.removeAttribute("disabled");
			            			console.log('transcribe corpus request error');
					    		});
					    	}
					    	toolSelectedFactory.rmSelectedTool(tool);
					    	$scope.errorMsg = "If you wanted to campaire 2 toolkits, click transcribing once more";
					    	break;
					    default:
					    	break;
					};
				};
				function gestionSocket(tool){
					if (tool === "Sphinx-4"){
						mySocket.disconnect();
					}
					//if the toolkit is kal, connect the socket
					else if (tool === "Kaldi"){
						mySocket.connect('http://localhost:8080/',{'forceNew':true });
					}
				}
			}
		}
	}).
	directive('createCorpus',function(){
		return {
			restrict:'E',
			templateUrl: 'partials/create-corpus',
			controller: function($scope,$http,Upload,corpusName){
				$scope.next = false;

				$scope.uploadAudios = function(files){
					files.forEach(function(file){
						Upload.upload({
				            url: 'uploadfiles/audiofiles/'+corpusName.getName(),
				            method: 'POST',
				            file: file
			        	});
					})
					console.log(corpusName.getName());
					$scope.uploadAudioMsg = "Audios uploaded"
				}
				$scope.uploadTexts = function(files){
					files.forEach(function(file){
						Upload.upload({
				            url: 'uploadfiles/textfiles/'+corpusName.getName(),
				            method: 'POST',
				            file: file
			        	});
					})
					$scope.uploadTextMsg = "Texts uploaded"
				}
				$scope.uploadKeywords = function(files){
					files.forEach(function(file){
						Upload.upload({
				            url: 'uploadfiles/keywordsfiles/'+corpusName.getName(),
				            method: 'POST',
				            file: file
			        	});
					})
					$scope.uploadKeywordsMsg = "Keywords uploaded";
				}
				$scope.clearZone = function(){
					$scope.next = false;
					$scope.text = '';
					$scope.msg = '';
				}
				$scope.submit = function() {
					$scope.doneMsg = "";
					corpusName.setName($scope.text);
					console.log(corpusName.getName());	
					$http({
		      			method: 'GET',
		      			url: '/createcorpus/'+corpusName.getName(),
		    		}).
            		success(function(data, status, headers, config) {
            			$scope.msg = "Corpus name valid";
            			$scope.next = true;
            		}).
            		error(function(data, status, headers, config) {
            			$scope.msg = 'Error create corpus. Your corpus name is used. Choose another one';
		    		});
				}
				$scope.done = function(){
					$http({
		      			method: 'GET',
		      			url: '/addcontent/'+corpusName.getName(),
		    		}).
            		success(function(data, status, headers, config) {
            			$scope.doneMsg = "Creating corpus successfully";
            			$scope.uploadAudioMsg = '';
            			$scope.uploadTextMsg = '';
            			$scope.uploadKeywordsMsg = '';
            			$scope.msg = '';
            			$scope.text = '';
            			$http({
			      			method: 'GET',
			      			url: '/getcorpus'
			    		}).
		        		success(function(data, status, headers, config) {
							//list corpus
							$scope.corpuses = data;
							//selected corpus
							$scope.selection = [];
		        		}).
		        		error(function(data, status, headers, config) {
			      			console.log('Error!');
		    			});
            		}).
            		error(function(data, status, headers, config) {
            			$scope.msg = 'Error create corpus';
		    		});
				}
			}
		}
	}).
	directive('drawChart',function(){
		return {
			restrict:'E',
			templateUrl: 'partials/draw-chart',
			controller: function($scope, dataResult, toolSelectedFactory,seriesDraw){
				$scope.showDiag = false;
				$scope.msgDiag = "Transcribing a corpus before drawing its diagram";
				$scope.series = seriesDraw.getSeries();
				$scope.draw =function(){
					var data = dataResult.getValue();
					if($scope.series.length === 1){
						if (!data[0].stat){
							$scope.msgDiag = "Transcribing a corpus before drawing its diagram";
							$scope.showDiag = false;
						}else if($scope.series.length === 1){
							var values = data[0].value;
							$scope.msgDiag = "";
							$scope.showDiag = true;
							$scope.labels = ['WER', 'Precision', 'Recall', 'F-Score'];
							$scope.data = [
							    [values[0].toFixed(1), values[1].toFixed(1), values[2].toFixed(1), values[3].toFixed(1)]
							];
						} 
					} else if($scope.series.length === 2){
						if (data[0].stat && data[1].stat){
							var values1 = data[0].value;
							var values2 = data[1].value;
							$scope.msgDiag = "";
							console.log($scope.series);
							$scope.showDiag = true;
							$scope.series = ["Sphinx-4","Kaldi"];
							$scope.labels = ['WER', 'Precision', 'Recall', 'F-Score'];
							$scope.data = [
							    [values1[0].toFixed(1), values1[1].toFixed(1), values1[2].toFixed(1), values1[3].toFixed(1)],
							    [values2[0].toFixed(1), values2[1].toFixed(1), values2[2].toFixed(1), values2[3].toFixed(1)]
							];
						}
						else{
							$scope.msgDiag = "Transcribing a corpus before drawing its diagram";
							console.log($scope.series);
							$scope.showDiag = false;
						} 
					}
				}
			}
		}
	})





















