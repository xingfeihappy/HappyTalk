var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var swig = require('swig');
var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');
var app = express();

// var webshot = require('webshot')
//     , fs = require('fs');

// var renderStream = webshot('google.com');
// var file = fs.createWriteStream('test.png', {encoding: 'binary'});

// renderStream.on('data', function(data) {
//     console.log("data")
//     file.write(data.toString('binary'), 'binary');
// });

// renderStream.on('end', function() {
//     console.log('OK');
// });

app.set('port',process.env.PORT || 3001);
app.engine('html',swig.renderFile);
app.set('views','./views');
//注册所使用的模板引擎,第一个参数必须是view engine，第二个参数和app.engine这个方法中定义的模板引擎的名称一致
app.set('view engine','html');
swig.setDefaults({cache:false});
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));

app.use(methodOverride());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
//app.use(multer());

app.use(express.static(path.join(__dirname, 'public')));

if('development' ==  app.get('env')){
    app.use(errorHandler());
}
var users = {};//存储在线用户列表
app.get('/',function(req,res){
    console.log("=====121=====")
    console.log(req.cookies)

    if(req.cookies.user == null) {
        res.redirect('/signin');
    }else{
        res.render('index');
    }
});
app.get('/signin', function (req, res) {
    res.render('signin');
});
app.post('/signin', function (req, res) {
    if(req.body.name==""){
        res.send("用户名不能为空")
        return;
    }

    if (users[req.body.name]) {
        res.send("用户名已经存在")
        res.redirect('/signin');
    } else {
        res.cookie("user", req.body.name, {maxAge: 1000*60*60*24*30});
        res.redirect('/');
    }
});

var server = http.createServer(app);
var io = require('socket.io').listen(server);//将socket.io绑定到服务器上，任何连接到该服务器的客户端都具备了实时通信功能
io.sockets.on('connection', function (socket) {
    //服务器监听所有客户端，并返回所有该连接对象，并通过socket这个连接对象跟客户端进行通信
    //有人上线
    socket.on('online', function (data) {
        if(!users[data.user]){
            //添加进users
            users[data.user] = data.user;
            socket.user = data.user
            //向所有人播报有人上线了
            io.sockets.emit('online',{users:users,user:data});
        }

    });

    socket.on("disconnect",function(){
        if(users[socket.user]){
            delete users[socket.user];
            socket.broadcast.emit("offline",{users:users,user:socket.user});
        }

    })

    socket.on("say",function(data){
        console.log("------------"+data.to)
        if(data.to == "all"){
            console.log("all------------"+data.to)
            socket.broadcast.emit('say',data);
        }else{
            console.log("else------------"+data.to)
            var clients = io.sockets.clients();
            clients.forEach(function(client){
                console.log(client.user)
                if(client.user == data.to){
                    console.log("name------------"+data.to)
                    client.emit('say',data);
                }
            })
        }
    })

    socket.on("shake",function(data){
        console.log(data.user)
        io.sockets.emit("shake",{user:data.user})
    })
});

server.listen(app.get('port'), function(){
    console.log('Express server have been started on port ' + app.get('port'));
});
module.exports = app;
