/**
 * Example for express server
 */
const express = require('express'),
    config = require('../pdns-config.json'),
    restRouter = require('../lib/rest-router');

let PORT = process.argv.indexOf("--port")>0? process.argv[process.argv.indexOf("--port")+1]: 3000;

var app = express();
// app.get('/', function (req, res) { res.send('Hello World!') })
app.use('/domains', restRouter(config));

app.listen(PORT, function (){
  console.log('Example app listening on port ' + PORT);
});
