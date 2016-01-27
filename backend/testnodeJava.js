'use strict';

/*
 * Serve JSON to our AngularJS client
 */

 exports.osName = function(req, res) {
 	var os = require('os'); 
 	var nodejava = require('java');		
 	res.json({
 		osOs: os.platform(),
 		//osJava: nodejava.import('java.lang.System').getPropertySync('os.name')
 	});
 };
