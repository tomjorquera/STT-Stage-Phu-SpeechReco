//"use strict";

exports.transcribedText = function(req, res) {
  var url = require('url');
  var fs = require('fs-extra');
  var socket = require('./websocket.js').getSocket();
  var selectedTool = req.params.tool;
  var selectedInput = req.params.inputtype;
  //get data 
  var textFile = getData("text");
  if (selectedInput === 'audio')
    var audioFile = getData("audio");
  else if (selectedInput === 'micro')
    var audioFile = getData("micro");

  if (textFile !== undefined && audioFile !== undefined){ //if data is all ready  
    switch (selectedTool) {    
      case 'sphinx4':    
        //transcribe data to text 
        console.log('Transcribe by Sphinx-4 starting');
        var result = transcribeBySphinx(audioFile);
        //console.log(result);
        //fs.unlinkSync(audioFile);
        switch (selectedInput){
          case 'audio':
            var originalText = fs.readFileSync(textFile,"UTF-8").toLowerCase(); 
            //fs.unlinkSync(textFile);
            result = transcribeBySphinx(audioFile);
            res.json({
              transcribedText: result,
              compareObject: campareText(result, originalText),
              originalTextExport: originalText,
            });
            break;
          case 'micro':
            result = transcribeBySphinx(audioFile);
            res.json({
              transcribedText: result,
              compareObject: "No needed for an input by micro",
              originalTextExport: "No needed for an input by micro",
            });
          default:
            break;
        }; 
        break;   
      case 'kaldi':
        res.send(202);
        switch (selectedInput){
          case 'audio':
            var kaldiRoot = __dirname+'/lib/kaldi-trunk';
            console.log('transcribe by kaldi starting');
            transcribeByKaldi(kaldiRoot,audioFile, callbackAudio);
            function callbackAudio(result){
              console.log(11111);
              console.log(result);
              var textFile = getData("text");
              var originalText = fs.readFileSync(textFile,"UTF-8").toLowerCase(); 
              //fs.unlinkSync(textFile);
              //fs.unlinkSync(audioFile);
              console.log("kaldi renvoie resultat");
              socket.emit('send msg', {
                transcribedText: result,
                compareObject: campareText(result, originalText),
                originalTextExport: originalText,
              });
              console.log("kaldi fini");
            };
            break;
          case 'micro':
            var kaldiRoot = __dirname+'/lib/kaldi-trunk';
            transcribeByKaldi(kaldiRoot,audioFile, callbackMicro);
            function callbackMicro(result){
              //fs.unlinkSync(audioFile);
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
    switch (selectedInput){
      case 'audio':
        socket.emit('send msg',{
          transcribedText: "Text file or/and audio file are missing. Upload your files first...",
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
2
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

  function transcribeByKaldi(kaldiPath, filePath, callback){
    console.log('transcribe by kaldi starting');
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

  function getData(typeData){
    var fs = require('fs-extra');
    var filePath;
    switch (typeData){
      case "audio":
        filePath = __dirname+'/../upload_audio/'+(fs.readdirSync(__dirname+'/../upload_audio/'))[0];
        break;
      case "micro":
        filePath = __dirname+'/../recorded_audio/'+(fs.readdirSync(__dirname+'/../recorded_audio/'))[0];
        break;
      case "text":
        filePath = __dirname+'/../upload_text/'+(fs.readdirSync(__dirname+'/../upload_text/'))[0];
        break;
      default:
        break;
    };
    return filePath;
  };

  function campareText(cibleText, originalText){
    var jsdiff = require('diff');
    var diffObject = jsdiff.diffWords(originalText, cibleText);
    return diffObject;
  };
};