//for corpus
exports.transcribeCorpusSphinx = function(req, res) {
	console.log('Sphinx recoie requete: '+req.params.corpusName);
	var fs = require('fs-extra');
	var calculs = require('./calculs.js');
	var lemmer =  require('lemmer');
	var corpus = req.params.corpusName;
	var corpusFolder = __dirname+'/../corpus/'+corpus+'/';
	var audioFilesFolder = __dirname+'/../corpus/'+corpus+'/wav-for-sphinx/';
	var textFilesFolder = __dirname+'/../corpus/'+corpus+'/txt/';
	var txtName;
	var audioName;
	var lines = fs.readFileSync(corpusFolder+corpus+'.txt').toString().split('\n');
	var resultF = [];
	var wersSum = 0;
	var precisionSum = 0;
	var recallSum = 0;
	var fScoreSum = 0;
	var numAudio = 0;

	function analize(i){
	    var files = lines[i].toString().split(' ');
    	txtName = files[1];
    	audioName = files[0];
    	console.log('Sphinx-4 transcribes file '+audioName+'>>>>>');
		transcribeBySphinx(audioName,txtName,i);
	};	

    //transcribe by sphinx function that give the transcribed text in outpout
	function transcribeBySphinx(audioName,txtName,i){
		var java = require('java');
		//java.classpath.push(__dirname+"/../target/sphinx-4-lib-1.0-SNAPSHOT-jar-with-dependencies.jar");
		java.classpath.push(__dirname+'/lib/speechtotext.jar');
		var S2T = java.import('AppTestSpeechReco');
		var appSpeech = new S2T();
		var result = appSpeech.transcribeSync(audioFilesFolder+audioName);
		
		process.nextTick(function(){
			var originalText = fs.readFileSync(textFilesFolder+txtName,"UTF-8").toLowerCase();
			var resultTable = result.split(' ');
			var textTable = originalText.split(' ');
	    	console.log('Sphinx-4 sends transcript of file '+audioName+'>>>>>');
	    	//simplifize
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
					var textSimplifizeF = textSimplifize.replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"");
					var wer = calculs.werCalcul(campareText(resultSimplifize, textSimplifizeF),textSimplifizeF);
					//console.log(resultF);
					console.log('Sphinx-4 is done with '+audioName+'>>>>>');
					var campare = campareText(resultSimplifize, textSimplifizeF);
					var precisionRecall = calculs.precisionRecall(campare);
					numAudio += 1;
					wersSum += parseFloat(wer);
					precisionSum += parseFloat(precisionRecall.Precision);
					recallSum += parseFloat(precisionRecall.Recall);
					fScoreSum += parseFloat(precisionRecall.FScore);
					console.log(wersSum+' '+precisionSum+' '+recallSum+' '+fScoreSum);
					if (i !== (lines.length-1)){
						resultF.push({
							compareObject: campare,
							WER: wer,
							precision: precisionRecall.Precision,
							recall: precisionRecall.Recall,
							fScore: precisionRecall.FScore,	
							Average: 'unknown'
						});
						analize(i+1);
					}
					else {
						var averageWer = wersSum/numAudio;
						var averagePrecision = precisionSum/numAudio;
						var averageRecall = recallSum/numAudio;
						var averageFScore = fScoreSum/numAudio;
						resultF.push({
							compareObject: campare,
							WER: wer,
							precision: precisionRecall.Precision,
							recall: precisionRecall.Recall,
							fScore: precisionRecall.FScore,	
							Average: 'WER: '+averageWer.toFixed(3)
											+'/Precision: '+averagePrecision.toFixed(3)
											+'/Recall: '+averageRecall.toFixed(3)
											+'/F-Score: '+averageFScore.toFixed(3)
						});
						res.json(resultF);
					}
				});
			});
		});
		//callback(audioName,txtName,i);
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
		//return result;
	};

	analize(0);  
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