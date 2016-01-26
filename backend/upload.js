'use strict';

exports.uploadFile = function(req, res, next){
  var fs = require('fs-extra');       //File System - for file manipulation
  var files = fs.readdirSync(__dirname+'/../upload/');
  if (files.length !== 0){
    for (var i=0;i<files.length;i++){
      fs.unlinkSync(__dirname+'/../upload/'+files[i]);
    }
  }
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    //Path where audio file will be uploaded
    fstream = fs.createWriteStream(__dirname +'/../upload/'+filename);
    file.pipe(fstream);
    /*fstream.on('close', function () {
        res.redirect('back');
    });*/
  });
  
};