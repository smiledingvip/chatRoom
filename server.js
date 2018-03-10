var connect      = require('connect'),
	express      = require('express'),
	app          = express(),
	http         = require('http').Server(app),
	users        = [],
	arrAllSocket = {},
	io           = require('socket.io').listen(http),
	bodyParser   = require('body-parser'),
	cookie       = require('cookie'),
	cookieParser = require('cookie-parser'),
	session      = require('express-session'),
	MemoryStore  = session.MemoryStore,
	sessionStore = new MemoryStore();

const COOKIE_SECRET = 'secret',
		COOKIE_KEY  = 'express.sid';
		
app.use(bodyParser.json());
app.use(bodyParser());
app.use(cookieParser());
app.use(express.static(__dirname + '/app'));
app.use(session({
    store: sessionStore,
    secret: 'secret', 
    key: 'express.sid'
}));

io.use(function(socket, next) {
	var data = socket.handshake || socket.request;
	if (data.headers.cookie) {
		data.cookie = cookie.parse(data.headers.cookie);
		data.sessionID = cookieParser.signedCookie(data.cookie[COOKIE_KEY], COOKIE_SECRET);
		data.sessionStore = sessionStore;
		sessionStore.get(data.sessionID, function (err, session) {
			if (err || !session) {
				return next(new Error('session not found'))
			} else {
				data.session = session;
				data.session.id = data.sessionID;
				next();
			}
		});
	} else {
		return next(new Error('Missing cookie headers'));
	}
});


//进入登录页面
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});
//跳转聊天页面
app.post('/doLogin', function (req, res) {
	req.session.name = req.body.nickname;
	if(users.indexOf(req.session.name) == -1 && req.session.name.trim().length != 0){

		res.sendFile(__dirname + '/app/chatroom.html');
	}else if(req.session.name.trim().length == 0){
		//显示不得为空信息
		console.log('不得为空');
	}else{
		//显示重名信息
		console.log('该昵称已存在');

	}
});

//建立连接，监听事件
io.sockets.on('connection', function (socket) {
	var session = socket.handshake.session;
	if (session && users.indexOf(session.name) == -1) {
		users.push(session.name);
		arrAllSocket[session.name] = socket;
		arrAllSocket[session.name].emit('user change',session.name,users,'in');
		arrAllSocket[session.name].broadcast.emit('user change',session.name);
		io.emit('system',session.name,'in');
	}
	socket.on('public chat', function(msg){
		arrAllSocket[session.name].emit('chatMsg',msg,session.name,'right','public','大家');
		arrAllSocket[session.name].broadcast.emit('chatMsg',msg,session.name,'left','public');
	});
	socket.on('private chat',function(msg,to){
		arrAllSocket[session.name].emit('chatMsg', msg,session.name,'right','private',to);
		arrAllSocket[to].emit('chatMsg', msg,session.name,'left','private');
	});
	socket.on('disconnect', function(){
		console.log(session.name+'离开了聊天室');
		users.remove(session.name);
		delete arrAllSocket[session.name];
		io.emit('user change',session.name,users,'out');
		io.emit('system',session.name,'out');
	});
});


http.listen(3000, function () {
	console.log('Server is started: http://127.0.0.1: 3000');
});

Array.prototype.indexOf = function (val) {
    for(var i = 0; i < this.length; i++){
        if(this[i] == val){return i;}
    }
    return -1;
}
Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if(index > -1){this.splice(index,1);}
}
String.prototype.trim=function(){
  return this.replace(/(^\s*)|(\s*$)/g, '');
}
