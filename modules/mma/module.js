var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('mma_data.db');
var bot = null;

exports.init = function(bot_obj) {
    bot = bot_obj;

    db.serialize(function() {
        db.run("CREATE TABLE IF NOT EXISTS mma_data (user_id TEXT PRIMARY KEY NOT NULL, date INTEGER)");
    });

    bot.slack.on('message', slack_on_message);
}

function slack_on_message(message) {
    if(message.type != 'message') return;
    
    var channel = bot.slack.getChannelGroupOrDMByID(message.channel);
    if(message.text && message.text.indexOf('!전역일 등록 ') === 0) {
        var split_text = message.text.split(' ');
        if(split_text.length != 3) {
             channel.send("형식: `!전역일 등록 YYYY-MM-DD`");
             return;
        }
        var d = Date.parse(split_text[2]);
        if(!d) {
            channel.send("날짜 형식이 잘못되었습니다. `!전역일 등록 YYYY-MM-DD`");
            return;
        }

        db.serialize(function() {
            db.run("INSERT OR REPLACE INTO mma_data VALUES ('" + message.user + "', " + d + ");");
            channel.send("전역일이 " + new Date(d).toISOString().slice(0,10) + "으로 설정되었습니다");
        });
        
        return;
    }

    if(message.text && message.text == "!전역일") {
        //TODO : 동시에 여러명 보는 것도
        db.all("SELECT * FROM mma_data WHERE user='" + message.user + "';", function(err, rows) {
            if(rows.length < 1) {
                channel.send("전역일이 등록되어 있지 않습니다. `!전역일 등록 YYYY-MM-DD`");
                return;
            }

            var date = new Date(rows[0].date);
            channel.send("전역일 : " + date.toISOString().slice(0,10) + "\n" + "===>------------------------[10%]");
        });
        return;
    }
}
