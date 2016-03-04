"use strict";

//for corpus
exports.transcribeCorpusSphinx = function(req, res) {
	console.log('Sphinx recoie requete: '+req.params.corpusName);
	var fs = require('fs-extra');
	var corpus = req.params.corpusName;
	var corpusFolder = __dirname+'/../corpus/'+corpus+'/';
	var audioFilesFolder = __dirname+'/../corpus/'+corpus+'/wav-for-sphinx/';
	var textFilesFolder = __dirname+'/../corpus/'+corpus+'/txt/';
	var keywordsFolder = __dirname+'/../corpus/'+corpus+'/keywords/';
	var txtName;
	var audioName;
	var lines = fs.readFileSync(corpusFolder+corpus+'.txt').toString().split('\n');
	var listResult = [];
	var wersSum = 0;
	var precisionSum = 0;
	var recallSum = 0;
	var fScoreSum = 0;
	var numAudio = 0;

	var java = require('java');

	/*java.classpath.push(__dirname+"/../target/sphinx-4-lib-1.0-SNAPSHOT-jar-with-dependencies.jar");
	var Configuration = java.import("edu.cmu.sphinx.api.Configuration");
	var configuration = new Configuration();
	configuration.setAcousticModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us");
	configuration.setDictionaryPathSync("resource:/edu/cmu/sphinx/models/en-us/cmudict-en-us.dict");
	configuration.setLanguageModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us.lm.bin");*/
	function analize(i){
	    var files = lines[i].toString().split(' ');
    	txtName = files[1];
    	audioName = files[0];
    	console.log('Sphinx-4 transcribes file '+audioName+'>>>>>');
		transcribeBySphinx(audioName,txtName,i);
	};	

    //transcribe by sphinx function that give the transcribed text in outpout
	function transcribeBySphinx(audioName,txtName,i,num){
		if (num === undefined){
			java.classpath.push(__dirname+'/lib/speechtotext.jar');
			var S2T = java.import('AppTestSpeechReco');
			var appSpeech = new S2T();
			var result = appSpeech.transcribeSync(audioFilesFolder+audioName).replace(/\n/g," ");
		}
		else{
			//Configuration			var FileInputStream = java.import("java.io.FileInputStream");
			var SpeechResult = java.import("edu.cmu.sphinx.api.SpeechResult");
			var Recognizer = java.import("edu.cmu.sphinx.api.StreamSpeechRecognizer");
			
			var recognizer = new Recognizer(configuration);
			var fileInputStream = new FileInputStream(audioFilesFolder+audioName);
			recognizer.startRecognitionSync(fileInputStream);
			var resultE;
			while ((resultE = recognizer.getResultSync()) !== null) {
				result= result + resultE.getHypothesisSync() + ' ';
				console.log('result: '+resultE.getHypothesisSync());
			}
			recognizer.stopRecognitionSync();
		}
		console.log('trans:'+result);
		process.nextTick(function(){
			var originalText = fs.readFileSync(textFilesFolder+txtName,"UTF-8").toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"");
			console.log('org: '+originalText);
			var resultTable = result.split(' ');
			var textTable = originalText.split(' ');
			var keywords = getKeywords(keywordsFolder+txtName);
	    	console.log('Sphinx-4 sends transcript of file '+audioName+'>>>>>');
	    	listResult.push({
	    		Text: textTable,
	    		Result: resultTable,
	    		Keywords: keywords
	    	})
	    	console.log('Sphinx-4 is done with '+audioName+'>>>>>');
	    	if(i!==(lines.length-1)) analize(i+1);
	    	else {
	    		res.send(202);
	    		setTimeout(simplifize(listResult,0),2000);	
	    	}
		});
	};

	analize(0);  
};
function simplifize(listResult,i){
	var socket = require('./websocket.js').getSocket();
	var lemmer =  require('lemmer');
	var calculs = require('./calculs.js');
	var item = listResult[i];
	var resultTable = item.Result;
	var textTable = item.Text;
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
			var wer = calculs.werCalcul(campareText(resultSimplifize, textSimplifize),textSimplifize);
			var campare = campareText(resultSimplifize, textSimplifize);
			var precision, recall, fscore;
			var keywords =[];
			item.Keywords.forEach(function(keyword){
				if (keyword!==''&&keyword!==' '){
					keywords.push(keyword.toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(' ',''))
				}
			});
			console.log(keywords);
			//lemmatize keywords
			lemmer.lemmatize(keywords, function(err, transformKeywords){
				var precisionRecall = calculs.precisionRecall(resultSimplifize.split(' '), transformKeywords);
				if (i !== (listResult.length-1)){
					socket.emit('send msg',{
						WER: wer,
						precision: precisionRecall.precision,
						recall: precisionRecall.recall,
						fScore: precisionRecall.fscore
					});
					console.log('send result');
					simplifize(listResult,i+1);
				}
				else {
					socket.emit('send last msg',{
						WER: wer,
						precision: precisionRecall.precision,
						recall: precisionRecall.recall,
						fScore: precisionRecall.fscore
					});
					console.log('send result');
				}
			});
		});
	});
}

//get keywords
function getKeywords (filePath){
	var fs = require('fs-extra');
	return fs.readFileSync(filePath).toString().split('\n');
}

//campare 2 strings and give to output the diff object that show the different btw 2 strings
function campareText(cibleText, originalText){
	var jsdiff = require('diff');
	var diffObject = jsdiff.diffWords(originalText, cibleText);
	return diffObject;
};