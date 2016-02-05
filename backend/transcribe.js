exports.transcribedText = function(req, res) {
  var url = require('url');
  var selectedTool = req.params.tool;
  var selectedInput = req.params.inputtype;

  if (selectedTool === 'sphinx4'){  
      var java = require('java');
      java.classpath.push(__dirname+"/lib/speechtotext.jar");
      var jsdiff = require('diff');
      var fs = require('fs-extra');
      var filePath;
      if (selectedInput === 'audio')
        filePath = fs.readdirSync(__dirname+'/../upload_audio/');
      else if (selectedInput === 'micro')
        filePath = fs.readdirSync(__dirname+'/../recorded_audio/');

      var originalText = fs.readFileSync(__dirname+"/../upload_text/savecode.txt","UTF-8");
      var diffObject;
      var result;
      if (filePath.length !== 0){
        if(filePath[0].indexOf('.wav')!==-1){
          //execute code java de sphinx-4 par node-java
          var stt = java.import("AppTestSpeechReco");
          var appSpeech = new stt();
          //2 cases of transcibe
          if (selectedInput === 'audio') {
            result = appSpeech.transcribeSync(__dirname+'/../upload_audio/'+filePath[0]);
            fs.unlinkSync(__dirname+'/../upload_audio/'+filePath[0]);
            diffObject = jsdiff.diffWords(originalText, result);
            res.json({
              transcribedText: result,
              compareObject: diffObject,
              originalTextExport: originalText,
            });
          }
          else if (selectedInput === 'micro') {
            result = appSpeech.transcribeSync(__dirname+'/../recorded_audio/'+filePath[0]);
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
            transcribedText: "Upload a file first...",
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
};