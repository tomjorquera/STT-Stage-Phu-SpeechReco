'use strict';

exports.convertAudio = function(req, res) {
    console.log(123333);
    var fs = require('fs-extra');
    var toolName = req.params.toolname;
    var inputType =req.params.inputtype;
    console.log(toolName);
    var audioName;
    var audioFolder;
    var audioPath;
    switch (inputType){
        case 'audiofile':
            audioFolder = __dirname+'/../upload_audio';
            audioName = (fs.readdirSync(audioFolder))[0];
            break;
        case 'micro':
            audioFolder = __dirname+'/../recorded_audio';
            var audioName = (fs.readdirSync(audioFolder))[0];
            break;
        default:
            break;
    }
    console.log(audioPath);
    switch (toolName){
        case "Sphinx-4":
            var exec = require('child_process').exec;
            var cmd1 = 'cd '+audioFolder;
            var cmd2 = 'sox '+audioName+' -c 1 -r 16000 0-converted.wav';
            exec(cmd1+' ; '+cmd2, function(error, stdout, stderr) {
                console.log('convert ok');
                fs.unlinkSync(audioFolder + '/' + (fs.readdirSync(audioFolder))[1]);
                res.json({
                    convertMsg: 'Convert ok!!',
                });
            });
        break;
        case "Kaldi":
            var exec = require('child_process').exec;
            var cmd1 = 'cd '+audioFolder;
            var cmd2 = 'sox '+audioName+' -c 1 -r 8000 0-converted.wav';
            exec(cmd1+' ; '+cmd2, function(error, stdout, stderr) {
                console.log('convert ok');
                fs.unlinkSync(audioFolder + '/' + (fs.readdirSync(audioFolder))[1]);
                res.json({
                    convertMsg:'Convert ok!!'
                });
            });
            break;
        default:
            break;
    };  
};