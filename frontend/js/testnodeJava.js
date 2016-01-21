'use strict';

/*
 * Serve JSON to our AngularJS client
 */

 exports.osName = function(req, res) {
 	res.json({
 		osOs: 	os.platform(),
 		osJava: nodejava.import('java.lang.System').getPropertySync("os.name")
 	});
 };

