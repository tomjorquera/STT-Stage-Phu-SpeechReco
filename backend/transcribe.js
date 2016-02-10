exports.transcribedText = function(req, res) {
  var url = require('url');
  var selectedTool = req.params.tool;
  var selectedInput = req.params.inputtype;

  if (selectedTool === 'sphinx4'){  
      var jsdiff = require('diff');
      var fs = require('fs-extra');
      var filePath;
      if (selectedInput === 'audio')
        filePath = fs.readdirSync(__dirname+'/../upload_audio/');
      else if (selectedInput === 'micro')
        filePath = fs.readdirSync(__dirname+'/../recorded_audio/');
      var textFilePath = fs.readdirSync(__dirname+'/../upload_text/');
      var diffObject;
      var result;
      if (filePath.length !== 0 && textFilePath.length !== 0){
        var originalText = fs.readFileSync(__dirname+'/../upload_text/'+textFilePath[0],"UTF-8").toLowerCase();
        if(filePath[0].indexOf('.wav')!==-1){
          //2 cases of transcibing
          if (selectedInput === 'audio') {
            result = transcribeBySphinx(__dirname+'/../upload_audio/'+filePath[0]);
            diffObject = jsdiff.diffWords(originalText, result);
            fs.unlinkSync(__dirname+'/../upload_text/'+textFilePath[0]);
            fs.unlinkSync(__dirname+'/../upload_audio/'+filePath[0]);
            res.json({
              transcribedText: result,
              compareObject: diffObject,
              originalTextExport: originalText,
            });
          }
          else if (selectedInput === 'micro') {
            result = transcribeBySphinx(__dirname+'/../recorded_audio/'+filePath[0]);
            fs.unlinkSync(__dirname+'/../recorded_audio/'+filePath[0]);
            res.json({
              transcribedText: result,
              compareObject: "No needed for an input by micro",
              originalTextExport: "No needed for an input by micro",
            });
          }
        }else{
          result="Uploaded file is not an audio one. Choose another...";
          fs.unlinkSync(__dirname+'/../upload_audio/'+filePath[0]);
          res.json({
            transcribedText: result,
            compareObject: "",
            originalTextExport: "",
          });
        }
      } else {
        if (selectedInput === 'audio') 
          res.json({
            transcribedText: "Text file or/and audio file are missing. Upload your files first...",
            compareObject: "",
            originalTextExport: "",
          });
        else if (selectedInput === 'micro')
          res.json({
            transcribedText: "Please give us a recorded audio",
            compareObject: "No needed for an input by micro",
            originalTextExport: "No needed for an input by micro",
          });
      }
  }
  else if (selectedTool === 'kaldi'){
    res.json({
      transcribedText: 'Kaldi is not ready to be used for this moment. We are working hard on it.',
      compareObject: "",
      originalTextExport: "",
    });
  } 
  else if (selectedTool === 'pocketsphinx'){
    res.json({
      transcribedText: "Kaldi is not ready to be used for this moment.",
      compareObject: "",
      originalTextExport: "",
    });
  } 
  else {
    res.json({
      transcribedText: 'Tell us which tool that you would like to use, please',
      compareObject: "",
      originalTextExport: "",
    });
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

    recognizer.startRecognitionSync(fileInputStream);
    var result;
    while ((result = recognizer.getResultSync()) != null) {
      resultFinal +=  result.getHypothesisSync()+" ";
    }
    recognizer.stopRecognitionSync();
    // Print utterance string without filler words.
    return resultFinal;
  };  
};