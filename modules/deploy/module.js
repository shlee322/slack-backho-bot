var request = require('request');
var exec = require('child_process').exec;

var bot = null;
var lastSyncTime = 0;

exports.init = function(bot_obj) {
    bot = bot_obj;

    bot.slack.on('message', slack_on_message);
}

function slack_on_message(message) {
    if(message.type != 'message') return;

    var channel = bot.slack.getChannelGroupOrDMByID(message.channel);
    if(message.text && message.text.indexOf('!deploy') === 0) {
        var time = new Date().getTime();
        if(time-10000 < lastSyncTime) {
            channel.send('Deploy는 너무 자주 사용할 수 없습니다.');
            return;
        }
        lastSyncTime = time;
        exec('git rev-parse --verify HEAD', function (error, oldver, stderr) {
            channel.send('현재 버전: ' + oldver);
            exec('git pull', function (err, stdout, stderr) {
                channel.send('```\n' + stdout + '\n```');
                exec('git rev-parse --verify HEAD', function (error, newver, stderr) {
                    if(newver != oldver) {
                        channel.send('신규 버전: ' + newver);
                        channel.send('서버 갱신을 시작합니다.');
                        setTimeout(function() {
                            process.exit(0);
                        }, 1500);
                    } else {
                        channel.send('가장 최신 버전입니다.');
                        //도배 방지
                        lastSyncTime += 30000;
                    }
                });
            });
        });
    }
}

