"use strict";

//main export function that sent the transcribed text, the original text and the compare object to client 
exports.transcribedText = function(req, res) {
  var fs = require('fs-extra');
  var socket = require('./websocket.js').getSocket();
  var selectedTool = req.params.tool;
  var selectedInput = req.params.inputtype;
  //get data necessary which are original text and audio file (record audio or internet audio)
  var textFile = getData("text");
  if (selectedInput === 'audio')
    var audioFile = getData("audio");
  else if (selectedInput === 'micro')
    var audioFile = getData("micro");

  if (audioFile !== 'error'){ //verify if all data is ready  
    switch (selectedTool) {  //there are 3 cases of tool (3 tools)  
      case 'sphinx4': //for sphinx 4 the response have json form
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
            if (textFile !== 'error'){
              //get the original text
              var originalText = fs.readFileSync(textFile,"UTF-8").toLowerCase(); 
              fs.unlinkSync(textFile);
              result = transcribeBySphinx(audioFile);
              res.json({
                transcribedText: result,
                compareObject: campareText(result, originalText),
                originalTextExport: originalText,
              });
            } else 
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
        break;
      case 'kaldi': //for kaldi the response is sent to client by socket
        //send message 202 to client to notice the client that its request is accepted
        res.send(202);
        //treat the client request
        switch (selectedInput){ 
          case 'audio':
            var kaldiRoot = __dirname+'/lib/kaldi-trunk';
            console.log('transcribe by kaldi starting');
            //kaldi function need the kaldi directory, audio file path and a function call as inputs
            transcribeByKaldi(kaldiRoot,audioFile, callbackAudio);
            //the callback function that will transfer the socket that composes the transcribe text, original text and the campare object
            function callbackAudio(result){
              var textFile = getData("text");
              if (textFile !== 'error'){
                var originalText = fs.readFileSync(textFile,"UTF-8").toLowerCase(); 
                fs.unlinkSync(textFile);
                fs.unlinkSync(audioFile);
                console.log("kaldi renvoie resultat");
                socket.emit('send msg', {
                  transcribedText: result,
                  compareObject: campareText(result, originalText),
                  originalTextExport: originalText,
                });
                console.log("kaldi fini");
              }
              else 
                socket.emit('send msg', {
                  transcribedText: result,
                  compareObject: "",
                  originalTextExport: "",
                });
            };
            break;
          case 'micro':
            var kaldiRoot = __dirname+'/lib/kaldi-trunk';
            transcribeByKaldi(kaldiRoot,audioFile, callbackMicro);
            function callbackMicro(result){
              fs.unlinkSync(audioFile);
              console.log("kaldi renvoie resultat");
              socket.emit('send msg',{
                transcribedText: result,
                compareObject: "No needed for an input by micro",
                originalTextExport: "No needed for an input by micro",
              });
              console.log("kaldi fini");
            };
            break;
          default:
            break;
        }
        break;
      case 'pocketsphinx':
        socket.emit('send msg',{
          transcribedText: "pocketSphinx is not ready to be used for this moment.",
          compareObject: "",
          originalTextExport: "",
        });
        res.end();
        break;
      default:
        socket.emit('send msg',{
          transcribedText: 'Tell us which tool that you would like to use, please',
          compareObject: "",
          originalTextExport: "",
        });
        res.end();
    }
  }
  else {
    if (selectedTool === 'kaldi') {
      switch (selectedInput){
        case 'audio':
          socket.emit('send msg',{
            transcribedText: "Audio file is missing. Upload your file first...",
            compareObject: "",
            originalTextExport: "",
          });
          res.end();
          break;
        case 'micro':
          socket.emit('send msg',{
            transcribedText: "Please give us a recorded audio",
            compareObject: "No needed for an input by micro",
            originalTextExport: "No needed for an input by micro",
          });
          res.end();
          break;
        default:
          break;
      };
    } 
    if ((selectedTool === 'sphinx4')) {
      switch (selectedInput){
        case 'audio':
          res.json('send msg',{
            transcribedText: "Text file or/and audio file are missing. Upload your files first...",
            compareObject: "",
            originalTextExport: "",
          });
          res.end();
          break;
        case 'micro':
          res.json('send msg',{
            transcribedText: "Please give us a recorded audio",
            compareObject: "No needed for an input by micro",
            originalTextExport: "No needed for an input by micro",
          });
          res.end();
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

  /*
   *transcribe by kaldi function that give the transcribed text in outpout
   */
  function transcribeByKaldi(kaldiPath, filePath, callback){
    //use chid process of node js to call an unix command that give the transcribed text in stdout. 
    //This stdout is the output of the function
    var exec = require('child_process').exec;
    var cmd1 = 'cd '+kaldiPath+'/egs/online-nnet2/';
    var cmd2 = './run.sh '+kaldiPath+' '+filePath;
    console.log(cmd1+' ; '+cmd2);
    exec(cmd1+' ; '+cmd2, function(error, stdout, stderr) {
      if (stdout !== ""){
        callback(stdout);
      } else {
        socket.emit('send error', {
          transcribedText:" Error of transcript. Maybe the audio is not suitable. Please convert it.."
        });
      }
      if (error !== null) {
          console.log('exec error: ' + error);
        }
    }); 
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
};