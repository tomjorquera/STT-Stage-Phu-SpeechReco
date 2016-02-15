'use strict';

exports.uploadFile = function(req, res, next){
  var datatype = req.params.datatype;
  if (datatype === 'stream'){
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
      //Path where audio file will be uploaded
      if (filename.indexOf('.wav') !== -1){  
        var fs = require('fs-extra');       //File System - for file manipulation      
        var fstream;
        var dirUploadFolder = __dirname+'/../upload_audio/';
        if (!fs.existsSync(dirUploadFolder)){
          fs.mkdirSync(dirUploadFolder);
        }
        var files = fs.readdirSync(dirUploadFolder);
        if (files.length !== 0){
          for (var i=0;i<files.length;i++){
            fs.unlinkSync(dirUploadFolder+files[i]);
          }
        }
        fstream = fs.createWriteStream(dirUploadFolder+filename);
        file.pipe(fstream);
        fstream.on('close', function () {    
          //console.log("Upload Finished of " + filename);       
          res.end();
        });
      }
      if (filename.indexOf('.txt') !== -1){
        var fs = require('fs-extra');       //File System - for file manipulation
        var fstream;
        var dirUploadFolder = __dirname+'/../upload_text/';
        if (!fs.existsSync(dirUploadFolder)){
          fs.mkdirSync(dirUploadFolder);
        }
        var files = fs.readdirSync(dirUploadFolder);
        if (files.length !== 0){
          for (var i=0;i<files.length;i++){
            fs.unlinkSync(dirUploadFolder+files[i]);
          }
        }
        fstream = fs.createWriteStream(dirUploadFolder+filename);
        file.pipe(fstream);
        fstream.on('close', function () {          
          res.end();
        });
      }
    });
  }
  else if (datatype === 'file'){
    var fs = require('fs-extra');
    var file = req.body;
    var fd = __dirname+'/../recorded_audio/'+file.name;

    if (!fs.existsSync(__dirname+'/../recorded_audio/')){
      fs.mkdirSync(__dirname+'/../recorded_audio/');
    } 
    var files = fs.readdirSync(__dirname+'/../recorded_audio/');
    if (files.length !== 0){
      for (var i=0;i<files.length;i++){
        fs.unlinkSync(__dirname+'/../recorded_audio/'+files[i]);
      }
    }
    file.contents = file.contents.split(',').pop();

    var buf = new Buffer(file.contents, 'base64');
    fs.writeFileSync(fd,buf);
    res.end();  
  }
};