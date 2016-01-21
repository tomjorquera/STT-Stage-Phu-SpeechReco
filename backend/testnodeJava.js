var os = require('os');
document.write('You are running on ',os.platform(),"</br></br>");

var javaO = require('java');

console.log(javaO);

var javaLangSystem = javaO.import('java.lang.System');

document.write(javaLangSystem.getPropertySync("os.name"));