'use strict';

exports.convertAudio = function(req, res) {
    var fs = require('fs-extra');
    var toolName = req.params.toolname;
    var inputType =req.params.inputtype;
    var audioName;
    var audioFolder;
    var audioPath;
    switch (inputType){
        case 'audiofile':
            audioFolder = __dirname+'/../upload_audio';
            audioName = (fs.readdirSync(audioFolder))[0];
            break;
        case 'yourmicro':
            audioFolder = __dirname+'/../recorded_audio';
            audioName = (fs.readdirSync(audioFolder))[0];
            break;
        default:
            break;
    }
    if (audioName !== "0-converted.wav" && audioName !== undefined){
        switch (toolName){
            case "Sphinx-4":
                var exec = require('child_process').exec;
                var cmd1 = 'cd '+audioFolder;
                var cmd2 = 'sox '+audioName+' -c 1 -r 16000 -b 16 0-converted.wav';
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
                var cmd2 = 'sox '+audioName+' -c 1 -r 8000 -b 16 0-converted.wav';
                console.log(cmd1+' ; '+cmd2);
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
    }
    else 
        res.json({
            convertMsg:'Your audio is missing'
        });
};