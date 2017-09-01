var Gmessages=[];

var GmessagesNextId = 0;
var GmessagesCounter = 0;

function addMessage(msgObj){
msgObj.id = GmessagesNextId;
Gmessages.push(msgObj)
GmessagesCounter = GmessagesCounter + 1;
GmessagesNextId = GmessagesNextId + 1;
return GmessagesNextId;
}

function getMessages(counter){
var msgs=[];
        for(var i=counter; i < GmessagesCounter;++i){
        msgs.push(Gmessages[i]);
    }
    return msgs;
}
function getNumberOfMessages(){
    return GmessagesCounter;
}

function deleteMessage(id){
var msgID = parseInt(id);
    if (msgID > -1) {
        Gmessages.splice(msgID, 1);
    }
    GmessagesCounter = GmessagesCounter - 1;
}

module.exports ={
    deleteMessage: deleteMessage,
    getMessages: getMessages,
    addMessage: addMessage,
    getNumberOfMessages: getNumberOfMessages
}