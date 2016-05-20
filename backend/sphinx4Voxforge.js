exports.transcribeVoxforge = function(req,res){
  console.log('Sphinx-$ recoie requete: '+req.params.corpusName);
  var corpus = req.params.corpusName;
  var fs = require('fs-extra');
  var socket = require('./websocket.js').getSocket();
  var calculs = require('./calculs.js');
  var lemmer =  require('lemmer');

  res.send(202);
  var corpusFolder = __dirname+'/../corpus/voxforge/';
  var output = [];

  fs.readdir(corpusFolder,function(err, spkList){
    if (err) {
      console.log(err);
      return;
    }
    scanSpk(spkList,0);
  });

  function scanSpk(spkList,i){
    var fs = require('fs-extra');
    if (i!==spkList.length) {
      if(fs.lstatSync(corpusFolder+spkList[i]).isDirectory()){
        fs.readFile(corpusFolder+spkList[i]+'/etc/prompts-original','utf-8',function(err,textList){
          console.log(textList);
          transcribe(corpusFolder+spkList[i]+'/wav/',textList.split('\n'),0,i+1,spkList,scanSpk);
        })
      }else scanSpk(spkList,i+1);
    } else {
      sendResults(output,0)
    }
  };

  function transcribe(folder,textList,i,numSpk,spkList,callback){
    if (i!==textList.length && textList[i]!=='') {
      var fileName = (textList[i].substr(0,textList[i].indexOf(' ',0))).replace(/[*\/]/g,"")+'.wav';
      sendRequest(folder+fileName, function (err, results) {
        if(err){
          console.log(err);
          return;
        }
        var result=results.trans;
        console.log(result);
        var org = textList[i].substr(textList[i].indexOf(' ',0)+1);
        output.push({text:org,tempExec:results.temp,trans:result.replace(/\[noise\]/g,"").replace(/\[laughter\]/g,"").replace(/mm/g,"")});
        console.log(result.replace(/\[noise\]/g,"").replace(/\[laughter\]/g,"").replace(/mm/g,""));
        transcribe(folder,textList,i+1,numSpk,spkList,callback);
      });
    }
    else {
      callback(spkList,numSpk);
    }
  }
 
  function sendResults(results,i){
    console.log('Audio '+i)
    var result = results[i].trans;
    var originalText = results[i].text.toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    var resultTable = result.replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(' ');
    var textTable = originalText.split(' ');
    lemmer.lemmatize(resultTable, function(err, transformResult){
      var resultSimplifize='';
      transformResult.forEach(function(word){
        if(word!==''&&word!==' ') resultSimplifize+=word+' ';
      });
      console.log("*transcribed*: "+resultSimplifize);
      lemmer.lemmatize(textTable, function(err, transformText){
        var textSimplifize='';
        transformText.forEach(function(word){
          textSimplifize+=word+' ';
        });
        console.log("*org*: "+textSimplifize);
        var campare = campareText(resultSimplifize, textSimplifize);
        if (i !== (results.length-1)){
          socket.emit('send msg', {
            WER: calculs.werCalcul(campare,textSimplifize),
            recall:0,
            timeExec: results[i].tempExec
          });
          sendResults(results,i+1);    
        } else {
          socket.emit('send last msg', {
            WER: calculs.werCalcul(campare,textSimplifize),
            recall:0,
            timeExec: results[i].tempExec
          });
        }
      });
    });
  }
}

//campare 2 strings and give to output the diff object that show the different btw 2 strings
function campareText(cibleText, originalText){
  var jsdiff = require('diff');
  var diffObject = jsdiff.diffWords(originalText, cibleText);
  return diffObject;
};

function sendRequest(file,callback) {
  console.log(file);
  var opts = {
    key: 'AIzaSyCA9K61DkVf8iO3br_LgrSEtoq1ZL8q3uA',
    sampleRate: 16000,
    lang: 'en-US',
    maxResults: 1,
    pfilter: 1
  };
  var ffmpeg = require('fluent-ffmpeg');
  var fs = require('fs-extra');
  var request = require('superagent');
  ffmpeg.ffprobe(file, function (err, info) {
    var outputfile = 'tmp.wav';
    ffmpeg()
    .on('error', function (err) {
      console.log(err);
    })
    .on('end', function () {
      processClip(__dirname+'/../'+outputfile,callback);
    })
    .input(file)
    .output(outputfile)
    .setStartTime(0)
    .duration(info.format.duration)
    .audioFrequency(opts.sampleRate)
    .toFormat('wav')
    .run();
  });
  
  function processClip(clip,done) {
    //console.log(clip);
    var start = new Date().getTime();
    transcribeClip(clip,function (err, result) {
      var end = new Date().getTime();
      var tempE = (end-start)/(1000*60);
      fs.unlink(clip);
      if (!err) {
        return done(null, {temp: tempE, trans: result});
      }
      console.log(err);
    });
  }

  function transcribeClip(clip,done) {
    fs.readFile(clip, function (err, data) {
      if (err) return done(err);
      var exec = require('child_process').exec;
      var cmd1 = 'cd '+__dirname+'/lib/sphinx-4/';
      var cmd2 = 'java -jar sphinx4Voxforge.jar '+clip;
      exec(cmd1+' ; '+cmd2, function(stderr,stdout) {
        if (stdout !== undefined){
          done(null,stdout);
        } else done(stderr);
      });
    });
  }
};