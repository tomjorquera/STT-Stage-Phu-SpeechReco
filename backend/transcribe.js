exports.transcribedText = function(req, res) {
 	var java = require('java');
	var fs = require('fs-extra');
	var filePath = fs.readdirSync(__dirname+'/../upload/');
	var result;
	if (filePath.length !== 0){
    if(filePath[0].indexOf('.wav')!==-1){
    	//execute code java de sphinx-4 par node-java
   	 	var stt = java.import("AppTestSpeechReco");
    	var appSpeech = new stt();
    	result = appSpeech.transcribeSync(__dirname+'/../upload/'+filePath[0]);
    	fs.unlinkSync(__dirname+'/../upload/'+filePath[0]);
    }else{result="Uploaded file is not an audio one. Choose another..."}
  } else {result = "Upload a file first...";}
	res.json({
 		transcribedText: result,
 	});
 };