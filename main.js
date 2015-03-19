var fs = require("fs");
var path = require('path');
var Log = require('log');
var Slack = require('slack-client');
var config = require('./config.json');
var slack = new Slack(config.token, config.autoReconnect, config.autoMark);
var logger = new Log(process.env.BACKHO_BOT_LOG_LEVEL || 'info');

slack.on('open', function() {
    logger.info('Init Backho Bot');

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

