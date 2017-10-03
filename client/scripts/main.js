var Babble = (function () {
    var counter = 0;
    var newUUID = 0;

    setLocalStrage();
    ExitUpdate();
    addlistenform2();
    addlistenform1();
    textareaAutoGrow();

    //logout beacon
    function ExitUpdate() {
        window.addEventListener('unload', function () {
            navigator.sendBeacon('http://localhost:9000/logout', JSON.stringify(newUUID));
        });
    }

    window.onkeydown = function (e) {
        var code = e.keyCode ? e.keyCode : e.which;
        if(code == 13){
            var form1 = document.getElementById('message-form');
            if (form1 == null) {
                return;
            }
            var data = {
                name: '',
                email: '',
                message: '',
                timestamp: ''
            };
            for (var i = 0; i < form1.elements.length; i++) {
                var element = form1.elements[i];
                if (element.name == 'message') {
                    data.message = element.value;
                    element.innerHTML = ""
                    element.innertext = ""
                }
            }
            var info = localStorage['babble'];
            info = JSON.parse(info);
            var userinfo = info['userInfo'];
            var name = userinfo['name'];
            var email = userinfo['email'];
            data.name = name;
            data.email = email;
            data.timestamp = Date.now();
            postMessage(data, updateNone);
        }
    };

//initial local storage
    function setLocalStrage() {
        var userInfo = {
            name: '',
            email: ''
        };
        babble = {
            "currentMessage": '',
            "userInfo": userInfo
        };
        localStorage.setItem('babble', JSON.stringify(babble));
    }


    function textareaAutoGrow() {
        var textarea = document.querySelector('textarea');

        var mainPane = document.getElementsByClassName('mainChat');
        mainPane = mainPane[0];
        var inputArea = document.getElementsByClassName('write-msg-area');
        inputArea = inputArea[0];
        var msgarea = document.getElementsByClassName('msgs');
        msgarea = msgarea[0];
        if (textarea && mainPane && inputArea && msgarea) {
            var originalPercent = p2p(textarea.scrollHeight, mainPane);
            textarea.addEventListener('input', function(evt) {
                var oldScroll = textarea.scrollTop;
                inputArea.style.cssText = 'height:' + originalPercent + '%';
                var percent = p2p(textarea.scrollHeight, mainPane);
                inputArea.style.cssText = 'height:' + percent + '%';
                var bottom = (Number(percent));
                var maxHeight = 100 - Number(percent);//-10
                msgarea.style.cssText = 'bottom: ' + bottom + '%; max-height: ' + maxHeight + '%';
                if (textarea.scrollHeight > 300) {
                    percent = p2p(300, mainPane);
                    inputArea.style.cssText = 'height:' + percent + '%';
                    textarea.style.cssText = 'overflow-y: auto';
                    textarea.scrollTop = oldScroll;
                    bottom = (Number(percent));
                    maxHeight = 100 - Number(percent);//-10
                    msgarea.style.cssText = 'bottom:' + bottom + '%; max-height: ' + maxHeight + '%';
                    } else {
                        textarea.style.cssText = 'overflow-y: hidden';
                }
            }, false);
        }
    }

    function p2p(pixel, mainPane) {
        var screenHeight = mainPane.clientHeight;
        var Percent = Math.round((pixel / screenHeight) * 100);
        return Percent;
    }





//remove modal
    function modalFunctionReg() {
        modal.style.display = "none";
    }
//anonymous obj created
    function modalFunctionAnon() {
        document.getElementById("name_modal").value = "Anonymous";
        obj = {
            'name': "Anonymous",
            'email': "",
        };
        register(obj);
        // var modal = document.getElementById("register");
        // modal.style.display = "none";
        // getStats(updateStats);
        // getMessages(counter, updateMessages);
    }
//text area grow for the message
    function auto_grow(element) {
        element.style.height = "5px";
        element.style.height = (element.scrollHeight) + "px";
    }
//after pressing the x button this function is called
    function deleteMSG(element) {
        var d = element.closest('li');
        var id = d.id;
        deleteMessage(id, updateDeleteMessage);
    }

    //call back '/messages/:id'
    function updateDeleteMessage(e) {
        //d.style.display = "none";
        //update stats
    }

    //delete request to the server
    function deleteMessage(id, callback) {
        var data = '';
        var xhr = new XMLHttpRequest();
        xhr.open('DELETE', 'http://localhost:9000/messages/' + id, true); // should be http://localhost:9000/messages/:'+id
        xhr.addEventListener('load', function (e) {
            callback(JSON.parse(e.target.responseText));
        });
        xhr.send();
    }

    function addLi(msgg) {
        var gravatar = 'https://www.gravatar.com/avatar/' + msgg.hash + '.jpg?d=identicon';
        var li_num = msgg.id;//getGreeter();
        var ol = document.getElementById("msgsID");
        var li = document.createElement("li");
        li.setAttribute("id", li_num); // added line
        li.style.display = "block";
        var img_li = document.createElement('img');
        img_li.setAttribute('id', 'img-msg-' + li_num);
        li.appendChild(img_li);
        var article_li = document.createElement('article'); // create all attributes in header
        var cite_article_li = document.createElement('cite');
        cite_article_li.setAttribute('class', 'message-header');
        cite_article_li.setAttribute('id', 'cite-msg-' + li_num);
        article_li.appendChild(cite_article_li);
        // 00:00
        var timeToShow = ArrageTime(msgg.timestamp);
        var time = document.createElement('time');
        var innertext = document.createTextNode(timeToShow);
        time.setAttribute('class', 'msg-time');
        time.setAttribute('datetime', '08:00:00+03:00:00');
        time.setAttribute('id', 'time-msg-' + li_num);
        time.appendChild(innertext);
        article_li.appendChild(time);


        var button = document.createElement('button');
        button.setAttribute('class', 'close-msg');
        button.setAttribute('onclick', 'Babble.deleteMSG(this)');

        //only if this is his message
        var info = localStorage['babble'];
        info = JSON.parse(info);
        var userinfo = info['userInfo'];
        var Rname = userinfo['name'];
        if (msgg.name == Rname) {
            button.setAttribute('id', 'button-msg-' + li_num);
            article_li.appendChild(button);
        }


        var p = document.createElement('p');
        p.setAttribute('class', 'msg-content');
        p.setAttribute('id', 'content-msg-' + li_num);
        article_li.appendChild(p);
        li.appendChild(article_li);
        ol.appendChild(li);
        document.getElementById("img-msg-" + li_num).src = encodeURI(gravatar);
        document.getElementById("cite-msg-" + li_num).innerHTML = msgg.name;
        if (msgg.name == Rname) {
            document.getElementById("button-msg-" + li_num).innerHTML = "X";
        }
        var oll = document.getElementById("msgsID");
        oll.scrollTop = oll.scrollHeight;
        return li_num;
    }

    //arrage time to make it look with 05:39 instead of 5:39
    function ArrageTime(ts){
        var d = new Date(Number(ts));
        var timeToShow;
        if (d.getMinutes() < 10)
            if (d.getHours() < 10)
                timeToShow = "0" + d.getHours() + ":0" + d.getMinutes();
            else
                timeToShow = d.getHours() + ":0" + d.getMinutes();
        else
            if (d.getHours() < 10)
                timeToShow = "0" + d.getHours() + ":" + d.getMinutes();
            else
                timeToShow = d.getHours() + ":" + d.getMinutes();
        return timeToShow;
    }

    //listener for the modal form
    function addlistenform2() {
        var form2 = document.getElementById('modal-form');
        if (form2 == null) {
            return;
        }
        form2.addEventListener('submit', function (e) {
            e.preventDefault();
            obj = {
                'name': document.getElementById("name_modal").value,
                'email': document.getElementById("email").value,
            };
            register(obj);
            var modal = document.getElementById("register");
            modal.style.display = "none";

            getStats(updateStats);
            getMessages(counter, updateMessages);
        });
    }



    //call back /stat
    function updateStats(e) {
        stats = e;
        counter = stats.messages;
        var users = stats.users;
        document.getElementById('newMSG').innerHTML = stats.messages;
        document.getElementById('connected').innerHTML = users;
        getStats(updateStats);
    }
//send stats request to server
    var getStats = function (callback) {
        var data = '';
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://localhost:9000/stats', true);
        xhr.addEventListener('load', function (e) {
            callback(JSON.parse(e.target.responseText));
        });
        xhr.send();
    }


    //callback /messages?counter=xx
    function updateMessages(e) {
        new_mess = e;
        var msg = new_mess[0];
        if (msg.toDelete == 0) {
            for (var i = 0; i < new_mess.length; ++i) {
                //counter += 1;
                var msg = new_mess[i];
                var linum = addLi(msg);
                document.getElementById("content-msg-" + linum).innerHTML = msg.message;
            }
        } else {
            //delete message
            var li = document.getElementById(Number(msg.id));
            if (li != null) {
                var ol = document.getElementById("msgsID");
                ol.removeChild(li);
            }
        }
        getMessages(counter, updateMessages);
    }

    //user id generator
    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

//send counter to check if needs to update
    var getMessages = function (counter, callback) {
        var data = '';
        var xhr = new XMLHttpRequest();
        var newUUID = guid();
        xhr.open('GET', 'http://localhost:9000/messages?counter=' + counter, true);
        xhr.setRequestHeader('X-Request-ID', newUUID);
        //xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.addEventListener('load', function (e) {
            callback(JSON.parse(e.target.responseText));
            //poll(counter,getMessages);
        });
        xhr.send();
    }


    //callback '/messages'
    function updateNone(e) {
        var msgid = e;
        console.log("msgid: " + msgid);
        //do nothing
    }

    var register = function (obj) {
        var babbl = {
            'userInfo': obj,
            'currentMessage': '',
        }
        localStorage['babble'] = JSON.stringify(babbl);
    }

    var postMessage = function (data, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("post", "http://localhost:9000/messages", true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.addEventListener('load', function (e) {
            callback(JSON.parse(e.target.responseText));
        });
        xhr.send(JSON.stringify(data));
    }


    function addlistenform1() {
        var form1 = document.getElementById('message-form');
        if (form1 == null) {
            return;
        }
        form1.addEventListener('submit', function (e) {
            e.preventDefault();
            //console.log(form.action);
            var data = {
                name: '',
                email: '',
                message: '',
                timestamp: ''
            };
            for (var i = 0; i < form1.elements.length; i++) {
                var element = form1.elements[i];
                if (element.name == 'message') {
                    data.message = element.value;
                }
            }
            var info = localStorage['babble'];
            info = JSON.parse(info);
            var userinfo = info['userInfo'];
            var name = userinfo['name'];
            var email = userinfo['email'];
            data.name = name;
            data.email = email;
            data.timestamp = Date.now();
            postMessage(data, updateNone);
        });
    }

    return {
        textareaAutoGrow: textareaAutoGrow,
        deleteMSG: deleteMSG,
        modalFunctionAnon: modalFunctionAnon,
        postMessage: postMessage,
        getMessages: getMessages,
        getStats: getStats,
        deleteMessage: deleteMessage,
        register: register
    };

})();





