var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.get('/', function (req, res) {
    var ip = req.connection.remoteAddress;
    res.send('<h1>Signal Server Running on ' + ip + ':' + port + '</h1>');
    // res.sendFile(__dirname + '/index.html');
});
/**
default namespace /  This namespace is identified by io.sockets or simply io
 var nsp = io.of('/my-namespace');
 nsp.on('connection', function(socket){
  console.log('someone connected');
});
 nsp.emit('hi', 'everyone!');
 ---------------
 var socket = io('/my-namespace');
===============
 io.to('some room').emit('some event');
 io.in('some room').emit('some event');
 Each Socket in Socket.IO is identified by a random, unguessable, unique identifier Socket#id.
 For your convenience, each socket automatically joins a room identified by this id

 io.to(id).emit('my message', msg);
 socket.broadcast.to(id).emit('my message', msg);

 */

/*io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    socket.on('chat message', function (msg) {
        console.log('message: ' + msg);
    });
});*/


//map key-value
var userMap = {};
// var jsonList = [];
//为了防止误解 client 替代 socket
io.on('connection', function (client) {
    client.removeAllListeners();
    console.log('-- ' + client.id + ' connection --');
    //
    client.on('doLogin', function (options, callback) {
        console.log('-- ' + client.id + ' doLogin ' + options + ' --');
        if (callback) {
            //返回socketId
            callback(client.id);
        }
        //赋值
        var js = JSON.parse(options);
        js.socketId = client.id;
        options = JSON.stringify(js);
        userMap[client.id] = options;
        client.broadcast.emit('onLogin', options);
        io.emit('onUserChange', userMap);
        console.log('-- userMap json ' + JSON.stringify(userMap) + ' --');
    });
    client.on('doLogout', function (options) {
        console.log('-- ' + client.id + ' doLogout ' + options + ' --');
        delete userMap[client.id];
        client.broadcast.emit('onLogout', options);
        io.emit('onUserChange', userMap);
        console.log('-- userMap json ' + JSON.stringify(userMap) + ' --');
    });
    //
    client.on('disconnect', function () {
        console.log('-- ' + client.id + ' disconnect --');
        //附加一步 移除断线客户端的用户信息 处理部分设备未正常退出
        delete userMap[client.id];
        io.emit('onUserChange', userMap);
        console.log('-- userMap json ' + JSON.stringify(userMap) + ' --');
    });
    //转发
     client.on('message', function (options) {
         // var otherClient = io.sockets.connected[details.to];
         io.emit('message', options);
     });
    //请求呼叫
    client.on('doVideoChat', function (options) {
        console.log('-- ' + client.id + ' doVideoChat --');
        //对方 socketId
        var to_socketId = JSON.parse(options.too).socketId;
        if (to_socketId === client.id) {
            return
        }
        /* if (io.sockets.connected[to_socketId]) {
             io.sockets.connected[to_socketId].emit("onVideoChat", options);
             console.log('-- ' + client.id + ' emit onVideoChat ' + to_socketId + ' --');
         }*/
        io.to(to_socketId).emit('onVideoChat', options);
        console.log('-- ' + client.id + ' emit onVideoChat ' + to_socketId + ' --');
    });
    client.on('doVideoChatAgree', function (options) {
        console.log('-- ' + client.id + ' doVideoChatAgree --');
        //对方 socketId
        //同意 呼叫发起方还是 from
        //所以是告诉 from  ！！！
        var from_socketId = JSON.parse(options.from).socketId;
        if (from_socketId === client.id) {
            return
        }
        /*if (io.sockets.connected[to_socketId]) {
            io.sockets.connected[to_socketId].emit("onVideoChatAgree", options);
            console.log('-- ' + client.id + ' emit onVideoChatAgree ' + to_socketId + ' --');
        }*/
        //所以是告诉 from  ！！！
        io.to(from_socketId).emit('onVideoChatAgree', options);
        console.log('-- ' + client.id + ' emit onVideoChatAgree ' + from_socketId + ' --');
    });
    //
    client.on('doCreateOffer', function (options) {
        console.log('-- ' + client.id + ' doCreateOffer ' + options + ' --');
        //对方 socketId
        var to_socketId = options.to_socketId;
        if (to_socketId === client.id) {
            return
        }
        /*if (io.sockets.connected[to_socketId]) {
            io.sockets.connected[to_socketId].emit("onCreateOffer", options);
            console.log('-- ' + client.id + ' emit onCreateOffer ' + to_socketId + ' --');
        }*/
        io.to(to_socketId).emit("onCreateOffer", options);
        console.log('-- ' + client.id + ' emit onCreateOffer ' + to_socketId + ' --');
    });
    //
    client.on('doCreateAnswer', function (options) {
        console.log('-- ' + client.id + ' doCreateAnswer ' + options + ' --');
        //对方 socketId
        //应答 呼叫发起方还是 from
        //所以是告诉 from  ！！！
        var from_socketId = options.from_socketId;
        if (from_socketId === client.id) {
            return
        }
        //所以是告诉 from  ！！！
       /* if (io.sockets.connected[from_socketId]) {
            io.sockets.connected[from_socketId].emit("onCreateAnswer", options);
            console.log('-- ' + client.id + ' emit onCreateAnswer ' + from_socketId + ' --');
        }*/
        io.to(from_socketId).emit("onCreateAnswer", options);
        console.log('-- ' + client.id + ' emit onCreateAnswer ' + from_socketId + ' --');
    });
    //
    client.on('doCandidate', function (options) {
        console.log('-- ' + client.id + ' doCandidate ' + options + ' --');
        //对方 socketId
        var to_socketId = options.to_socketId;
        if (to_socketId === client.id) {
            return
        }
       /* if (io.sockets.connected[to_socketId]) {
            io.sockets.connected[to_socketId].emit("onCandidate", options);
            console.log('-- ' + client.id + ' onCandidate ' + options + ' --');
        }*/
        io.to(to_socketId).emit("onCandidate", options);
        console.log('-- ' + client.id + ' emit onCandidate ' + to_socketId + ' --');
    });
    client.on('doCallEnd', function (options) {
        console.log('-- ' + client.id + ' doCallEnd --');
        //暂时不区分是谁挂断的
        var from_socketId = options.from_socketId;
       /* if (io.sockets.connected[from_socketId]) {
            io.sockets.connected[from_socketId].emit("onCallEnd", options);
            console.log('-- ' + client.id + ' onCallEnd ' + from_socketId + ' --');
        }*/
        io.to(from_socketId).emit("onCallEnd", options);
        console.log('-- ' + client.id + ' emit onCallEnd ' + from_socketId + ' --');
        var to_socketId = options.to_socketId;
       /* if (io.sockets.connected[to_socketId]) {
            io.sockets.connected[to_socketId].emit("onCallEnd", options);
            console.log('-- ' + client.id + ' onCallEnd ' + to_socketId + ' --');
        }*/
        io.to(to_socketId).emit("onCallEnd", options);
        console.log('-- ' + client.id + ' emit onCallEnd ' + to_socketId + ' --');
    });

    client.on('videoChatReject', function (options) {
        console.log('-- ' + client.id + ' videoChatReject ' + options + ' --');
        var from_socketId = JSON.parse(options.from).socketId;
        io.to(from_socketId).emit('videoChatReject', options);
    });
    client.on('isBeBusy', function (options) {
        console.log('-- ' + client.id + ' isBeBusy ' + options + ' --');
        //对方 socketId
        var from_socketId = JSON.parse(options.from).socketId;
        io.to(from_socketId).emit('isBeBusy', options);
    });
    /*  client.on('message', function (options) {
          var otherClient = io.sockets.connected[details.to];
          io.sockets.emit('message', userMap);
      });*/
    /*
       if (streams.getStreams().length > 0) {
           client.emit('id2', streams.getOtherStream(client.id));
           client.emit('callMe', client.id);
       } else {
           client.emit('id', client.id);
       }
*/
    /*  client.on('login', function (options) {
          console.log('-- ' + client.id + ' ' + options + ' is login --');
          idList.push(client.id);
          nameList.push(options);
          io.sockets.emit('idList', idList);
          io.sockets.emit('nameList', nameList);
      });*/
    /*  client.on('message', function (details) {
          var otherClient = io.sockets.connected[details.to];

          if (!otherClient) {
              return;
          }
          delete details.to;
          details.from = client.id;
          otherClient.emit('message', details);
      });*/

    /*client.on('readyToStream', function (options) {
        console.log('-- ' + client.id + ' ' + options + ' is ready to stream --');
        streams.addStream(client.id, options.name);
    });*/

    // console.log('--getStreams  ' + streams.getStreams())

    /*client.on('update', function (options) {
        streams.update(client.id, options.name);
    });*/

    /*   function leave() {
           console.log('-- ' + client.id + ' left --');
           streams.removeStream(client.id);

           //leave leave leave
           idList.removeByValue(client.id);
           io.sockets.emit('idList', idList);


       }*/

    /*client.on('logout', function (options) {
        console.log('-- ' + client.id + ' ' + options + ' left --');
        nameList.removeByValue(options);
        io.sockets.emit('nameList', nameList);
    });*/
    /*  client.on('disconnect', function (client) {
          console.log('-- ' + client.id + ' disconnect --');
      });*/
    // client.on('leave', leave);
    //
    /*   client.on('EVENT_USER_LOGIN', function (options) {
           console.log('== ' + client.id + ' ' + options + ' user_login --');
           io.sockets.emit('EVENT_USER_LOGIN', options);
           jsonList.push(options);
           io.sockets.emit('EVENT_USER_CHANGE', jsonList);
       });
       client.on('EVENT_USER_LOGOUT', function (options) {
           console.log('== ' + client.id + ' ' + options + ' user_logout --');
           io.sockets.emit('EVENT_USER_LOGOUT', options);
           for (var i = 0; i < jsonList.length; i++) {
               if (jsonList[i].key_userId == options.key_userId) {
                   jsonList.splice(i, 1);//deleteCount 1
                   break;
               }
           }
           io.sockets.emit('EVENT_USER_CHANGE', jsonList);
       });
       client.on('EVENT_USER_MESSAGE', function (options) {
           console.log('== ' + client.id + ' ' + options + ' user_message --');
           io.sockets.emit('EVENT_USER_MESSAGE', options);
       });*/
});

//不指定 hostname  req.connection.remoteAddress 获取到 ::ffff:192.168.0.111
/*http.listen(port, function () {
   console.log('listening on ' + port);
});*/
//指定 hostname  req.connection.remoteAddress 获取到 192.168.0.111
http.listen(port, '0.0.0.0', function () {
   console.log('listening on ' + port);
});
