var fs = require('fs');
var path = require('path');

var lib = {};

lib.create = function (dir, file, data, callback) {
    var file = path.join(__dirname,'..','.data',dir,file + '.json');

    fs.open(file, 'wx', function (err, handler) {
        if (err) {
            callback('Could not open file, reason: check if you have the correct permission');
        } else {
            var stringData = JSON.stringify(data);

            writeTofile(handler, stringData, callback);
        }
    });
}

lib.read = function (dir, file, callback) {
    var file = path.join(__dirname,'..','.data',dir,file + '.json');

    fs.readFile(file,'utf8',function(err, data){
        callback(err,JSON.parse(data));
    })
}

lib.update = function(dir, file, data, callback){
    var file = path.join(__dirname,'..','.data',dir,file + '.json');

    fs.open(file, 'r+', function (err, handler) {
        if (err) {
            callback('Could not open file, reason: check if you have the correct permission');
        } else {
            var stringData = JSON.stringify(data);

            fs.ftruncate(handler, function(err){
                if(err){
                    callback('Could truncate file ', err);
                }else{
                    writeTofile(handler, stringData, callback);
                }
            })
        }
    });
}

lib.delete = function (dir, file, callback) {
    var file = path.join(__dirname,'..','.data',dir,file + '.json');

    fs.unlink(file,function(err){
        if(err){
            callback('unable to delet file ', err);
        }else{
            callback(false);
        }
    })
}

writeTofile = function(handler, stringData, callback){
    fs.writeFile(handler, stringData, function (err) {
        if (err) {
            callback('Could not write file, reason: it may already exist');
        } else {
            fs.close(handler,function(err){
                if(err){
                    callback('Could not close file after writing');
                }else{
                    callback(false);
                }
            })
        }
    });
}

module.exports = lib;