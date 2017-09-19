var http = require('http');
var urlUtil = require('url');
var crypto = require('crypto');
var queryUtil = require('querystring');
var messages = require('./messages-util.js');
//clients new messages response wait list
var clients = [];
//clients's stats response wait list
var stats_wait_list = [];
//next msg ID
var MSGID = 0;

//send response to /stats
function pushStats() {
    var stats = {
        'users': Math.max(stats_wait_list.length, clients.length),
        'messages': messages.getNumberOfMessages()
    };
    var upstats;
    while (stats_wait_list.length > 0) {
        upstats = stats_wait_list.pop();
        upstats.response.end(JSON.stringify(stats));
    }
}

//handle option call from client
function HandleOptions(response) {
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'X-Request-ID');
    //bad request
    response.write(http.STATUS_CODES[204] + '\n');
    response.end();
}

// handle post new message: send message to all clients and updates stats
function postMessageFromServer(data, response) {
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
    MSGID = messages.addMessage(msg_obj);
    pushStats();
    var client;
    while (clients.length > 0) {
        client = clients.pop();
        client.response.end(JSON.stringify(msg));
    }
    response.end(JSON.stringify(MSGID));
}


//update delete messages by sending message id to delete and update stats
function updateDeleteMessage(data, response) {
    messages.deleteMessage(data);
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
}


//remove client from the listeners and update stats
function removeClient(requestBody) {
    //get the user to remove
    var userToDeleteUUIDheader = JSON.parse(requestBody);
    var userToDeleteUUID = clients.filter(function (user) { return user.request.headers['x-request-id'] === userToDeleteUUIDheader; });
    //remove from listeners
    var indexlogout = clients.indexOf(userToDeleteUUID[0]);
    clients.splice(indexlogout, 1);
    pushStats();
}


var server = http.createServer(function (request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    var url = urlUtil.parse(request.url, true);
    if (request.method === 'GET') {
        if (url.pathname == '/messages') {
            //check the server counter vs the client's one
            var datacounter = Number(url.query.counter);
            var msgs = messages.getMessages(datacounter);
            if (msgs.length != 0) {
                //there are new messages and we need to update the messages counter
                pushStats();
                //need to send stats again and keep listening for changes
                //IOW end of request
                response.end(JSON.stringify(msgs))
            } else {
                //this client number of messages is the same in server, so need to listen for changes
                var waitclient = {
                    request: request,
                    response: response
                }
                //added a client to listen to incoming new messages
                clients.push(waitclient);
                pushStats();
            }
        } else {
            if (url.pathname == '/stats') {
                //client need to keep waiting for the stats changes
                var waitstat = {
                    request: request,
                    response: response
                }
                stats_wait_list.push(waitstat);
            }
        }
    } else if (request.method === 'POST') {
        if (url.pathname == '/messages') {
            var requestBody = '';
            request.on('data', function (chunk) {
                requestBody += chunk.toString();
            });
            request.on('end', function () {
                var data = JSON.parse(requestBody);
                //'toDelete' 0 for no delete this id, 1 to delete
                postMessageFromServer(data, response);
            });
        } else if (url.pathname == '/logout') {
            var requestBody = '';
            request.on('data', function (chunk) {
                requestBody += chunk.toString();
            });
            request.on('end', function () {
                removeClient(requestBody);
            });
        }

    } else if (request.method === 'DELETE') {
        var url = urlUtil.parse(request.url);
        if (url.pathname.substr(0, 10) == '/messages/') { // should be: url.pathname.substr(0,11) == '/messages/:'
            var data = unescape(url.pathname.substr(10));//should be url.pathname.substr(11)
            updateDeleteMessage(data, response);
        } else {

        }
    } else if (request.method === 'OPTIONS') {
        HandleOptions(response);
    } else {
        //bad request
        response.writeHead(405);
        response.end();
    }
});
server.listen(9000);
console.log('listening...');


