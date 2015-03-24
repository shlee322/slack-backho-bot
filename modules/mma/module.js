var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('mma_data.db');
var bot = null;

exports.init = function(bot_obj) {
    bot = bot_obj;

    db.serialize(function() {
        db.run("CREATE TABLE IF NOT EXISTS mma_data (user_id TEXT PRIMARY KEY NOT NULL, start_date INTEGER, end_date INTEGER)");
    });

    bot.slack.on('message', slack_on_message);
}

function slack_on_message(message) {
    if(message.type != 'message') return;
    
    var channel = bot.slack.getChannelGroupOrDMByID(message.channel);
    if(message.text && message.text.indexOf('!전역일 등록 ') === 0) {
        var split_text = message.text.split(' ');
        if(split_text.length != 4) {
             channel.send("형식: `!전역일 등록 시작일(YYYY-MM-DD) 종료일(YYYY-MM-DD)`");
             return;
        }
        var start_date = Date.parse(split_text[2]);
        var end_date = Date.parse(split_text[3]);

        if(!start_date || !end_date) {
            channel.send("날짜 형식이 잘못되었습니다.");
            return;
        }

        if(end_date <= start_date) {
            channel.send("전역일은 복무시작일보다 먼저일 수 없습니다");
            return;
        }

        db.serialize(function() {
            db.run("INSERT OR REPLACE INTO mma_data VALUES ('" + message.user + "', " + start_date + ", " + end_date + ");");
            channel.send("전역일이 " + new Date(end_date).toISOString().slice(0,10) + "으로 설정되었습니다");
        });
        
        return;
    }

    if(message.text && (message.text == "!전역일" || message.text == "!전역일 전체")) {
        var query = "SELECT * FROM mma_data";
        if(message.text == "!전역일") {
            query += " WHERE user_id='" + message.user + "'";
        }

        db.all(query, function(err, rows) {
            if(rows.length < 1) {
                channel.send("전역일이 등록되어 있지 않습니다. `!전역일 등록 시작일(YYYY-MM-DD) 종료일(YYYY-MM-DD)`");
                return;
            }

            var channel_message = "";

            for(var rows_i=0; rows_i<rows.length; rows_i++) {
                var message = "";

                var p = (new Date().getTime() - rows[rows_i].start_date) * 1.0 / (rows[rows_i].end_date - rows[rows_i].start_date); // 현재까지 지난 날 / 복무기간
                if(p < 0) p = 0.0;
                p = p * 100;

                var check = false;
                for(var i=0; i<=100; i=i+5) {
                    if(p > i) {
                        message += "=";
                    } else if (p < i && check) {
                        message += "-";
                    } else {
                        message += ">";
                        check = true;
                    }
                }

                message = "[" + message + "] " + p.toString().substring(0, 5) + "%";

                if(p >= 100) {
                    p = 100;
                    message = "전역을 축하합니다!";
                }

                channel_message += "*" + bot.slack.getUserByID(rows[rows_i].user_id).name  + "* " + new Date(rows[rows_i].end_date).toISOString().slice(0,10) + "    " + message + "\n";
            }

            channel.send(channel_message);
        });
        return;
    }
}
