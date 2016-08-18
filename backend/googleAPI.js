"use strict";


exports.transcribe = function(req, res) {
	var fs = require('fs-extra');
	var socket = require('./websocket.js').getSocket(); 
	var lemmer =  require('lemmer');	
  	var selectedInput = req.params.inputtype;
  	var clientName = req.params.clientname;
	//send message 202 to client to notice the client that its request is accepted
	res.send(202);

  	//get data necessary which are original text and audio file (record audio or internet audio)
	  
	if (selectedInput === 'audio'){
	  	var textFile = getData("text", clientName);
	    var audioFile = getData("audio", clientName);
	    console.log(audioFile);
	}
	else if (selectedInput === 'micro'){
		var audioFile = getData("micro", clientName);
		console.log(audioFile);
	}
		
	console.log('get data done');

	if (audioFile === 'error'){ //verify if audio data is ready 
		console.log('get data error');
		switch (selectedInput){ 
			case 'audio':
				socket.emit('send msg audio',{
					transcribedText: "Audio input is missing or is not converted. Upload or record your file first...",
					compareObject: "",
					originalTextExport: "",
				});
				break;
			case 'micro':
				socket.emit('send msg micro',{
					transcribedText: "Audio input is missing or is not converted. Upload or record your file first...",
					compareObject: "",
					originalTextExport: "",
				});
				break;
			default:
				break;
		};
	} 
	else {
		transcribeGoogleAPI(audioFile,sendMsg);
	}
}

function sendMsg(result){
	//treat the client request
	switch (selectedInput){
		case 'audio':
			if (textFile !== 'error'){ //text file is uploaded
				var loadTxt = fs.readFileSync(textFile,"UTF-8").toLowerCase();
				var originalText = cleanText(loadTxt);
				fs.unlinkSync(textFile);
				fs.unlinkSync(audioFile);
				console.log("googleAPI renvoie resultat");
				var transcriptTxt = cleanText(result);
				var resultTable = transcriptTxt.split(' ');
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
						socket.emit('send msg audio', {
							transcribedText: resultSimplifize.toLowerCase(),
							compareObject: campareText(resultSimplifize.toLowerCase(), textSimplifize),
							originalTextExport: textSimplifize,
						});
						console.log("googleAPI fini");
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
					socket.emit('send msg audio', {
						transcribedText: resultSimplifize,
						compareObject: "",
						originalTextExport: "",
					});
				});
			}
			break;
		case 'micro':
			//fs.unlinkSync(audioFile);
			console.log("Sphinx-4 renvoie resultat");
			socket.emit('send msg micro',{
				transcribedText: result
			});
			break;
		default:
			break;
    }
}

//Transcribe by sphinx-4 function that give the transcribed text in output
function transcribeGoogleAPI(input,callback){
	//use chid process of node js to call an unix command that give the transcribed text in stdout. 
	//This stdout is the output of the function
	var opts = {
		file: input,
		//dclipSize: 15,
		key: 'AIzaSyCnl6MRydhw_5fLXIdASxkLJzcJh5iX0M4',
		sampleRate: 16000,
		timeout: 100000,
		lang: 'en-US',
		pfilter: 0,
		maxRequests: 4
	};
	var speech = require('google-speech-api');
	speech(opts, function (err, results) {
		if(err){
			console.log(err);
			return;
		}
		var result='';
		var resultsL = results.length;
	  	for (var j=0;j<resultsL;j++){
	  		console.log(results[j].trans);
	  		if (results[j].trans.result[0] != undefined){
	  			result+=(results[j].trans.result[0]).alternative[0].transcript+' ';
	  			console.log(results[j].name+' '+(results[j].trans.result[0]).alternative[0].transcript);
			}	
	    	if (j===resultsL-1) {
	    		callback(result);
	    	} 
	  	}
	});
};


//get the path of data necessary when it's an audio, recorded audio or text
function getData(typeData, clientName){
	var fs = require('fs-extra');
	var filePath = 'error';
	switch (typeData){
		case "audio":
			if (fs.existsSync(__dirname+'/../upload_audio/'+clientName+'.wav'))
				filePath = __dirname+'/../upload_audio/'+clientName+'.wav';
			break;
		case "micro":
			if (fs.existsSync(__dirname+'/../recorded_audio/'+clientName+'.wav'))
				filePath = __dirname+'/../recorded_audio/'+clientName+'.wav';
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
