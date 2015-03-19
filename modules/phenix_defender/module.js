var SshClient = require('ssh2').Client;
var exec = require('child_process').exec;
var fs = require('fs');
var Log = require('log');
var logger = new Log(process.env.BACKHO_BOT_LOG_LEVEL || 'info');

var colorReg = /\[[0-9;]+m/g;

var telnet_object = {
}

var bot = null;
var typeInfo = null;
var messageHeader = null;
var defaultTypeName = null;

exports.init = function(bot_obj) {
    bot = bot_obj;
	typeInfo = {
		'message_deleted': '-삭제-',
		'message_changed': '-수정-'
	};
	messageHeader = "[주작질경보]";
	defaultTypeName = "-기타-";

    bot.slack.on('message', slack_on_message);
}

function slack_on_message(message) {
    if(message.type != 'message') return;
	if(!("subtype" in message && message.subtype in typeInfo)) return;
	
	var subType = message.subtype;
	
	if ("message" in message){
		var internalMessage = message.message;
		var editedInfo = internalMessage.edited;
		var editedUserId = editedInfo.user;
		var userInfo = bot.slack.getUserByID(editedUserId);
		var userName = userInfo["name"];
	} else {
		var userName = "확인불가";
	}
	var typeName = defaultTypeName;
	if (subType in typeInfo){
		typeName = typeInfo[subType];
	}
	
	var returnMessage = messageHeader + typeName + " From : " + userName;
	
	bot.slack.getChannelGroupOrDMByID(message.channel).send(returnMessage);
}

function start_telnet(message) {
    exec(__dirname + "/checkuser.sh " + message.user.toLowerCase() + " " + bot.config.telnet.authorized_key_file, function(error, stdout, stderr) {
        if(error) {
            bot.slack.getChannelGroupOrDMByID(message.channel).send('계정 체크 실패!');
            return;
        }

        open_telnet(message);
    });
}

function stop_telnet(message) {
    var userId = message.channel + "@" + message.user;

    if(telnet_object[userId].stream) {
        telnet_object[userId].client.end();
    } else {
        delete telnet_object[userId];
        bot.slack.getChannelGroupOrDMByID(message.channel).send('터미널 서비스 종료');
    }
}

function input_cmd(message) {
    var userId = message.channel + "@" + message.user;

    telnet_object[userId].stream.write(message.text.substring(1) + '\n');
}

function open_telnet(message) {
    var userId = message.channel + "@" + message.user;
    var channel = bot.slack.getChannelGroupOrDMByID(message.channel);
    var user = bot.slack.getUserByID(message.user);

    channel.send('Open ' + message.user.toLowerCase() + '@noanswer ...');

    var client = new SshClient();
    telnet_object[userId] = {
        client:client,
        channel:channel,
        buffer:"",
        lastSend: 0,
    };

    function send_telnet_data() {
        if(!telnet_object[userId]) return;
        var buf = telnet_object[userId].buffer;
        telnet_object[userId].buffer = "";

        if(buf == "") return;
        buf = buf.replace(colorReg, '');
        telnet_object[userId].channel.send('*' + user.name + '*\n```\n'+buf+'\n```');
    }

    client.on('ready', function() {
        client.shell(function(err, stream) {
            stream.setEncoding('utf8');

            stream.on('close', function() {
                client.end();
                delete telnet_object[userId];
                channel.send('터미널 서비스 종료');
            });

            stream.on('data', function(chunk) {
                telnet_object[userId].buffer += chunk;
                setTimeout(send_telnet_data, 300);
            });

            stream.stderr.on('data', function(data) {
                telnet_object[userId].buffer += chunk;
                setTimeout(send_telnet_data, 300);
            });

            telnet_object[userId].stream = stream;
        });
    });

    client.connect({
        host: '127.0.0.1',
        port: 22,
        username: message.user.toLowerCase(),
        privateKey: require('fs').readFileSync(bot.config.telnet.key_file)
    });
}
