'use strict';

exports.create = function(req,res){
	var corpusName = req.params.corpusname;
	var  fs = require('fs-extra');
	var corpusDir = __dirname+'/../corpus/'+corpusName;
	if(fs.exists(corpusDir)){
		res.json('Change your corpus name, this name was used');
	} else{
		fs.mkdirSync(corpusDir);
		fs.writeFileSync(corpusDir+'/'+corpusName+'.txt', "");
		fs.mkdirSync(corpusDir+'/wav-for-kaldi/');
		fs.mkdirSync(corpusDir+'/wav-for-sphinx/');
		fs.mkdirSync(corpusDir+'/wav/');
		fs.mkdirSync(corpusDir+'/txt/');
		res.json('Name Valide');
	}
}
 
exports.addContent = function(req,res){
	var  fs = require('fs-extra');
	var corpusName = req.params.corpusname;
	var corpusDir = __dirname+'/../corpus/'+corpusName+'/wav/';
	var txt = __dirname+'/../corpus/'+corpusName+'/'+corpusName+'.txt';
	console.log(corpusDir);
	var files = fs.readdirSync(corpusDir);
	files.forEach(function(file){
		var line = file+' '+file.replace('.wav','')+'.txt'+'\n';
		fs.appendFile(txt, line, function (err) {
	        if (err) return console.log(err);
	        convert(file,corpusName);
	    });
	});
	res.end();
}

//convert file in wav to wav-for-kaldi and for-sphinx
function convert(audioName,corpusName){
	var  fs = require('fs-extra');
	var corpusDir = __dirname+'/../corpus/'+corpusName+'/wav/';
    var exec = require('child_process').exec;
    var cmd1 = 'cd '+corpusDir;
    var cmd2 = 'sox '+audioName+' -c 1 -r 16000 -b 16 ./../wav-for-sphinx/'+audioName;
    exec(cmd1+' ; '+cmd2, function(error, stdout, stderr) {
        var exec2 = require('child_process').exec;
        var cmd1 = 'cd '+corpusDir;
        var cmd2 = 'sox '+audioName+' -c 1 -r 8000 -b 16 ./../wav-for-kaldi/'+audioName;
        exec2(cmd1+' ; '+cmd2, function(error, stdout, stderr) {
            fs.unlinkSync(corpusDir + '/' + audioName);
        });
    });
}