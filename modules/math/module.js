var math = require('mathjs');

exports.init = function(bot_obj) {
    bot = bot_obj;

    bot.slack.on('message', slack_on_message);
}

function slack_on_message(message) {
    if(message.type != 'message') return;

    var channel = bot.slack.getChannelGroupOrDMByID(message.channel);
    if(message.text && message.text.indexOf('!계산 ') === 0) {
        channel.send(math.eval(message.text.substring(4)).toString());
    }
}

