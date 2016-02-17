var express = require('express'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  errorhandler = require('errorhandler'),
  morgan = require('morgan'),
  routes = require('./backend'),
  api = require('./backend/api'),
  http = require('http'),
  path = require('path'),
  busboy = require('connect-busboy'), //middleware for form/file upload
  transcribe = require('./backend/transcribe'),
  upload = require('./backend/upload'),
  convert = require('./backend/convert'),
  socket = require('./backend/websocket');

var app = module.exports = express();


/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/frontend/views');
app.set('view engine', 'jade');
//app.use(express.limit('4mb'));
app.use(morgan('dev'));
//app.use(bodyParser());
app.use(bodyParser.json({ limit: '5mb' }))
//app.use(bodyParser.json());  
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(busboy());

var env = process.env.NODE_ENV || 'development';

// development only
if (env === 'development') {
  app.use(errorhandler());
}

// production only
if (env === 'production') {
  // TODO
}

/**
 * Routes
 */

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);
// API
app.get('/api/name', api.name);
//transcribe audio
app.get('/transcribe/:tool/:inputtype', transcribe.transcribedText);
//convert audio
app.get('/convert/:toolname/:inputtype', convert.convertAudio);
//upload file
app.post('/upload/:datatype', upload.uploadFile);
// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

/**
 * Start Server
 */
var server = http.createServer(app);

server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

var initSocket = socket.init(server);

