(function(module) {
    "use strict";

    var async = require('async'),
        gamedig = require('gamedig'),
        fs = require('fs'),
        path = require('path'),
        meta = module.parent.require('./meta'),
        sockets = module.parent.require('./socket.io'),
        templates = module.parent.require('../public/src/templates'),
        noop = function(){};

    var Widget = {
        templates: {}
    };

    Widget.renderHTMLWidget = function(widget, callback) {
        Widget.settings(function(err, settings) {
            var html = Widget.templates['gamedig.tpl'];
            html = templates.parse(html, settings);
            callback(null, html);
        });
    };

    Widget.settings = function(settings, callback) {
        callback = typeof callback === 'function' ? callback : noop;

        var defaults = {"servers": '{}'};

        if (typeof settings === 'function') {
            callback = settings;
            settings = undefined;
        }
        if (typeof callback !== 'function') {
            callback = function(){};
        }
        if (settings) {
            try {
                settings.servers = JSON.stringify(settings.servers);
            } catch (e) {
                settings.servers = defaults.servers;
            }
            meta.settings.set('gamedig', settings, callback);
        } else {
            meta.settings.get('gamedig', function(err, settings) {
                if (err) {
                    return callback(err);
                }

                if (!settings) {
                    settings = {};
                }

                if (!settings.servers) {
                    settings.servers =  defaults.servers;
                }

                try {
                    settings.servers = JSON.parse(settings.servers);
                } catch (e) {
                    settings = {servers: {}};
                }

                Widget._settings = settings;

                callback(null, settings);
            });
        }
    };

    Widget.defineWidget = function(widgets, callback) {
        callback = typeof callback === 'function' ? callback : noop;

        widgets.push({
            widget: "gamedig",
            name: "Gamedig",
            description: "NodeBB Gamedig widget",
            content: Widget.templates['admin/gamedig.tpl']
        });

        callback(null, widgets);
    };

    Widget.emit = function() {
        return sockets.server.sockets.emit.apply(sockets.server.sockets, arguments);
    };

    Widget.on = function() {
        console.log(arguments);
        return sockets.server.sockets.on.apply(sockets.server.sockets, arguments);
    };

    var serverKey = function(data) {
        return data.host + ':' + data.port + '/' + data.type;
    };

    Widget.addserver = function(data, callback) {
        console.log('addserver', data);

        callback = typeof callback === 'function' ? callback : noop;
        if (!data.host || !data.port || !data.type) {
            return callback('can\'t add, missing data');
        }

        var server = {
            host: data.host,
            port: data.port,
            type: data.type,
            key: serverKey(data.host, data.port, data.type)
        };

        Widget._settings.servers[server.key] = server;

        Widget.settings(Widget._settings, function() {
            Widget.emit('gamedig.serveradd', server);
            callback(null, server)
        });
    };

    Widget.rmserver = function(data, callback) {
        console.log('rmserver', data);

        callback = typeof callback === 'function' ? callback : noop;

        if (!data.key) {
            return callback('can\'t remove, missing key');
        }

        delete Widget._settings.servers[data.key];

        Widget.settings(Widget._settings, function() {
            Widget.emit('gamedig.serverrm', data);
            callback(null, data);
        });
    };

    Widget.fetch = function(data, callback) {
        console.log('fetch', data);

        callback = typeof callback === 'function' ? callback : noop;

        if (!data.key || (data.host && data.port && data.type)) {
            return callback('can\'t fetch, mising data');
        }
        if (!data.key) {
            data.key = serverKey(data);
        }

        var server = Widget._settings.servers[data.key];
        if (server) {
            gamedig.query({
                type: server.type,
                host: server.host,
                port: server.port
            }, function(state) {
                if (state.error) {
                    return callback(state.error);
                }
                state.key = data.key;
                callback(null, state);
                Widget.emit('gamedig.serverfetched', state);
            });
        } else {
            callback('couldn\'t find server:' + data.key + ', is it added?');
        }
    };

    Widget.fetchall = function(callback) {
        console.log('fetchall');

        callback = typeof callback === 'function' ? callback : noop;
        async.eachLimit(Object.keys(Widget._settings.servers), 3, function(key, next) {
            Widget.fetch(Widget._settings.servers[key], next);
        }, function(err) {
            callback(err);
        });
    };

    Widget.init = function(express, middleware, controllers, callback) {
        var templatesToLoad = ["gamedig.tpl","admin/gamedig.tpl"];

        function loadTemplate(template, next) {
            fs.readFile(path.resolve(__dirname, './public/templates/' + template), function (err, data) {
                if (err) {
                    console.log(err.message);
                    return next(err);
                }
                Widget.templates[template] = data.toString();
                next(null);
            });
        }

        Widget.settings(function() {
            async.each(templatesToLoad, loadTemplate);

            Widget.on('gamedig.serverfetch', Widget.fetch);
            Widget.on('gamedig.serversfetchall', Widget.fetchall);
            Widget.on('gamedig.rmserver', Widget.rmserver);
            Widget.on('gamedig.addserver', Widget.addserver);

            callback();
        });
    };

    module.exports = Widget;
}(module));