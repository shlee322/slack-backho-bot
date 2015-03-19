var SshClient = require('ssh2').Client;
var exec = require('child_process').exec;
var fs = require('fs');

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