"use strict";

exports.transcribeSphinx = function(req, res) {
	var fs = require('fs-extra');
	var selectedInput = req.params.inputtype;

	//get data necessary which are original text and audio file (record audio or internet audio)
	if (selectedInput === 'audio'){
	  	var textFile = getData("text");
	    var audioFile = getData("audio");
	}
	else if (selectedInput === 'micro')
		var audioFile = getData("micro");

	if (audioFile === 'error'){ //verify if audio data is ready 
		res.json('send msg',{
			transcribedText: "Audio input is missing. Upload or record your file first...",
			compareObject: "",
			originalTextExport: "",
		});
		res.end();
	}
	else {
		//execute the transcribe function to get transcribed text in result variable
	    console.log('Transcribe by Sphinx-4 starting');
	    var java = require('java');
	    var result = transcribeBySphinx(audioFile);
	    //put fs.unlinkSync(audioFile) in nexTick to ensure that audio file will only be deleted when the transcript is done
	    process.nextTick(function(){
	      fs.unlinkSync(audioFile);  
	    });
	    switch (selectedInput){//2 cases of input (audio or micro)
	      case 'audio':
	        if (textFile !== 'error'){ //text file is uploaded
	          //get the original text
	          var originalText = fs.readFileSync(textFile,"UTF-8").toLowerCase(); 
	          fs.unlinkSync(textFile);
	          result = transcribeBySphinx(audioFile);
	          res.json({
	            transcribedText: result,
	            compareObject: campareText(result, originalText),
	            originalTextExport: originalText,
	          });
	        } else //text file is NOT uploaded
	          res.json({
	            transcribedText: result,
	            compareObject: "",
	            originalTextExport: "",
	          });
	        break;
	      case 'micro':
	        res.json({
	          transcribedText: result,
	          compareObject: "No needed for an input by micro",
	          originalTextExport: "No needed for an input by micro",
	        });
	      default:
	        break;
	    };  
	}
}

//transcribe by sphinx function that give the transcribed text in outpout
function transcribeBySphinx(filePath){
	var java = require('java');
	//java.classpath.push(__dirname+"/../target/sphinx-4-lib-1.0-SNAPSHOT-jar-with-dependencies.jar");
	java.classpath.push(__dirname+'/lib/speechtotext.jar');
	var S2T = java.import('AppTestSpeechReco');
	var appSpeech = new S2T();
	var resultFinal = appSpeech.transcribeSync(filePath);
	//add sphinx-4 librairie

	//Configuration
	/*var Configuration = java.import("edu.cmu.sphinx.api.Configuration");
	var FileInputStream = java.import("java.io.FileInputStream");
	var SpeechResult = java.import("edu.cmu.sphinx.api.SpeechResult");
	var Recognizer = java.import("edu.cmu.sphinx.api.StreamSpeechRecognizer");

	var configuration = new Configuration();


	// Set path to acoustic model.
	configuration.setAcousticModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us");
	// Set path to dictionary.
	configuration.setDictionaryPathSync("resource:/edu/cmu/sphinx/models/en-us/cmudict-en-us.dict");
	// Set language model.
	configuration.setLanguageModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us.lm.bin");

	//try{
	  var recognizer = new Recognizer(configuration);
	//}
	//catch (e){
	//  console.log(e.cause.getMessageSync());
	//}

	var resultFinal = "";
	console.log(1);
	var fileInputStream = new FileInputStream(filePath);
	console.log(2);
	recognizer.startRecognitionSync(fileInputStream);
	console.log(3);
	var result;
	while ((result = recognizer.getResultSync()) !== null) {
	  resultFinal = resultFinal + result.getHypothesisSync() + ' ';
	  console.log(result.getHypothesisSync());
	  console.log(4);
	}

	recognizer.stopRecognitionSync();
	console.log(5);*/
	return resultFinal;
};  

//get the path of data necessary when it's an audio, recorded audio or text
  function getData(typeData){
    var fs = require('fs-extra');
    var filePath = 'error';
    switch (typeData){
      case "audio":
        if (fs.readdirSync(__dirname+'/../upload_audio/').length !== 0)
          filePath = __dirname+'/../upload_audio/'+(fs.readdirSync(__dirname+'/../upload_audio/'))[0];
        break;
      case "micro":
        if (fs.readdirSync(__dirname+'/../recorded_audio/').length !== 0)
          filePath = __dirname+'/../recorded_audio/'+(fs.readdirSync(__dirname+'/../recorded_audio/'))[0];
        break;
      case "text":
        if (fs.readdirSync(__dirname+'/../upload_text/').length !== 0)
          filePath = __dirname+'/../upload_text/'+(fs.readdirSync(__dirname+'/../upload_text/'))[0];
        break;
      default:
        break;
    };
    return filePath;
  };

  //campare 2 strings and give to output the diff object that show the different btw 2 strings
  function campareText(cibleText, originalText){
    var jsdiff = require('diff');
    var diffObject = jsdiff.diffWords(originalText, cibleText);
    return diffObject;
  };