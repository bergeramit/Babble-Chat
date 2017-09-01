var http = require('http');
var urlUtil = require('url');
var crypto = require('crypto');
var queryUtil = require('querystring');
var messages = require('./messages-util.js');
//clients that are waiting
var clients = [];
var stats_wait_list = [];


var online = 0;
var MSGID = 0;

function pushStats() {
    var stats = {
        'users': Math.max(stats_wait_list.length,clients.length),
        'messages': messages.getNumberOfMessages()
    };
    var upstats;
    while (stats_wait_list.length > 0) {
        upstats = stats_wait_list.pop();
        upstats.response.end(JSON.stringify(stats));
    }
}

var server = http.createServer(function (request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    var url = urlUtil.parse(request.url, true);
    if (request.method === 'GET') {
        //var url = urlUtil.parse(request.url);
        var datacounter = Number(url.query.counter);
        if (url.pathname == '/messages') {
            console.log("DATA COUNTER");
            console.log(datacounter);
            // var msgs=[];
            // for(var i=datacounter;i<GmessagesCounter;++i){
            //     msgs.push(Gmessages[i]);
            // }
            var msgs = messages.getMessages(datacounter);
            if (msgs.length != 0) {
                pushStats();
                response.end(JSON.stringify(msgs))
                //response with new messages
            } else {
                var waitclient = {
                    request: request,
                    response: response
                }
                clients.push(waitclient);
                pushStats();
            }
        } else {
            if (url.pathname == '/stats') {
                var waitstat = {
                    request: request,
                    response: response
                }
                stats_wait_list.push(waitstat);
                //pushStats();
            }
        }
        //response.end();
    } else if (request.method === 'POST') {
        if (url.pathname == '/messages') {
            console.log("start Post New Message");
            var requestBody = '';
            request.on('data', function (chunk) {
                requestBody += chunk.toString();
            });
            request.on('end', function () {
                //var url = urlUtil.parse(request.url,true);
                var data = JSON.parse(requestBody);
                //'toDelete' 0 for no delete this id, 1 to delete
                var msg_obj = {
                    'toDelete': 0,
                    'name': data.name,
                    'email': data.email,
                    'message': data.message,
                    'timestamp': data.timestamp,
                    'id': 0,
                    'hash': crypto.createHash('md5').update(String(data.email)).digest("hex")
                };
                var msg = [];
                msg.push(msg_obj);
                //Gmessages.push(msg_obj);
                MSGID = messages.addMessage(msg_obj);
                console.log('we have all the data ', msg);
                console.log('pathname: ', url.pathname);
                // var stats = {
                //     'users': clients.length,
                //     'messages': GmessagesCounter
                // };
                // var upstats;
                // while(stats_wait_list.length >0){
                //     upstats = stats_wait_list.pop();
                //      upstats.end(JSON.stringify(stats));
                // }
                pushStats();
                var client;
                while (clients.length > 0) {
                    client = clients.pop();
                    client.response.end(JSON.stringify(msg));
                }
                console.log("end Post New Message");
                response.end(JSON.stringify(MSGID));
            });
        } else if (url.pathname == '/logout') {
            var requestBody = '';
            request.on('data', function (chunk) {
                requestBody += chunk.toString();
            });
            request.on('end', function () {

                var userToDeleteUUIDheader = JSON.parse(requestBody);

                var userToDeleteUUID = clients.filter(function (user) { return user.request.headers['x-request-id'] === userToDeleteUUIDheader; });
                var indexlogout = clients.indexOf(userToDeleteUUID[0]);
                clients.splice(indexlogout, 1);
                pushStats();
            });
        }

    } else if (request.method === 'DELETE') {
        console.log("start DELETE");
        var url = urlUtil.parse(request.url);
        //var data = parseInt(url.pathname.substring(11,url.pathname.length));
        //url.pathname.replace('\d', '');
        console.log("data ", url.pathname);
        if (url.pathname.substr(0, 10) == '/messages/') { // should be: url.pathname.substr(0,11) == '/messages/:'
            var data = unescape(url.pathname.substr(10));//should be url.pathname.substr(11)
            console.log("data ", data);
            messages.deleteMessage(data);

            //  var msgID = parseInt(data);
            //  if (msgID > -1) {
            //      Gmessages.splice(msgID, 1);
            //  }
            //  GmessagesCounter = GmessagesCounter - 1;
            pushStats();
            var msg_obj = {
                'toDelete': 1,
                'id': data
            };
            var msg = [];
            msg.push(msg_obj);
            var client;
            while (clients.length > 0) {
                client = clients.pop();
                client.response.end(JSON.stringify(msg));
            }
            response.end();
        } else {

        }
        console.log("end DELETE");
    } else if (request.method === 'OPTIONS') {
        response.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE');
        response.setHeader('Access-Control-Allow-Headers', 'X-Request-ID');

        //bad request
        response.write(http.STATUS_CODES[204] + '\n');
        response.end();
    } else {
        console.log("nothing caught ", request.method);
        response.writeHead(405);
        response.end();
    }
});

server.listen(9000);
console.log('listening...');







//var split = data.split(":");
            //console.log('we have all the data ', data);
            //res.writeHead(200, {"Content-Type": "text/plain"});
            //res.end(md5(split[0]));