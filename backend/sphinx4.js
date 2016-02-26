"use strict";

exports.transcribeSphinx = function(req, res) {
	var fs = require('fs-extra');
	var lemmer =  require('lemmer');
	var socket = require('./websocket.js').getSocket();
	var selectedInput = req.params.inputtype;
	var clientName = req.params.clientname;

	//get data necessary which are original text and audio file (record audio or internet audio)
	if (selectedInput === 'audio'){
	  	var textFile = getData("text", clientName);
	    var audioFile = getData("audio", clientName);
	}
	else if (selectedInput === 'micro')
		var audioFile = getData("micro", clientName);
	
	console.log(audioFile);
	if (audioFile === 'error'){ //verify if audio data is ready 
		console.log('errorr');
		res.json('send msg',{
			transcribedText: "Audio input is missing or you did not convert it yet...",
			compareObject: "",
			originalTextExport: "",
		});
	}
	else {
		//execute the transcribe function to get transcribed text in result variable
	    console.log('Transcribe by Sphinx-4 starting');
	    var java = require('java');
	    var result = transcribeBySphinx(audioFile).replace(/\n/g," ");
	    res.send(202);
	    setTimeout(function(){
    		//put fs.unlinkSync(audioFile) in nexTick to ensure that audio file will only be deleted when the transcript is done
    		process.nextTick(function(){
		    	fs.unlinkSync(audioFile); 
		    });
		    switch (selectedInput){//2 cases of input (audio or micro)
		      	case 'audio':
			        if (textFile !== 'error'){ //text file is uploaded
						//get the original text
						var originalText = fs.readFileSync(textFile,"UTF-8").toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""); 
						fs.unlinkSync(textFile);
						console.log('result: '+result);
						console.log('org: '+originalText);
						var resultTable = result.split(' ');
						var textTable = originalText.split(' ');

						lemmer.lemmatize(resultTable, function(err, transformResult){
							var resultSimplifize='';
							transformResult.forEach(function(word){
								resultSimplifize+=word+' ';
							});
							lemmer.lemmatize(textTable, function(err, transformText){
								var textSimplifize='';
								transformText.forEach(function(word){
									textSimplifize+=word+' ';
								});
								console.log(resultSimplifize);
								console.log(textSimplifize);
								socket.emit('send msg audio',{
									transcribedText: resultSimplifize,
									compareObject: campareText(resultSimplifize, textSimplifize),
									originalTextExport: textSimplifize
								});
							});
						});	
			        } 
			        else {//text file is NOT uploaded
			        	var resultTable = result.split(' ');
						lemmer.lemmatize(resultTable, function(err, transformResult){
							var resultSimplifize='';
							transformResult.forEach(function(word){
								resultSimplifize+=word+' ';
							});
							socket.emit('send msg audio',{
								transcribedText: resultSimplifize,
								compareObject: "",
								originalTextExport: ""
							});
						});
					}
		        break;
		      	case 'micro':
		        	socket.emit('send msg micro',{
		          		transcribedText: result
		        	});
		        	break;
		      	default:
		        	break;
		    };  
    	},1000);
    }	    
};

//transcribe by sphinx function that give the transcribed text in outpout
function transcribeBySphinx(filePath){
	var java = require('java');
	var async = require('async');
	java.classpath.push(__dirname+"/../target/sphinx-4-lib-1.0-SNAPSHOT-jar-with-dependencies.jar");
	
	java.classpath.push(__dirname+'/lib/speechtotext.jar');
	var S2T = java.import('AppTestSpeechReco');
	var appSpeech = new S2T();
	var resultFinal = appSpeech.transcribeSync(filePath);
	return resultFinal;
	
	//add sphinx-4 librairie
	//Configuration
	/*var Configuration = java.import("edu.cmu.sphinx.api.Configuration");
	var FileInputStream = java.import("java.io.FileInputStream");
	var SpeechResult = java.import("edu.cmu.sphinx.api.SpeechResult");
	var Recognizer = java.import("edu.cmu.sphinx.api.StreamSpeechRecognizer");

	var configuration = new Configuration();
	async.series([
	    function(callback){
	        // do some stuff ... 
	        // Set path to acoustic model.
	        setTimeout(function(){console.log(1);},2000);
			//configuration.setAcousticModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us");	
	        callback(null);
	    },
	    function(callback){
	        // do some more stuff ... 
			// Set path to dictionary.
			setTimeout(function(){console.log(2);},1000);
			//configuration.setDictionaryPathSync("resource:/edu/cmu/sphinx/models/en-us/cmudict-en-us.dict");
	        callback(null);
	    },
	    function(callback){
	        // do some more stuff ...
	        // Set language model.
			setTimeout(function(){console.log(3);},500);
			//configuration.setLanguageModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us.lm.bin");
	        callback(null,'done');
	    },
	    function(callback){
	    	console.log(4);
	    	var recognizer = new Recognizer(configuration);

			var resultFinal = "";
			var fileInputStream = new FileInputStream(filePath);
			recognizer.startRecognitionSync(fileInputStream);
			var result;
			while ((result = recognizer.getResultSync()) !== null) {
			  	resultFinal = resultFinal + result.getHypothesisSync() + ' ';
			  	console.log('result: '+result.getHypothesisSync());
			}
			console.log('result: '+resultFinal);
			recognizer.stopRecognitionSync();
			callback(null,'done');
			return resultFinal;
	    }
	],
	// optional callback 
	function(err, results){
	    console.log(results);
	});*/
};  

//get the path of data necessary when it's an audio, recorded audio or text
function getData(typeData, clientName){
	var fs = require('fs-extra');
	var filePath = 'error';
	switch (typeData){
		case "audio":
			if (fs.existsSync(__dirname+'/../upload_audio/'+clientName+'.wav-convertedforsphinx.wav'))
				filePath = __dirname+'/../upload_audio/'+clientName+'.wav-convertedforsphinx.wav';
			break;
		case "micro":
			if (fs.existsSync(__dirname+'/../recorded_audio/'+clientName+'.wav-convertedforsphinx.wav'))
				filePath = __dirname+'/../recorded_audio/'+clientName+'.wav-convertedforsphinx.wav';
			break;
		case "text":
			if (fs.existsSync(__dirname+'/../upload_text/'+clientName+'.txt'))
				filePath = __dirname+'/../upload_text/'+clientName+'.txt';
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