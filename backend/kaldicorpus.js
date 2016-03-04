"use strict";

//for corpus
exports.transcribeCorpusKaldi = function(req, res) {
	console.log('Kaldi recoie requete: '+req.params.corpusName);
	var fs = require('fs-extra');
	var socket = require('./websocket.js').getSocket();
	var calculs = require('./calculs.js');
	var lemmer =  require('lemmer');
	var corpus = req.params.corpusName;
	var corpusFolder = __dirname+'/../corpus/'+corpus+'/';
	var audioFilesFolder = __dirname+'/../corpus/'+corpus+'/wav-for-kaldi/';
	var textFilesFolder = __dirname+'/../corpus/'+corpus+'/txt/';
	var keywordsFolder = __dirname+'/../corpus/'+corpus+'/keywords/';
	var kaldiRoot = __dirname+'/lib/kaldi-trunk';
	var txtName;
	var audioName;
	var lines = fs.readFileSync(corpusFolder+corpus+'.txt').toString().split('\n');
	res.send(202);

	analize(0);

	function analize(i){
	    var files = lines[i].toString().split(' ');
    	txtName = files[1];
    	audioName = files[0];
    	console.log('Kaldi transcribes file '+audioName+'>>>>>');
    	transcribeByKaldi(kaldiRoot,audioFilesFolder+audioName,i,txtName,audioName,callback);
	};	

	function callback(i, result,audioName,txtName){
		var originalText = fs.readFileSync(textFilesFolder+txtName,"UTF-8").toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"");
		console.log('org: '+originalText);
		var resultTable = result.split(' ');
		var textTable = originalText.split(' ');
		var keywords = getKeywords(keywordsFolder+txtName);
		//send socket to client time by time
    	console.log('Kaldi send transcript of file '+audioName+'>>>>>');
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
				var campare = campareText(resultSimplifize, textSimplifize);
				var keywordsSimplifize = [];
				keywords.forEach(function(keyword){
					if (keyword!==''&&keyword!==' '){
						keywordsSimplifize.push(keyword.toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(' ',''))
					}
				})
				//lemmatize keywords
				lemmer.lemmatize(keywordsSimplifize, function(err, transformKeywords){
					var precisionRecall = calculs.precisionRecall(resultSimplifize.split(' '), transformKeywords);
					if (i !== (lines.length-1)){
						socket.emit('send msg', {
							WER: calculs.werCalcul(campare,textSimplifize),	
							precision: precisionRecall.precision,
							recall: precisionRecall.recall,
							fScore: precisionRecall.fscore	
						});
						console.log('Kaldi is done with '+audioName+'>>>>>');
						analize(i+1);		
					} else {
						socket.emit('send last msg', {
							WER: calculs.werCalcul(campare,textSimplifize),
							precision: precisionRecall.precision,
							recall: precisionRecall.recall,
							fScore: precisionRecall.fscore	
						});
						console.log('Kaldi is done with '+audioName+'>>>>>');
					}
				});
			});
		});	
    }
};

//Transcribe by kaldi function that give the transcribed text in outpout
function transcribeByKaldi(kaldiPath,filePath,i,txtName,audioName,callback){
	//use chid process of node js to call an unix command that give the transcribed text in stdout. 
	//This stdout is the output of the function
	var exec = require('child_process').exec;
	var cmd1 = 'cd '+kaldiPath+'/egs/online-nnet2/';
	var cmd2 = './run.sh '+kaldiPath+' '+filePath;
	exec(cmd1+' ; '+cmd2, function(error, stdout, stderr) {
		var socket = require('./websocket.js').getSocket();
		//console.log('fini '+audioName+' '+stdout);
		if (stdout !== ""){
			console.log('trans: '+stdout);
			callback(i,stdout,audioName,txtName);
		} else {
			socket.emit('error', "There is error in transcribing.\nMaybe your corpus is emty or some files are missing like an audio does not have corresponding text.\nRe-create another corpus...");
		}
	}); 
};

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