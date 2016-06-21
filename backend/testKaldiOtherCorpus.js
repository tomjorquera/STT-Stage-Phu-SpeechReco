exports.transcribeCorpus = function(req,res){
  console.log('Kaldi recoie requete: '+req.params.corpusName);
  var corpus = req.params.corpusName;
  var fs = require('fs-extra');
  var socket = require('./websocket.js').getSocket();
  var calculs = require('./calculs.js');
  var lemmer =  require('lemmer');
  var corpusFolder = __dirname+'/../corpus/'+corpus+'/';
  var audioFilesFolder = corpusFolder+'wav-for-kaldi/';
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
        console.log(filePaths[i])
        var end = new Date().getTime();
        if(err){
          console.log(err);
          return;
        }
        var resultsL = results.length;
        console.log(results.trans);
        var result = results.trans.hypotheses[0].utterance;
        var transcriptFile = __dirname+'/../corpus/'+corpus+'/transcript_file_'+i+'.txt';
        var fs = require('fs-extra');
        fs.appendFile(transcriptFile,result.replace(/[.]/g,"\n"), function (err) {
            if (err) return console.log(err);
            console.log("finish "+filePaths[i]);
        });
        output.push({tempExec: results.temp,trans: result.replace(/\[noise\]/g,"").replace(/\[laughter\]/g,"").replace(/mm/g,"")});
        transcribe(filePaths,i+1);
      });
    }
    else {
      sendResults(output,0);
    }
  }

  function sendResults(results,i){
    var resultTrans = results[i].trans.toLowerCase();
    var txtName = (lines[i].toString().split(' '))[1];
    var loadTxt = fs.readFileSync(textFilesFolder+txtName,"UTF-8").toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    var orgFile = __dirname+'/../corpus/'+corpus+'/original_file_'+i+'.txt';
    fs.appendFile(orgFile,loadTxt.replace(/[.]/g,"\n"), function (err) {
        if (err) return console.log(err);
    });
    var originalText = cleanText(loadTxt);
    var transcriptTxt = cleanText(resultTrans);
    console.log('transcris: '+transcriptTxt);
    var resultTable = transcriptTxt.split(' ');
    var textTable = originalText.split(' ');
    console.log(originalText);
    var keywords = getKeywords(keywordsFolder+txtName);
    var lemmer =  require('lemmer');
    lemmer.lemmatize(resultTable, function(err, transformResult){
      var resultSimplifize='';
      transformResult.forEach(function(word){
        if(word!==''&&word!==' ') resultSimplifize+=word+' ';
      });
      console.log("*transcribed*: "+resultSimplifize);
      lemmer.lemmatize(textTable, function(err, transformText){
        var textSimplifize='';
        transformText.forEach(function(word){
          if (word!==''&&word!==' ')
            textSimplifize+=word+' ';
        });
        console.log(textSimplifize);
        var keywordsSimplifize = []; 
        keywords.forEach(function(keyword){
          if (keyword!==''&&keyword!==' '){
            keywordsSimplifize.push(keyword.toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(' ',''));
          }
        })
        //lemmatize keywords
        lemmer.lemmatize(keywordsSimplifize, function(err, transformKeywords){
          var keywordsSimplifize = [];
          keywords.forEach(function(keyword){
            if (keyword!==''&&keyword!==' '){
              keywordsSimplifize.push(keyword.toLowerCase().replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/ /g,''));
            }
          })
          var campare = campareText(resultSimplifize, textSimplifize);
          var precisionRecall = calculs.precisionRecall(resultSimplifize.split(' '), transformKeywords);
          if (i !== (lines.length-1)){
            var sendObject = {
              WER: calculs.werCalcul(campare,textSimplifize),
              recall: precisionRecall.recall,
              timeExec: results[i].tempExec
            };
            console.log(sendObject);
            setTimeout(function(){
              socket.emit('send msg', sendObject);
            },2000);
            console.log('sent msg')
            sendResults(results,i+1);
          } else {
            var sendObject = {
              WER: calculs.werCalcul(campare,textSimplifize),
              recall: precisionRecall.recall,
              timeExec: results[i].tempExec
            };
            console.log(sendObject);
            setTimeout(function(){
              socket.emit('send last msg', sendObject);
            },2000);
            console.log('sent last msg')
          }
        });
      });
    }); 
  }

  //clean text
  function cleanText(originalText){
    var tm = require('text-miner');
    var my_corpus = new tm.Corpus([originalText.replace(/[.,"\/#!$%\^&\*;:{}=\-_`~()?]/g,"")]);
    //my_corpus.removeWords(["\'s","ain\'t","aren\'t","can\'t","couldn\’t","didn\'t","doesn't","don't","hasn't","haven't","he's","here's","i'd","i'll","i'm","i've","isn't","it'd","it'll","it's","let's","shouldn't","that's","they'd","they'll","they're","they've","wasn't","we'd","we'll","we're","we've","weren't","what's","where's","who's","won't","wouldn't","you'd","you'll","you're","you've"]);
    my_corpus.removeWords(["uh","yeah","yep","um","mmhmm","pe","ah","hmm","mm","mhm","yeah","\<unk\>","right","[noise]","[laughter]","little"]);
    //my_corpus.removeWords(tm.STOPWORDS.EN);
    my_corpus.removeNewlines();
    my_corpus.removeInvalidCharacters();
    my_corpus.clean();
    var result = my_corpus.documents[0];
    return result;
  }
}

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
    sampleRate: 8000,
    maxRequests: 1
  };
  var ffmpeg = require('fluent-ffmpeg');
  var fs = require('fs-extra');
  var request = require('superagent');
  ffmpeg.ffprobe(file, function (err, info) {
    var temp = require('temp');
    var outputfile = temp.path({suffix: '.wav'});
    ffmpeg()
    .on('error', function (err) {
      console.log(err);
    })
    .on('end', function () {
      processClip(outputfile,callback);
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
    console.log('process clip '+clip);
    var start = new Date().getTime();
    transcribeClip(clip,function (err, result) {
      var end = new Date().getTime();
      var tempE = (end-start)/(1000*60);
      if (!err) {
        return done(null, {temp: tempE, trans: result});
      }
      console.log(err);
    });
  };

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
          var text = res.text;
          if (!text) return done(null, {result: []});
          try {
            done(null, JSON.parse(text));
          } catch (ex) {
            done(ex);
          }
        });
    });
  };
};