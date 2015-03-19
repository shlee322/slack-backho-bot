var fs = require("fs");
var path = require('path');
var Log = require('log');
var Slack = require('slack-client');
var config = require('./config.json');
var package = require('./package.json');
var slack = new Slack(config.token, config.autoReconnect, config.autoMark);
var logger = new Log(process.env.BACKHO_BOT_LOG_LEVEL || 'info');

slack.on('open', function() {
    logger.info('Init Backho Bot');

    slack.on('message', function (message) {
        if(message.type != 'message' || !message.text) return;

        if(message.text == "!info") {
            var exec = require('child_process').exec;
            var channel = slack.getChannelGroupOrDMByID(message.channel);

            exec('git rev-parse --verify HEAD', function (error, stdout, stderr) {
                var info_message = 'Backho Bot - v' + package.version;
                if(!error && !stderr) {
                    info_message += "("+stdout.replace('\n','')+")";
                }
                info_message += "\nMIT License - Source <https://github.com/shlee322/slack-backho-bot>";
                channel.send(info_message);
            });
        }        
    });

    var modules_dir = path.join(__dirname, 'modules');
    fs.readdir(modules_dir, function (err, files) {
        if(err) throw err;
        
        for(var i=0; i<files.length; i++) {
            var module_path = path.join(modules_dir, files[i]);
            if(!fs.statSync(module_path).isDirectory()) continue;

            logger.info('Load Module - ' + files[i] + ' (' + module_path + ')');
            require(path.join(module_path, '/module.js')).init({
                slack:slack,
                logger:logger,
                config:config
            });
        }

        logger.info('Backho Bot Run!');
    });
});

slack.on('error', function(error) {
    logger.error(error);
})

slack.login();
