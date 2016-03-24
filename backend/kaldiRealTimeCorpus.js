exports.transcribeCorpus = function(req,res){
  console.log('Google Api recoie requete: '+req.params.corpusName);
  var corpus = req.params.corpusName;
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
  var audio_utt = __dirname+'/lib/googleApi/audio_utt.txt';
  var output = [];
  var input = [];

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
      var start = new Date().getTime();
      sendRequest(filePaths[i], function (err, results) {
        var end = new Date().getTime();
        console.log(results);
        if(err){
          console.log(err);
          return;
        }
        var resultsL = results.length;
        result=results.trans.hypotheses[0].utterance+' ';
        console.log(result)
        output.push({tempExec: results.temp,trans: result});
        transcribe(filePaths,i+1);
      });
    }
    else {
      sendResults(output,0);
    }
  }

  function sendResults(results,i){
    console.log('Audio '+i)
    var result = results[i].trans;
    console.log("*transcribed*: "+result);
    var txtName = (lines[i].toString().split(' '))[1];
    var originalText = fs.readFileSync(textFilesFolder+txtName,"UTF-8").toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    //console.log('org: '+originalText);
    var resultTable = result.replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(' ');
    var textTable = originalText.split(' ');
    var keywords = getKeywords(keywordsFolder+txtName);
    //send socket to client time by time
    //simplifize
    //lemmer.lemmatize(resultTable, function(err, transformResult){
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
          var keywordsSimplifize = [];
          keywords.forEach(function(keyword){
            if (keyword!==''&&keyword!==' '){
              keywordsSimplifize.push(keyword.toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(' ',''))
            }
          })
          //var campare = campareText(result, originalText);
          var precisionRecall = calculs.precisionRecall(resultSimplifize.split(' '), transformKeywords);
          //var precisionRecall = calculs.precisionRecall(resultTable,keywordsSimplifize);
          if (i !== (lines.length-1)){
            socket.emit('send msg', {
              WER: calculs.werCalcul(campare,textSimplifize),
              //WER: calculs.werCalcul(campare, originalText),
              recall: precisionRecall.recall,
              timeExec: results[i].tempExec
            });
            sendResults(results,i+1);    
          } else {
            socket.emit('send last msg', {
              WER: calculs.werCalcul(campare,textSimplifize),
              //WER: calculs.werCalcul(campare, originalText),
              recall: precisionRecall.recall,
              timeExec: results[i].tempExec
            });
          }
        });
      });
    }); 
  }
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

//get keywords
function getKeywords (filePath){
  var fs = require('fs-extra');
  return fs.readFileSync(filePath).toString().split('\n');
}

function sendRequest(file,callback) {
  var opts = {
    sampleRate: 44000,
    maxRequests: 1
  };
  var ffmpeg = require('fluent-ffmpeg');
  var fs = require('fs-extra');
  var request = require('superagent');
  var output = 'tmp.flac';
  ffmpeg.ffprobe(file, function (err, info) {
    ffmpeg()
    .on('error', function (err) {
      console.log(err);
    })
    .on('end', function () {
      processClip(output,callback);
    })
    .input(file)
    .output(output)
    .setStartTime(0)
    .duration(info.format.duration)
    .audioFrequency(opts.sampleRate)
    .toFormat('flac')
    .run();
  });
  
  function processClip(clip,done) {
    console.log('process clip '+clip);
    var start = new Date().getTime();
    transcribeClip(clip,function (err, result) {
      var end = new Date().getTime();
      var tempE = (end-start)/(1000*60);
      //fs.unlink(clip);
      if (!err) {
        return done(null, {temp: tempE, trans: result});
      }
      console.log(err);
    });
  }

  function transcribeClip(clip,done) {
    fs.readFile(clip, function (err, data) {
      if (err) return done(err);
      request
        .post('http://localhost:8888/client/dynamic/recognize')
        .type('audio/x-wav; rate=' + opts.sampleRate)
        .parse(request.parse.text)
        .send(data)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }    
          //console.log(res);      
          var text = res.text;
          //console.log(text);
          if (!text) return done(null, {result: []});
          try {
            done(null, JSON.parse(text));
          } catch (ex) {
            done(ex);
          }
        });
    });
  }};