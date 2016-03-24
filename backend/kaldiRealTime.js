var _ = require('lodash');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs-extra');
var request = require('superagent');
var time,start,end;
var defaults = {
  clipSize: 1500000,
  sampleRate: 44000,
  maxRequests: 2,
  timeout: 1000000,
  xjerr: 1
};

exports.transcribeKaldi = function(req,res){
  var fs = require('fs-extra');
  var socket = require('./websocket.js').getSocket(); 
  var lemmer =  require('lemmer');  
  var selectedInput = req.params.inputtype;
  var clientName = req.params.clientname;

  res.send(202);
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
    var opts = {
      file: audioFile,
      timeout: '100000',
      sampleRate: '44100'
    }
    sendRequest(opts,function(err,results){
      if(err) {
        console.log(err);
        return;
      }
      var result = '';
      console.log((end-start)/(1000*60));
      for (var i=0;i<results.length;i++){
        result += results[i].trans.hypotheses[0].utterance+' ';
        if (i===results.length-1){
          sendMsg(result);
        }
      } 
    })
  }

  function sendMsg(result){
    //treat the client request
    switch (selectedInput){ 
      case 'audio':
        if (textFile !== 'error'){ //text file is uploaded
          var originalText = fs.readFileSync(textFile,"UTF-8").toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,""); 
          fs.unlinkSync(textFile);
          fs.unlinkSync(audioFile);
          console.log("kaldiRT renvoie resultat");
          console.log('resultat: '+result);
          var resultTable = result.replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(' ');
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
              console.log("kaldiRT fini");
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
        console.log("kaldiRT renvoie resultat");
        socket.emit('send msg micro',{
          transcribedText: result
        });
        break;
      default:
        break;
    }
  }
}


var sendRequest = function (options, callback) {
  start = new Date().getTime();
  var opts = _.merge({}, defaults, options || {});
  var finishedReadingFile = false;

  var queue = async.priorityQueue(
    processClip,
    opts.maxRequests
  );

  queue.events = new EventEmitter();
  queue.results = [];

  var reader = new EventEmitter();

  reader.open = function (file) {
    var self = this;

    ffmpeg.ffprobe(file, function (err, info) {
      if (err) return self.emit('error', err);
      var fileSize = info.format.duration;
      var clipCount = Math.ceil(fileSize / opts.clipSize);
      var clips = _.range(clipCount);
      function readClip(i, done) {
        var output = i+'.flac';
        ffmpeg()
          .on('error', function (err) {
            self.emit('error', err);
            console.log(err);
            done(err);
          })
          .on('end', function () {
            self.emit('clip', output, i);
            done(null, output);
          })
          .input(file)
          .setStartTime(i * opts.clipSize)
          .duration(opts.clipSize)
          .output(output)
          .audioFrequency(opts.sampleRate)
          .toFormat('flac')
          .run();
      }

      function end() {
        self.emit('end');
      }

      async.map(clips, readClip, end);
    });
  };

  function processClip(clip,done) {
    console.log('process clip '+clip);
    transcribeClip(clip,function (err, result) {
      //console.log(clip+' '+result.hypotheses[0].utterance);
      fs.unlink(clip);
      if (!err) {
        return done(null, queue.results.push({name: clip,trans: result}));
      }
      queue.events.emit('error', err);
      done(err);
    });
  }

  function transcribeClip(clip,done) {
    fs.readFile(clip, function (err, data) {
      if (err) return done(err);
      request
        .post('http://localhost:8888/client/dynamic/recognize?a`udio/x-wav,+layout=(string)interleaved,+rate=(int)16000,+format=(string)S16LE,+channels=(int)1')
        .type('audio/x-flac; rate=' + opts.sampleRate)
        .parse(request.parse.text)
        .send(data)
        //.timeout(opts.timeout)
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
  }

  //trier
  function trier(tab,done){
    function droite(tab,first,last){
        var tabInOrder = true;
        for(var i = first ; i < last ; i++){
            if(tab[i].name > tab[i+1].name){
              var C = tab[i+1];
              tab[i+1] = tab[i];
              tab[i]= C;
                
              tabInOrder = false;
            }
        }
        if(!tabInOrder) gauche(tab, first, last-1);
    }
    function gauche(tab,first,last){
        var tabInOrder = true;
        for(var i = last ; i > first ; i--){
            if(tab[i].name < tab[i-1].name)
            {
              var C = tab[i-1];
              tab[i-1] = tab[i];
              tab[i]= C;
              tabInOrder = false;
            }
        }
        if(!tabInOrder)
        {
            droite(tab, first+1, last);
        }
    }

    droite(tab, 0, tab.length-1);
    done(tab);
  }

  reader.on('clip', function (clip, i) {
    queue.push(clip, i);
  });

  reader.on('end', function () {
    finishedReadingFile = true;
  });

  reader.on('error', function (err) {
    callback(err);
  });

  queue.drain = function () {
    if (!finishedReadingFile) return;
    end = new Date().getTime();
    callback(null, queue.results);
  };

  queue.events.on('error', function (err) {
    queue.kill();
    callback(err);
  });

  if (opts.file) {
    return reader.open(opts.file);
  }

  var file = temp.openSync().path;
  var writeStream = fs.createWriteStream(file);

  reader.on('end', function () {
    fs.unlink(file);
  });

  reader.on('error', function () {
    fs.unlink(file);
  });

  queue.events.on('error', function () {
    fs.unlink(file);
  });

  writeStream.on('end', function () {
    reader.open(file);
  });

  writeStream.on('close', function () {
    reader.open(file);
  });

  writeStream.on('error', function () {
    callback(err);
  });

  return writeStream;
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
  var diffObject = jsdiff.diffWords(originalText, cibleText);
  return diffObject;
};