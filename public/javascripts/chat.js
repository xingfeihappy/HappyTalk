$(document).ready(function(){
    for(var i=1;i<=49;i++){
        $(".emotion-lib").append($("<img src=images/emoji/"+i+".png />"));
    }
  $(window).keydown(function(e){
    if(e.keyCode==116){
      if(!confirm("刷新会清除聊天记录，确定刷新吗？")){
        e.preventDefault();
      }
    }
  });

var socket = io.connect();
var from = $.cookie('user');
var to = "all";

//发送用户上线的信号
socket.emit("online",{user:from});
//处理广播事件
socket.on("online",function(data){
  console.log(JSON.stringify(data.users))
  $("#userList").val(JSON.stringify(data.users));
  if(data.user.user!=from){
    var message = "<div class='online-tip'><i class='icon icon-online'></i> 您的好友，"+data.user.user+" 上线了</div>";
  }else{
      var message = "<div class='welcome-tip'>你好，"+data.user.user+"，欢迎进入幸福聊天室</div>";
  }
  $("#contents").append(message);
  //刷新用户列表
    refreshUsers(data.users);
  //显示正在跟谁说话
    showToSay();

})
socket.on("disconnect",function(){
    var message = "<div class='system-tip'><i class='icon icon-close'></i> 系统服务已关闭</div>";
    $("#contents").append(message);
    $("#list").empty();
});
socket.on("connect",function(){
    var message = "<div class='system-tip'><i class='icon icon-open'></i> 系统服务已开启</div>";
    $("#contents").append(message);
    socket.emit("online",{user:from});
})

socket.on("offline",function(data){
  console.log(data.user)
  if(data.user!=from){
      var message = "<div class='offline-tip'><i class='icon icon-offline'></i> 您的好友，"+data.user+" 下线了</div>";
      $("#contents").append(message);
      //刷新用户列表
      refreshUsers(data.users);
      //显示正在跟谁说话
      if(to == data.user){
        to = 'all';
      }
      showToSay();
  }
})
socket.on("say",function(data){
  if(data.to == 'all'){
    $("#contents").append("<div class='content-tip-to content-tip-all'>"+data.from+" "+now()+"对所有人说：<br/><span class='message'>"+handler(data.msg)+"</span></div>")
  }else{
    $("#contents").append("<div class='content-tip-to content-tip-single'>"+data.from+" "+now()+"对"+data.to+"说：<br/><span class='message'>"+handler(data.msg)+"</span></div>")
  }
})

function handler(str){
   var re = /\[emoji:(\d+)\]/g;
   while(match = re.exec(str)){
       str = str.replace(match[0],"<img class='messgae-img' src='images/emoji/"+match[1]+".png' />")
   }
   return str;
}

function showToSay(){
    $("#from").html(from);
    $("#to").html(to=='all'?'所有人':to);
}
function refreshUsers(users){
   $("#list").empty().append("<li alt='all' title='和所有人聊天' class='list-li' onselectstart='return false'>所有人</li>")
   for(var i in users){
     $("#list").append("<li alt='"+users[i]+"' title='"+users[i]+"聊天' onselectstart='return false'>"+users[i]+"</li>")
   }

   //双击某人的时候
    $("#list li").click(function(){
      if($(this).attr("alt")!=from){
        to = $(this).attr("alt");
        if(to=='all'){
            $(".right-header span").html("所有人")
        }else{
            $(".right-header span").html(to)
        }
        $("#list li").removeClass("list-li");
        $(this).addClass("list-li");
      }
      showToSay();
    })
  }

  //点击发送内容
  $("#say").click(function(){
    var content = $("#right-footer-send-content").html();
    if(content =="") return false;
    if(to == 'all'){
        $("#contents").append("<div class='content-tip-from content-tip-all'>你 "+now()+" 对所有人说：<br/><span class='message'>"+handler(content)+"</span></div>")
    }else{
        $("#contents").append("<div class='content-tip-from content-tip-single'>你 "+now()+" 对"+to+"说：<br/><span class='message'>"+handler(content)+"</span></div>")
    }
    socket.emit("say",{from:from,to:to,msg:content});
      $("#right-footer-send-content").html('').focus();
  })

  $(".icon-shake").click(function(){
      socket.emit("shake",{user:from});
  })
  socket.on("shake",function(data){
      if(data.user != from){
          var message = "<div class='shake-tip'><i class='icon icon-shake-tip'></i> 您的好友，"+data.user+" 发送了一个抖动</div>";
      }else{
          var message = "<div class='shake-tip'><i class='icon icon-shake-tip'></i> 您发送了一个抖动</div>";
      }
      $("#contents").append(message);
      if(!$("#contain").hasClass("shake")){
          $("#contain").addClass("shake");
      }
      setTimeout(function(){
          $("#contain").removeClass("shake");
      },1000)
  })
    function now(){
      var date = new Date();
      var time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes()) + ":" + (date.getSeconds() < 10 ? ('0' + date.getSeconds()) : date.getSeconds());
      return time;
    }
    $(".right-footer").click(function(){
      $(this).css("background","#fff");
      $("#right-footer-send-content").css("border","none");
    })
    $('.icon-emotion').hover(function(){
        $(".emotion-lib").show();
    },function(){
        $(".emotion-lib").hide();
    })
    $('.emotion-lib').hover(function(){
        $(this).show()
    },function(){
        $(this).hide()
    })
    $('.emotion-lib').find("img").click(function(){
        var imgUrl = $(this).attr("src");
        var reg = /.*\/(\d+)\..*/ig;
        var imgId = reg.exec(imgUrl)[1];
        // alert(imgId)  //images/emoji/1.png,1
        var oldcontent = $("#right-footer-send-content").html();
        var newcontent = "[emoji:"+imgId+"]";
        $("#right-footer-send-content").html(oldcontent+newcontent).focus();
        $('.emotion-lib').hdie()

    })
})