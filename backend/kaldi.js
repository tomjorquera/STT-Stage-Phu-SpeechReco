"use strict";

exports.transcribeKaldi = function(req, res) {
	var fs = require('fs-extra');
	var socket = require('./websocket.js').getSocket(); 
	var lemmer =  require('lemmer');	
  	var selectedInput = req.params.inputtype;
  	var clientName = req.params.clientname;
  	var utt = __dirname+'/lib/kaldi-trunk/egs/online-nnet2/utt.txt';
	var audio_utt = __dirname+'/lib/kaldi-trunk/egs/online-nnet2/audio_utt.txt';
	//send message 202 to client to notice the client that its request is accepted
	res.send(202);
	//clear input
	clearTxt(utt);
	clearTxt(audio_utt);

  	//get data necessary which are original text and audio file (record audio or internet audio)
	  
	if (selectedInput === 'audio'){
	  	var textFile = getData("text", clientName);
	    var audioFile = getData("audio", clientName);
	}
	else if (selectedInput === 'micro')
		var audioFile = getData("micro", clientName);

	if (audioFile === 'error'){ //verify if audio data is ready 
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
		createInput(clientName,audioFile);
		//create input
		function createInput(audioName,filePath){
			fs.appendFile(utt, 'spk '+audioName, function (){
				fs.appendFile(audio_utt,audioName+' '+filePath, function (){
					transcribeByKaldi(sendMsg);
				});
			});
		}
		function sendMsg(result){
			//treat the client request
			switch (selectedInput){ 
				case 'audio':
					if (textFile !== 'error'){ //text file is uploaded
						var originalText = fs.readFileSync(textFile,"UTF-8").toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,""); 
						fs.unlinkSync(textFile);
						fs.unlinkSync(audioFile);
						console.log("kaldi renvoie resultat");
						console.log('resultat: '+result);
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
								socket.emit('send msg audio', {
									transcribedText: resultSimplifize,
									compareObject: campareText(resultSimplifize, textSimplifize),
									originalTextExport: textSimplifize,
								});
								console.log("kaldi fini");
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
					console.log("kaldi renvoie resultat");
					socket.emit('send msg micro',{
						transcribedText: result
					});
					break;
				default:
					break;
		    }
		}
	}
}


//Transcribe by kaldi function that give the transcribed text in outpout
function transcribeByKaldi(callback){
	//use chid process of node js to call an unix command that give the transcribed text in stdout. 
	//This stdout is the output of the function
	var exec = require('child_process').exec;
	var cmd1 = 'cd '+__dirname+'/lib/kaldi-trunk/egs/online-nnet2/';
	var cmd2 = './run.sh ';
	var start = new Date().getTime();
	exec(cmd1+' ; '+cmd2, function(stderr) {
		var fs = require('fs-extra');
		console.log(stderr);
		var output = __dirname+'/lib/kaldi-trunk/egs/online-nnet2/output.txt'
		var outputString = fs.readFileSync(output).toString();
		var result = outputString.substr(outputString.indexOf(' ',0)+1);
		console.log(result);
		callback(result);
	}); 
};

//clear txt file
function clearTxt(filePath){
	var fs = require('fs');
	fs.truncate(filePath, 0, function(){console.log('done')});
}

//get the path of data necessary when it's an audio, recorded audio or text
function getData(typeData, clientName){
	var fs = require('fs-extra');
	var filePath = 'error';
	switch (typeData){
		case "audio":
			if (fs.existsSync(__dirname+'/../upload_audio/'+clientName+'.wav-convertedforkaldi.wav'))
				filePath = __dirname+'/../upload_audio/'+clientName+'.wav-convertedforkaldi.wav';
			break;
		case "micro":
			if (fs.existsSync(__dirname+'/../recorded_audio/'+clientName+'.wav-convertedforkaldi.wav'))
				filePath = __dirname+'/../recorded_audio/'+clientName+'.wav-convertedforkaldi.wav';
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