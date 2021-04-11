var express = require('express');
var socket = require('socket.io');
var serveIndex = require('serve-index');

var app = express();
var port_client = 9080;
var port_server = 9090;

// static hosting
app.use(express.static('../public'))
   .use(serveIndex('../public', { icons: true }))
   .listen(process.env.PORT || port_client);

// websocket
const server = app.listen(port_server, function() {
  console.log('server is running on port 9090');
});

const io = socket(server);
// クライアント側の接続を受け付ける
io.on('connection', socket => {
  console.log(socket.id);
  // クライアントにsockeのIDを渡す
  socket.emit('RECEIVE_CONNECTED', { id: socket.id });
  
  socket.on('SEND_ENTER', function(roomname) {
    socket.join(roomname);
    console.log('SEND_ENTER「受け取り」: id=' + socket.id + ' enter room:' + roomname);
    socket.roomname = roomname;
    socket.broadcast.to(socket.roomname).emit('RECEIVE_CALL', { id: socket.id });
    console.log('SEND_ENTER「送信」: roomname=' + socket.roomname + '  発火関数=RECEIVE_CALL: ' + ' id: ' + socket.id);
  });

  socket.on('SEND_MOUSE_EVENT', function(data) {
    // console.log(data);
    console.log('SEND_MOUSE_EVENT「受け取り」: room name:' + socket.roomname + ', id:' + socket.id);
    io.emit('RECEIVE_MOUSE_EVENT', data);
  });


  socket.on('SEND_LEAVE', function(roomname) {
    console.log('SEND_LEAVE: 「受け取り」' + new Date() +' Peer disconnected. id:' +socket.id +', room:' +socket.roomname);
    if (socket.roomname) {
      socket.broadcast.to(socket.roomname).emit('RECEIVE_LEAVE', { id: socket.id });
      socket.leave(socket.roomname);
    }
  });

  socket.on('SEND_CALL', function() {
    console.log('SEND_CALL「受け取り」: call from:' + socket.id + ', room:' + socket.roomname);
    socket.broadcast.to(socket.roomname).emit('RECEIVE_CALL', { id: socket.id });
  });

  socket.on('SEND_CANDIDATE', function(data) {
    console.log(data)
    // console.log(socket)
    console.log('SEND_CANDIDATE「受け取り」: candidate from:' + socket.id + ', room:' + socket.roomname);
    console.log('SEND_CANDIDATE「受け取り」: candidate target:' + data.target);
    if (data.target) {
      data.ice.id = socket.id;
      socket.to(data.target).emit('RECEIVE_CANDIDATE', data.ice);
    } else {
      console.log('SEND_CANDIDATE「受け取り」: candidate need target id');
    }
  });

  socket.on('SEND_SDP', function(data) {
    console.log('SEND_SDP「受け取り」' + data);
    // console.log(data)
    console.log('SEND_SDP「受け取り」: sdp ' + data.sdp.type + ', from:' + socket.id + ', to:' + data.target);
    data.sdp.id = socket.id;
    if (data.target) {
      socket.to(data.target).emit('RECEIVE_SDP', data.sdp);
    } else {
      socket.broadcast.to(socket.roomname).emit('RECEIVE_SDP', data.sdp);
    }
  });

  socket.on('SEND_FULLSCREEN', function(data) {
    data.id = socket.id;
    console.log('SEND_FULLSCREEN: full screen id: ' + data.id + ', room:' + socket.roomname);
    io.to(socket.roomname).emit('RECEIVE_FULLSCREEN', data);
  });
});

  // socket.emit('イベント名', 送信するデータオブジェクト, function (data) {
  //   dataはクライアントからの返り値
  //   console.log('result: ' + data);
  //   });
  // })