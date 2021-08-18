const http = require('http');
const { StringDecoder } = require('string_decoder');
const config = require('./config');
const router = require('./lib/router');

//Intatiate and start HTTP server
var httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res);
});

httpServer.listen(config.httpPort, function () {
    console.log('Server is listening to port ' + config.httpPort);
});


var unifiedServer = function (req, res) {
    const baseURL = req.protocol + '://' + req.headers.host + '/';
    const parsedUrl = new URL(req.url, baseURL);

    const path = parsedUrl.pathname;
    const trimedPath = path.replace(/^\/+|\/+$/g, '');

    const queryStringParam = parsedUrl.searchParams;
    const method = req.method.toUpperCase();
    const decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data', function (data) {
        buffer += decoder.write(data);
    })
        .on('end', function () {
            buffer += decoder.end();

            var choosenHandler = typeof (router[trimedPath]) === 'function' ? router[trimedPath] : router.notFound;

            var data = {
                method: method,
                trimedPath: trimedPath,
                queryStringParam: queryStringParam,
                headers: req.headers,
                payload: JSON.parse(buffer ? buffer : '{}')
            }

            choosenHandler(data, function (statusCode, payload) {

                var statusCode = typeof (statusCode) === 'number' ? statusCode : 200;
                var payload = typeof (payload) === 'object' ? payload : {};
                var payloadString = JSON.stringify(payload);

                res.setHeader('Content-Type', 'application/json');
                res.writeHead(statusCode);
                res.end(payloadString);

                //console.log(trimedPath, statusCode, payload);
            });
        });
};