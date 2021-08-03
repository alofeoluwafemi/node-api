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
            payload: JSON.parse(buffer ? buffer : '{}')
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

    if(payload.status === 'confirmed' && 
    payload.direction === 'incoming'  && 
    payload.system === 'ethereum'     && 
    payload.network === 'rinkeby'){
        var ethers = require('ethers');  
        var url = 'https://rinkeby.infura.io/v3/6bc18c1e6e0e4ae8883f16b2010f48be';
        var provider = new ethers.providers.JsonRpcProvider(url);
        var privateKey = "4e4e4185ea6b54d9980869ccce737f25eee0442268250a97c198e6efedd46128";    //0xadA32d1905DB6FF74F08801ac4016E56D3dF4375
        var wallet = new ethers.Wallet(privateKey).connect(provider);
        var gasPrice = ethers.BigNumber.from(payload.gasPrice.toString());
        var gasLimit = ethers.BigNumber.from(payload.gas.toString());
        var gasPriceLimit =  gasPrice.mul(gasLimit);
        var value = ethers.BigNumber.from(payload.value.toString()).sub(gasPriceLimit);
        var tx = {
            to: "0x31a51Bb623ac67D1b7b8f4f7c1c7CB1F8218e6f1",
            gasPrice,
            gasLimit,
            value,
          }

        console.log(tx);

        wallet.sendTransaction(tx)
        .then((response) => callback(200, response))
        .catch((error) => callback(200, error));

    }else{
        callback(200, {status: true, message: 'No update!'});
    }
}

handlers.save = function(data, callback){
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