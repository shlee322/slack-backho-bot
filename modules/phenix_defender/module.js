var bot = null;
var typeInfo = null;
var messageHeader = null;

exports.init = function(bot_obj) {
    bot = bot_obj;
    typeInfo = {
        'message_deleted': '-삭제됨-',
        'message_changed': '-수정됨-'
    };
    messageHeader = "[주작질경보]";

    bot.slack.on('message', slack_on_message);
}

function slack_on_message(message) {
    if(message.type != 'message') return;
    if(!("subtype" in message && message.subtype in typeInfo)) return;
    
    var subType = message.subtype;
    
    var userName = "알 수 없음.";
	var editBySystem = (subType == 'message_changed');
    if ("message" in message) {
        var internalMessage = message.message;
        if("edited" in internalMessage) {
            var editedInfo = internalMessage.edited;
            var editedUserId = editedInfo.user;
            var userInfo = bot.slack.getUserByID(editedUserId);
            userName = userInfo["name"];
			editBySystem = false;
        }
    }
    
	if (editBySystem){
		return
	}
    var typeName = typeInfo[subType];
    var returnMessage = messageHeader + " " + typeName + " 주작충 : " + userName;
    
    bot.slack.getChannelGroupOrDMByID(message.channel).send(returnMessage);
}