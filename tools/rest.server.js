/**
 * Example for express server
 */
const express = require('express'),
    pdns_config = require('../pdns-config.json'),
    rest_config = require('../rest-config.json'),
    restRouter = require('../lib/rest-router');

let PORT = process.argv.indexOf("--port")>0? process.argv[process.argv.indexOf("--port")+1]: rest_config.port || 8082;


var app = express();
// app.get('/', function (req, res) { res.send('Hello World!') })
if (rest_config.token)
    app.use('/domains', (req, res, next) => {
        if (req.headers['x-api-key'] != rest_config.token) {
            res.sendStatus(401);
            return;
        }
        next();
    })
app.use('/domains', restRouter(pdns_config));

app.listen(PORT, () => {
    console.log('Example app listening on port ' + PORT);
});
