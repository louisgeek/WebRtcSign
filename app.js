var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3001;
//
//map key-value
var userMap = {};
// var jsonList = [];
//
app.get('/', function (req, res) {
    var ip = req.connection.remoteAddress;
    res.send('<h1>Signal Server Running on ' + ip + ':' + port + '</h1>');
    // res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    //=========================================
    console.log(socket.id + 'connected');
    //===============  videoChatModelJson ================
    socket.on("videoChatInvite", function (videoChatModelJson, callback) {
        var videoChatModel = JSON.parse(videoChatModelJson);
        var inviteVideoChatUserModel = videoChatModel.inviteVideoChatUserModel;
        var otherUserModel = videoChatModel.otherUserModel;
        if (otherUserModel) {
            var socketId = otherUserModel.socketId;
            //通知对方客户端
            socket.to(socketId).emit('videoChatInvite', videoChatModelJson);
            if (inviteVideoChatUserModel) {
                console.log(inviteVideoChatUserModel.userName + ' videoChatInvite ' + otherUserModel.userName);
            }
        }
    });
    socket.on("videoChatCancel", function (videoChatModelJson, callback) {
        var videoChatModel = JSON.parse(videoChatModelJson);
        var inviteVideoChatUserModel = videoChatModel.inviteVideoChatUserModel;
        var otherUserModel = videoChatModel.otherUserModel;
        if (otherUserModel) {
            var socketId = otherUserModel.socketId;
            //通知对方客户端
            socket.to(socketId).emit('videoChatCancel', videoChatModelJson);
            if (inviteVideoChatUserModel) {
                console.log(inviteVideoChatUserModel.userName + ' videoChatCancel ' + otherUserModel.userName);
            }
        }
    });
    //
    socket.on("videoChatAgree", function (videoChatModelJson, callback) {
        var videoChatModel = JSON.parse(videoChatModelJson);
        var inviteVideoChatUserModel = videoChatModel.inviteVideoChatUserModel;
        var otherUserModel = videoChatModel.otherUserModel;
        if (inviteVideoChatUserModel) {
            var socketId = inviteVideoChatUserModel.socketId;
            //通知对方客户端
            socket.to(socketId).emit('videoChatAgree', videoChatModelJson);
            if (otherUserModel) {
                console.log(otherUserModel.userName + ' videoChatAgree ' + inviteVideoChatUserModel.userName);
            }
        }
    });
    socket.on("videoChatReject", function (videoChatModelJson, callback) {
        var videoChatModel = JSON.parse(videoChatModelJson);
        var inviteVideoChatUserModel = videoChatModel.inviteVideoChatUserModel;
        var otherUserModel = videoChatModel.otherUserModel;
        if (inviteVideoChatUserModel) {
            var socketId = inviteVideoChatUserModel.socketId;
            //通知对方客户端
            socket.to(socketId).emit('videoChatReject', videoChatModelJson);
            if (otherUserModel) {
                console.log(otherUserModel.userName + ' videoChatReject ' + inviteVideoChatUserModel.userName);
            }
        }
    });
    //===============  videoChatSdpInfoModelJson ================
    //1v1
    socket.on('offer', function (videoChatSdpInfoModelJson) {
        var videoChatSdpInfoModel = JSON.parse(videoChatSdpInfoModelJson);
        var fromUserModel = videoChatSdpInfoModel.fromUserModel;
        var toUserModel = videoChatSdpInfoModel.toUserModel;
        var socketId = toUserModel.socketId;
        //通知对方客户端
        socket.to(socketId).emit('offer', videoChatSdpInfoModelJson);
        console.log(fromUserModel.userName + ' offer ' + toUserModel.userName);
    });
    //1v1
    socket.on('answer', function (videoChatSdpInfoModelJson) {
        var videoChatSdpInfoModel = JSON.parse(videoChatSdpInfoModelJson);
        var fromUserModel = videoChatSdpInfoModel.fromUserModel;
        var toUserModel = videoChatSdpInfoModel.toUserModel;
        var socketId = toUserModel.socketId;
        //通知对方客户端
        socket.to(socketId).emit('answer', videoChatSdpInfoModelJson);
        console.log(fromUserModel.userName + ' answer ' + toUserModel.userName);
    });
    //===============  videoChatInfoModelJson ================
    //1v1
    socket.on('candidate', function (videoChatInfoModelJson) {
            var videoChatInfoModel = JSON.parse(videoChatInfoModelJson);
            var fromUserModel = videoChatInfoModel.fromUserModel;
            var toUserModel = videoChatInfoModel.toUserModel;
            var socketId = toUserModel.socketId;
            //通知对方客户端
            socket.to(socketId).emit('candidate', videoChatInfoModelJson);
            console.log(fromUserModel.userName + ' candidate ' + toUserModel.userName + ' ' + videoChatInfoModel.sdp);
        }
    );
    //===============   chatInfoModelJson ================
    socket.on('userChat', function (chatInfoModelJson) {
        var chatInfoModel = JSON.parse(chatInfoModelJson);
        var fromUserModel = chatInfoModel.fromUserModel;
        var toUserModel = chatInfoModel.toUserModel;
        var chatInfo = chatInfoModel.chatInfo;
        if (toUserModel) {
            var socketId = toUserModel.socketId;
            //通知对方客户端
            socket.to(socketId).emit('userChat', chatInfoModelJson);
            if (fromUserModel) {
                console.log(fromUserModel.userName + ' userChat userName ' + toUserModel.userName + ' ' + chatInfo);
            }
        }
    });
    //===================
    //===================
    //主动登录
    socket.on('userLogin', function (userJson, callback) {
        console.log(socket.id + ' userLogin');
        if (callback) {
            //返回socketId
            callback(socket.id);
        }
        //赋值
        var socketBean = JSON.parse(userJson);
        socketBean.socketId = socket.id;
        userJson = JSON.stringify(socketBean);
        userMap[socket.id] = userJson;
        socket.broadcast.emit('userLogin', userJson);
        io.emit('userChange', userMap);
        console.log('-- userChange userLogin userMap json ' + JSON.stringify(userMap) + ' --');
    });
    //主动退出登录
    socket.on('userLogout', function (userJson) {
        console.log(socket.id + ' userLogout');
        delete userMap[socket.id];
        socket.broadcast.emit('userLogout', userJson);
        io.emit('userChange', userMap);
        console.log('-- userChange userLogout userMap json ' + JSON.stringify(userMap) + ' --');
    });
    //===========================================
    socket.on('disconnect', function () {
        console.log(socket.id + ' disconnect');
        //移除断线客户端的用户信息 处理部分设备未正常退出的情况
        delete userMap[socket.id];
        io.emit('userChange', userMap);
        console.log('-- userChange disconnect json ' + JSON.stringify(userMap) + ' --');

    });
    socket.on('message', function (options) {
        io.emit('message', options);
    });
});
//不指定 hostname  req.connection.remoteAddress 获取到 ::ffff:192.168.0.111
/*http.listen(port, function () {
   console.log('listening on ' + port);
});*/
//指定 hostname  req.connection.remoteAddress 获取到 192.168.0.111
http.listen(port, '0.0.0.0', function () {
    console.log('listening on ' + port);
});
