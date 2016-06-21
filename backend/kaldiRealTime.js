exports.transcribeKaldi = function(req,res){
  var fs = require('fs-extra');
  var socket = require('./websocket.js').getSocket(); 
  var lemmer =  require('lemmer');  
  var selectedInput = req.params.inputtype;
  var clientName = req.params.clientname;
  //get data necessary which are original text and audio file (record audio or internet audio)
  if (selectedInput === 'audio'){
      var textFile = getData("text", clientName);
  }
  makeOutputFile(req.body.outputFormat, req.body.name);
  sendMsg(req.body.value.toLowerCase().replace(/\[noise\]/g,"").replace(/\[laughter\]/g,"").replace(/mm/g,""));
  

  function makeOutputFile(content,fileName){
    var outputFile = __dirname+'/../'+fileName.replace(/wav/,"txt");
    fs.appendFile(outputFile,content, function (err) {
        if (err) return console.log(err);
        console.log("output file created");
    });
  }

  function sendMsg(result){
    //treat the client request
    switch (selectedInput){ 
      case 'audio':
        if (textFile !== 'error'){ //text file is uploaded
          var loadText = fs.readFileSync(textFile,"UTF-8").toLowerCase();
          var originalText = cleanText(loadText); 
          console.log("kaldiRT renvoie resultat");
          var trancriptText = cleanText(result)
          var resultTable = trancriptText.split(' ');
          var textTable = originalText.split(' ');
          lemmer.lemmatize(resultTable, function(err, transformResult){
            var resultSimplifize='';
            transformResult.forEach(function(word){
              if (word!==''&&word!==' ')
                resultSimplifize+=word+' ';
            });
            lemmer.lemmatize(textTable, function(err, transformText){
              //fs.unlinkSync(textFile);
              var textSimplifize='';
              transformText.forEach(function(word){
                textSimplifize+=word+' ';
              });
              var campare = campareText(resultSimplifize, textSimplifize);
              var calculs = require('./calculs.js');
              var wer = calculs.werCalcul(campare,textSimplifize);
              console.log(wer);
              var sendObject = {
                transcribedText: resultSimplifize,
                compareObject: campare,
                originalTextExport: textSimplifize,
              };
              console.log(sendObject);
              res.send(202);
              setTimeout(function(){
                socket.emit('send msg audio', sendObject);
              },1000);
              console.log("kaldiRT fini");
            });
          }); 
        }
        else {
          socket.emit('send msg audio', {
            transcribedText: result,
            compareObject: "",
            originalTextExport: "",
          });  
        }   
        break;
      default:
        break;
    }
  };
};

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
  console.log("campare begin....");
  var diffObject = jsdiff.diffWords(originalText, cibleText);
  console.log("campare's done");
  return diffObject;
};

//clean text
function cleanText(originalText){
  var tm = require('text-miner');
  var my_corpus = new tm.Corpus([originalText.replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()?]/g,"")]);
  my_corpus.removeWords(["uh","yeah","yep","um","mmhmm","pe","ah","hmm","mm","mhm","huh","uhhuh"]);
  my_corpus.removeNewlines();
  my_corpus.removeInvalidCharacters();
  my_corpus.clean();
  var result = my_corpus.documents[0].replace(/ ' /g," ");
  return result;
}