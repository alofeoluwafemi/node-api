const http = require('http');
const https = require('https');
const url = require('url');
const {StringDecoder} = require('string_decoder');
const config = require('./config');
const fs = require('fs');
const path = require('path');

//Intatiate and start HTTP server
var httpServer = http.createServer(function(req, res){
    unifiedServer(req, res);
});

httpServer.listen(process.env.PORT,function(){
    console.log('Server is listening to port '+ config.httpPort);
});

// var httpsServerOptions = {
//     key: fs.readFileSync('./https/key.pem'),
//     cert: fs.readFileSync('./https/cert.pem') 
// };

// var httpsServer = https.createServer(httpsServerOptions,function(req, res){
//     unifiedServer(req, res);
// });

// httpsServer.listen(config.httpsPort,function(){
//     console.log('Server is listening to port '+ config.httpsPort);
// });


var unifiedServer = function(req, res){
    const baseURL = req.protocol + '://' + req.headers.host + '/';
    const parsedUrl = new URL(req.url, baseURL);

    const path = parsedUrl.pathname;
    const trimedPath = path.replace(/^\/+|\/+$/g,'');

    const queryStringParam = parsedUrl.searchParams;
    const method = req.method.toUpperCase();
    const decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data',function(data){
        buffer += decoder.write(data);
    })
    .on('end',function(){
        buffer += decoder.end();

        var choosenHandler = typeof(router[trimedPath])  === 'function' ? router[trimedPath] : router.notFound;

        var data = {
            method: method,
            trimedPath: trimedPath,
            queryStringParam: queryStringParam,
            headers: req.headers,
            payload: JSON.parse(buffer)
        }

        choosenHandler(data, function(statusCode, payload){

        var statusCode = typeof(statusCode)  === 'number' ? statusCode : 200;
        var payload = typeof(payload)  === 'object' ? payload : {};
        var payloadString = JSON.stringify(payload);

        res.setHeader('Content-Type','application/json');
        res.writeHead(statusCode);
        res.end(payloadString);

        console.log(trimedPath ,statusCode, payload);
        });
    });
};

//Manage Routes
var handlers = {};

handlers.ping = function(data, callback){
    callback(200);
}

handlers.transaction = function(data, callback){
    var payload = data.payload;
    var dir = path.join(__dirname);
    var file = dir + '/' + 'response.json';

    // if(payload.status === 'confirmed' && payload.network === 'rinkeby'){
    if(payload.status === 'confirmed'){
        fs.open(file,'w',function(err, handler){
            if(err){
                callback({'error': err});
            }else{
                var stringData = JSON.stringify(payload);

                fs.writeFile(handler, stringData, function(err){

                    if(err){
                        callback(200, {status: true, message: err});
                    }else{
                        callback(200, payload);
                    }
                });
            }
        });
    }else{
        callback(200, {status: true, message: 'No update!'});
    }
}

handlers.notFound = function(data, callback){
    callback(404);
}

var router = {
    ping: handlers.ping,
    transaction: handlers.transaction,
    notFound: handlers.notFound
}