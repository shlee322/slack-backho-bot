var request = require('request');

var bot = null;

exports.init = function(bot_obj) {
    bot = bot_obj;

    bot.slack.on('message', slack_on_message);
}

function slack_on_message(message) {
    if(message.type != 'message') return;

    if(message.text && message.text.indexOf('!whois') === 0) {
        var channel = bot.slack.getChannelGroupOrDMByID(message.channel);
        var user = bot.slack.getUserByID(message.user);

        var domains = message.text.split(" ");
        if(domains.length < 2) {
            channel.send("*"+user.name+"*\n사용법: `!whois 도메인1 도메인2...`");
        } else {
            for(var i=1; i<domains.length; i++) {
                // TODO : URL Encoding
                var domain = domains[i];
                var reg_result = domain.match(/<http:\/\/(\S+)\|(\S+)\>/);
                if(reg_result) domain = reg_result[1];
                reg_result = domain.match(/<http:\/\/(\S+)\>/);
                if(reg_result) domain = reg_result[1];

                if(domain.test(/(\S+).kr/)) {
                    request('http://whois.kisa.or.kr/openapi/whois.jsp?query=' + domain + '&key=' + bot.config.whois.api_key + '&answer=json', function (error, response, body) {
                        var message = "";
                        var domain_info = JSON.parse(body).whois.krdomain;
                   
                        if(domain_info.error) {
                            message = domain_info.error.error_msg;
                        } else {
                            message += "도메인 명: " + domain_info.name + "\n";
                            message += "등록인: " + domain_info.regName + "\n";
                            message += "관리자: " + domain_info.adminName + " <" + domain_info.adminEmail + ">\n";
                            message += "기간: " + domain_info.regDate + " ~ " + domain_info.endDate + "\n";
                            message += "네임서버: " + domain_info.ns1;
                        }

                        channel.send("*"+user.name+"*\n" + domain + " Whois 결과\n```\n" + message + "\n```");
                    });
                } else {
                    channel.send("*"+user.name+"*\n" + domain + " Whois 결과\n```kr 도메인만 가능합니다```");
                }
            }
        }
    }
}

