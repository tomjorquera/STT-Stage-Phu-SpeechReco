"use strict";

exports.transcribedText = function(req, res) {
  console.log(123);
  var url = require('url');
  var fs = require('fs-extra');
  var selectedTool = req.params.tool;
  var selectedInput = req.params.inputtype;

  //convert data
 // convertAudio(getData("audio", convert),selectedTool);

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
        var result = transcribeBySphinx(audioFile);
        //fs.unlinkSync(audioFile);
        switch (selectedInput){
          case 'audio':
            var originalText = fs.readFileSync(textFile,"UTF-8").toLowerCase(); 
            //fs.unlinkSync(textFile);
            res.json({
              transcribedText: result,
              compareObject: campareText(result, originalText),
              originalTextExport: originalText,
            });
            res.end();
            break;
          case 'micro':
            res.json({
              transcribedText: result,
              compareObject: "No needed for an input by micro",
              originalTextExport: "No needed for an input by micro",
            });
            res.end();
          default:
            break;
        }; 
        break;   
      case 'kaldi':
        switch (selectedInput){
          case 'audio':
            var kaldiRoot = __dirname+'/lib/kaldi-trunk';
            transcribeByKaldi(kaldiRoot,audioFile, callbackAudio);
            function callbackAudio(result){
              var textFile = getData("text");
              var originalText = fs.readFileSync(textFile,"UTF-8").toLowerCase(); 
              //fs.unlinkSync(textFile);
              //fs.unlinkSync(audioFile);
              res.json({
                transcribedText: result,
                compareObject: campareText(result, originalText),
                originalTextExport: originalText,
              });
              res.end();
            };
            break;
          case 'micro':
            var kaldiRoot = __dirname+'/lib/kaldi-trunk';
            transcribeByKaldi(kaldiRoot,audioFile, callbackMicro);
            function callbackMicro(result){
              var textFile = getData("text");
              var originalText = fs.readFileSync(textFile,"UTF-8").toLowerCase(); 
              fs.unlinkSync(textFile);
              fs.unlinkSync(audioFile);
              res.json({
                transcribedText: result,
                compareObject: "No needed for an input by micro",
                originalTextExport: "No needed for an input by micro",
              });
              res.end();
            };
            break;
          default:
            break;
        }
        break;
      case 'pocketsphinx':
        res.json({
          transcribedText: "pocketSphinx is not ready to be used for this moment.",
          compareObject: "",
          originalTextExport: "",
        });
        res.end();
        break;
      default:
        res.json({
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
        res.json({
          transcribedText: "Text file or/and audio file are missing. Upload your files first...",
          compareObject: "",
          originalTextExport: "",
        });
        res.end();
        break;
      case 'micro':
        res.json({
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

  function transcribeBySphinx(filePath){
    var java = require('java');
    java.classpath.push(__dirname+"/../target/sphinx-4-lib-1.0-SNAPSHOT-jar-with-dependencies.jar");

    var IOException = java.import("java.io.IOException");
    var e = new IOException();
    //add sphinx-4 librairie
    
    //Configuration
    var Configuration = java.import("edu.cmu.sphinx.api.Configuration");
    var FileInputStream = java.import("java.io.FileInputStream");
    var SpeechResult = java.import("edu.cmu.sphinx.api.SpeechResult");
    var Recognizer = java.import("edu.cmu.sphinx.api.StreamSpeechRecognizer");

    var configuration = new Configuration();
    var fileInputStream = new FileInputStream(filePath);

    // Set path to acoustic model.
    configuration.setAcousticModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us");
    // Set path to dictionary.
    configuration.setDictionaryPathSync("resource:/edu/cmu/sphinx/models/en-us/cmudict-en-us.dict");
    // Set language model.
    configuration.setLanguageModelPathSync("resource:/edu/cmu/sphinx/models/en-us/en-us.lm.bin");
    
    try{
      var recognizer = new Recognizer(configuration);
    }
    catch (e){
      console.log(e.cause.getMessageSync());
    }

    var resultFinal = "";
    console.log(111);
    recognizer.startRecognitionSync(fileInputStream);
    var result;
    while ((result = recognizer.getResultSync()) !== null) {
      resultFinal = resultFinal + result.getHypothesisSync() + ' ';
    }
    recognizer.stopRecognitionSync();
    console.log(222);
    // Print utterance string without filler words.
    return resultFinal;
  };  

  function transcribeByKaldi(kaldiPath, filePath, callback){
    var exec = require('child_process').exec;
    var cmd1 = 'cd '+kaldiPath+'/egs/online-nnet2/';
    var cmd2 = './run.sh '+kaldiPath+' '+filePath;
    console.log(cmd1+' ; '+cmd2);
    exec(cmd1+' ; '+cmd2, function(error, stdout, stderr) {
      console.log(stdout);
      callback(stdout);
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