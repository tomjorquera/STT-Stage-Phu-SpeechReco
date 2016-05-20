"use strict";

exports.transcribeCorpus = function(req, res){
	console.log('Google Api recoie requete: '+req.params.corpusName);
	var corpus = req.params.corpusName;
	var speech = require('google-speech-api');
	var fs = require('fs-extra');
	var socket = require('./websocket.js').getSocket();
	var calculs = require('./calculs.js');
	var lemmer =  require('lemmer');
	var corpusFolder = __dirname+'/../corpus/'+corpus+'/';
	var audioFilesFolder = corpusFolder+'wav/';
	var textFilesFolder = corpusFolder+'txt/';
	var keywordsFolder = corpusFolder+'keywords/';
	var audioName;
	var lines = fs.readFileSync(corpusFolder+corpus+'.txt').toString().split('\n');
	var output = [];
	var input = [];
	var time = 0;

	res.send(202);
	createInput(0);

	function createInput(i){
	    var files = lines[i].toString().split(' ');
    	audioName = files[0];
    	input.push(audioFilesFolder+audioName);
    	if (i!==(lines.length-1)){
			createInput(i+1);
    	}else{
			transcribe(input,0);	
    	}
	};

	function transcribe(filePaths,i){
		if (i!==filePaths.length) {
			var opts = {
				file: filePaths[i],
				key: 'AIzaSyCA9K61DkVf8iO3br_LgrSEtoq1ZL8q3uA',
				timeout: '100000',
				sampleRate: '16000',
				lang: 'en-US',
				maxRequests: 4
			};
			var speech = require('google-speech-api');
			var start = new Date().getTime();
			speech(opts, function (err, results) {
				if(err){
					console.log(err);
					return;
				}
				//console.log(results)
				var result='';
				var resultsL = results.length;
			  	for (var j=0;j<resultsL;j++){
			  		if (results[j].trans.result[0] !== undefined)
			  			result+=(results[j].trans.result[0]).alternative[0].transcript+' ';
			    	if (j===resultsL-1) {
			    		console.log(result);
			    		var end = new Date().getTime();
			    		time += (end-start)/(1000*60);
			    		output.push(result);
			    		transcribe(filePaths,i+1);
			    	} 
			  	}
			});
    	}
		else {
			sendResults(output,time,0);
		}
	}

	function sendResults(results,time,i){
		console.log('Audio '+i)
		var result = results[i];
		console.log("*transcribed*: "+result);
		var trancriptTxt = cleanText(result);
		var txtName = (lines[i].toString().split(' '))[1];
		var loadTxt = fs.readFileSync(textFilesFolder+txtName,"UTF-8").toLowerCase();
		var originalText = cleanText(loadTxt);
		console.log('org: '+originalText);
		var resultTable = trancriptTxt.split(' ');
		var textTable = originalText.split(' ');
		var keywords = getKeywords(keywordsFolder+txtName);
		//send socket to client time by time
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
				var campare = campareText(resultSimplifize.toLowerCase(), textSimplifize);
				var keywordsSimplifize = [];
				keywords.forEach(function(keyword){
					if (keyword!==''&&keyword!==' '){
						keywordsSimplifize.push(keyword.toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(' ',''))
					}
				})
				//lemmatize keywords
				lemmer.lemmatize(keywordsSimplifize, function(err, transformKeywords){
					var keywordsSimplifize = [];
					keywords.forEach(function(keyword){
						if (keyword!==''&&keyword!==' '){
							keywordsSimplifize.push(keyword.toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(' ',''))
						}
					})
					var precisionRecall = calculs.precisionRecall(resultSimplifize.toLowerCase().split(' '), transformKeywords);
					if (i !== (lines.length-1)){
						setTimeout(function(){
							socket.emit('send msg', {
								WER: calculs.werCalcul(campare,textSimplifize),
								recall: precisionRecall.recall,
								timeExec: 0
							});
						},2000);
						var audio = results[i].substr(0,results[i].indexOf(' ',0));
						console.log(audio+' msg is send');
						sendResults(results,time,i+1);		
					} else {
						setTimeout(function(){
							socket.emit('send last msg', {
								WER: calculs.werCalcul(campare,textSimplifize),
								//WER: calculs.werCalcul(campare, originalText),
								recall: precisionRecall.recall,
								timeExec: time
							});
						},2000);
						var audio = results[i].substr(0,results[i].indexOf(' ',0));
						console.log(audio+' msg is send');
					}
				});
			});
		});	
    }
}


//campare 2 strings and give to output the diff object that show the different btw 2 strings
function campareText(cibleText, originalText){
	var jsdiff = require('diff');
	var diffObject = jsdiff.diffWords(originalText, cibleText);
	return diffObject;
};

//get keywords
function getKeywords (filePath){
	var fs = require('fs-extra');
	return fs.readFileSync(filePath).toString().split('\n');
}

//clean text
function cleanText(originalText){
  var tm = require('text-miner');
  var my_corpus = new tm.Corpus([originalText.replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()?]/g,"")]);
  //my_corpus.removeWords(["\'s","ain\'t","aren\'t","can\'t","couldn\’t","didn\'t","doesn't","don't","hasn't","haven't","he's","here's","i'd","i'll","i'm","i've","isn't","it'd","it'll","it's","let's","shouldn't","that's","they'd","they'll","they're","they've","wasn't","we'd","we'll","we're","we've","weren't","what's","where's","who's","won't","wouldn't","you'd","you'll","you're","you've"]);
  my_corpus.removeWords(["uh","yeah","yep","um","mmhmm","pe","ah","hmm","mm","mhm"]);
  //my_corpus.removeWords(tm.STOPWORDS.EN);
  my_corpus.removeNewlines();
  my_corpus.removeInvalidCharacters();
  my_corpus.clean();
  var result = my_corpus.documents[0].replace(/ ' /g," ");
  return result;
}