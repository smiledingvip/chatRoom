window.onload = function(){
	var hichat = new hiChat();	//页面刷新时生成一个新的hiChat对象
	hichat.init();
}

var hiChat = function(){	//定义hiChat对象
	this.socket = null;
}

hiChat.prototype = {		//原型函数
	init : function(){		//初始化
		var that = this;	//作用域转换
		this.socket = io();	//连接
		this._initialEmoji();
		this.socket.on('system', function(nickname, type){
			var date = new Date().toTimeString().substr(0,8),
			    msg = '【系统信息】'+nickname+(type=='in'?'加入':'退出')+'了房间'+'<span class="timespan">【'+date+'】</span>';
			if($('.systemMsg').val().trim().length==0){
				$('.systemMsg').html(msg);
			}else{
				setTimeout($('.systemMsg').html(msg),5000);
			}
		});
		
		//用户登录或退出
		this.socket.on('user change',function(user,users,string){
			that._userChange(user,users,string);
			
		});

		//发消息
		this.socket.on('chatMsg', function(msg,nickname,lr,type,to){
			that._displayMsg(msg,nickname,lr,type,to);
		});

		var canvas = document.getElementById('tutorial'),
			ctx = canvas.getContext('2d'),
		    right_side_left = $('#right-side').offset().left,
		    right_side_top = $('#right-side').offset().top;
	    canvas.onmousedown = function(e){  
	        /*找到鼠标（画笔）的坐标*/  
	        var start_x = e.clientX - canvas.offsetLeft - right_side_left + document.body.scrollLeft;  
	        var start_y = e.clientY - canvas.offsetTop - right_side_top + document.body.scrollTop;  
	  
	        ctx.beginPath();    //开始本次绘画  
	  
	        ctx.moveTo(start_x, start_y);   //画笔起始点  
	  
	  
	        canvas.onmousemove = function(e){  
	  
	            /*找到鼠标（画笔）的坐标*/  
	            var move_x = e.clientX - canvas.offsetLeft - right_side_left + document.body.scrollLeft;  
	            var move_y = e.clientY - canvas.offsetTop - right_side_top + document.body.scrollTop;  
	              
	            ctx.lineTo(move_x, move_y);     //根据鼠标路径绘画  
	  
	            ctx.stroke();   //立即渲染  
	        }  
	  
	  
	        canvas.onmouseup = function(e){  
	  
	            ctx.closePath();    //结束本次绘画  
	  
	            canvas.onmousemove = null;  
	            canvas.onmouseup = null;  
	        }  
	    }

		//绑定消息发送按钮点击事件
		$('#sendBtn').bind('click', function(){
			
			var msg = $('textarea').val(),
				to = $('select').val();
			if($.trim(msg).length!=0 && to == '大家'){

				that.socket.emit('public chat',msg);
				$('textarea').val('');
			}else if($.trim(msg).length!=0 && to != '大家'){
				
				that.socket.emit('private chat', msg,to);
				$('textarea').val('');

			}else if($.trim(msg).length ==0){
				$('textarea').focus();
			}
		});

		//表情按钮绑定点击事件
		$('#emoji').bind('click',function(e){
			$('#emojiWrapper').toggle();
			e.stopPropagation();
		});

		//任意点击隐藏表情面板
		$('body').bind('click',function(){
			$('#emojiWrapper').hide();
		});

		//表情选择
		$('#emojiWrapper img').click(function(){
			var emojiTitle =$(this).attr("title");
			$('textarea').val($('textarea').val() + '[emoji:' + emojiTitle + ']');
		});

		//画板按钮绑定点击事件
		$('#draw').bind('click',function(e){
			$('#tutorial').toggle();
			e.stopPropagation();
		});

		$('#canvas_ok').click(function(){
			var data = canvas.toDataURL(),
				to = $('select').val(),
				imgData = '<img src="'+data+'"/>';
			if(to == '大家'){
				that.socket.emit('public chat',imgData);
				//画板重置
				$('#tutorial').hide();
				ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
			}else {
				that.socket.emit('private chat', imgData,to);
				//画板重置
				$('#tutorial').hide();
				ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
			}
		})
		

		
	},
	_displayMsg : function(msg,nickname,lr,type,to){
		var container = document.getElementById('msgOutput'),
			date = new Date().toTimeString().substr(0,8),
			msgtype ='',
			type='',
			target ='';
		if(type=='private'){
			msgtype = '【私信】';
			target = '对你';
		};
		msg = this._showEmoji(msg);
		if(msg.substring(5,6)=='s'){
			type='canvas';
		}else{
			type='msg';
		}
		if(lr == 'right'){
			var html = '<div class="content">'+
							'<div class="content_'+lr+'">'+
								'<img src="/content/头像.gif" class="avater"/>'+
								'<div class="plain">'+
									'<div class="name">你对'+to+msgtype+'说【'+date+'】</div>'+
									'<div class='+type+'>'+msg+'</div>'+
									'<div style="clear:both;"></div>'+
								'</div>'+
							'</div>'+
							'<div style="clear:both;"></div>'+
						'</div>';
		}else if(lr =='left'){
			var html = '<div class="content">'+
							'<div class="content_'+lr+'">'+
								'<img src="/content/头像.gif" class="avater"/>'+
								'<div class="plain">'+
									'<div class="name">'+nickname+target+msgtype+'说【'+date+'】</div>'+
									'<div class='+type+'>'+msg+'</div>'+
									'<div style="clear:both;"></div>'+
								'</div>'+
							'</div>'+
							'<div style="clear:both;"></div>'+
						'</div>';
		}
		
		container.innerHTML+=html;
		container.scrollTop = container.scrollHeight;
	},
	// _displayCanvas: function(user, imgData, color) {
	//     var container = document.getElementById('historyMsg'),
	//         msgToDisplay = document.createElement('p'),
	//         date = new Date().toTimeString().substr(0, 8);
	//     msgToDisplay.style.color = color || '#000';
	//     msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
	//     container.appendChild(msgToDisplay);
	//     container.scrollTop = container.scrollHeight;
	// }
	_initialEmoji: function() {
	    var emojiContainer = document.getElementById('emojiWrapper'),
	        docFragment = document.createDocumentFragment();
	    for (var i = 1; i <=39; i++) {
	        var emojiItem = document.createElement('img');
	        emojiItem.src = '/content/emoji/' + i + '.png';
	        emojiItem.title = i;
	        docFragment.appendChild(emojiItem);
	    };
	    emojiContainer.appendChild(docFragment);
	},
	_showEmoji : function(msg){
		var match, result=msg,
		reg = /\[emoji:\d+\]/g,
		emojiIndex,
		totalEmojiNum = $('#emojiWrapper img').length;

		while (match = reg.exec(msg)) {
	        emojiIndex = match[0].slice(7, -1);
	        if (emojiIndex > totalEmojiNum) {
	            result = result.replace(match[0], '[X]');
	        } else {
	            result = result.replace(match[0], '<img class="emoji" src="/content/emoji/' + emojiIndex + '.png" />');
	        };
	    };
	    return(result);
	},
	_userChange : function(user,users,string){
		var container =document.getElementById('user-list');
		if(users && string =='in'){
				$('.banner').html('<img src="/content/头像.gif" style="padding:0 10px 0 0;"><span>'+user+'</span>');
				// var i=0;
				for(var i=0;i<users.length;i++){
					if(users[i]==user){
						continue;
					}
					$('#user-list').append($('<li class="user" name="'+users[i]+'">').html('<img src="/content/头像.gif" style="padding:0 10px 0 0;">'+users[i]));
					$('select').append($('<option value="'+users[i]+'">').html(users[i]));
				}
			}else if(users && string =='out'){
				$('#user-list li[name='+user+']').remove();
				$('option[value='+user+']').remove();
			}else{
				$('#user-list').append($('<li class="user" name="'+user+'">').html('<img src="/content/头像.gif" style="padding:0 10px 0 0;">'+user));
				$('select').append($('<option value="'+user+'">').html(user));
			}

			
		$('li').hover(function(){
			$(this).css('background-color','#f5f5f5');
		},function(){
			$(this).css('background-color','#ffffff');
		});
		
		$('.user').click(function(){
			var value = $(this).attr('name');
			$(this).css('background-color','#f5f5f5');
			$('select').val(value);
		});

		container.scrollTop = container.scrollHeight;
	}
}