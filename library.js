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

    var toArray = function(obj) {
        if (Array.isArray(obj)) {
            return obj;
        }
        if (!obj) {
            return [];
        }
        var arr =[];
        for(var k in obj ) {
            if (obj.hasOwnProperty(k)){
                arr.push(obj[k]);
            }
        }
        return arr;
    };

    Widget.renderWidget = function(widget, callback) {
        Widget.settings(function(err, settings) {
            var html = Widget.templates['gamedig.tpl'];
            html = templates.parse(html, {servers: toArray(settings.servers)});
            callback(null, html);
        });
    };

    Widget.settings = function(settings, callback) {
        callback = typeof callback === 'function' ? callback : noop;

        var defaults = {servers: '{}'};

        if (typeof settings === 'function') {
            callback = settings;
            settings = undefined;
        }
        if (typeof callback !== 'function') {
            callback = function(){};
        }
        if (settings != null) {

            try {
                settings.servers = JSON.stringify(settings.servers);
            } catch (e) {
                settings = defaults.servers;
            }

            meta.settings.set('gamedig', settings, function() {
                Widget.settings(callback);
            });
        } else {
            meta.settings.get('gamedig', function(err, settings) {

                if (err) {
                    return callback(err);
                }

                if (!settings) {
                    settings = {};
                }

                if (!settings.servers) {
                    settings.servers = defaults.servers;
                }
                try {
                    settings.servers = JSON.parse(settings.servers);
                } catch (e) {
                    settings.servers = {};
                }

                Widget._settings = settings;
                callback(null, settings);
            });
        }
    };

    Widget.defineWidget = function(widgets, callback) {
        callback = typeof callback === 'function' ? callback : noop;

        var data = {servers: toArray(Widget._settings.servers)};
        var html = templates.parse(Widget.templates['admin/gamedig.tpl'], data);

        widgets.push({
            widget: "gamedig",
            name: "Gamedig",
            description: "NodeBB Gamedig widget",
            content: html
        });

        callback(null, widgets);
    };

    Widget.emit = function() {
        return sockets.server.sockets.emit.apply(sockets.server.sockets, arguments);
    };

    Widget.on = function() {
        return sockets.server.sockets.on.apply(sockets.server.sockets, arguments);
    };

    var serverKey = function(data) {
        return data.host + ':' + data.port + '/' + data.type;
    };

    var addserver = function(data, callback) {
        callback = typeof callback === 'function' ? callback : noop;
        
        if (!data.host || !data.port || !data.type) {
            return callback('can\'t add, missing data');
        }

        var server = {
            host: data.host,
            port: data.port,
            type: data.type,
            key: serverKey(data)
        };

        Widget._settings.servers[server.key] = server;

        Widget.settings(Widget._settings, function() {
            Widget.emit('gamedig.serveradded', server);
            callback(null, server)
        });
    };

    Widget.addserver = function(req, res, next) {
        addserver(req.body.server, function(err, server) {
            res.json(server);
        });    
    };

    var rmserver = function(data, callback) {
        callback = typeof callback === 'function' ? callback : noop;

        if (!data.key) {
            return callback('can\'t remove, missing key');
        }

        delete Widget._settings.servers[data.key];

        Widget.settings(Widget._settings, function() {
            Widget.emit('gamedig.serverrmed', data);
            callback(null, data);
        });
    };

    Widget.rmserver = function(req, res, next) {
        rmserver(req.body.server, function(err, server) {
            res.json(server);
        });
    };

    var fetchserver = function(key, callback) {
        callback = typeof callback === 'function' ? callback : noop;

        if (!key) {
            return callback('can\'t fetch, mising data');
        }

        if (key.host) {
            key = serverKey(key);
        }

        var server = Widget._settings.servers[key];

        if (server) {
            gamedig.query({
                type: server.type,
                host: server.host,
                port: parseInt(server.port, 10)
            }, function(state) {
                if (state.error) {
                    return callback(state.error);
                }
                state.key = key;
                Widget.emit('gamedig.serverfetched', state);
                callback(null, state);
            });
        } else {
            callback('couldn\'t find server:' + key + ', is it added?');
        }
    };
    
    Widget.fetchserver = function(req, res, next) {
        fetchserver(req.query.key, function(err, state) {
            res.json(state);
        });

    };

    var fetchallservers = function(callback) {
        callback = typeof callback === 'function' ? callback : noop;
        
        var servers = {};
        async.eachLimit(Object.keys(Widget._settings.servers), 3, function(key, next) {
            fetchserver(Widget._settings.servers[key], function(err, server) {
                servers[key] = server;
                next();
            });
        }, function(err) {
			Widget.emit('gamedig.serversfetchedall', servers);
            callback(err, servers);
        });   
    };

    Widget.fetchallservers = function(req, res, next) {
        fetchallservers(function(err, servers) {
            res.json(servers);
        });
    };

    Widget.init = function(app, middleware, controllers, callback) {
        var templatesToLoad = ['gamedig.tpl', 'admin/gamedig.tpl'];

        function loadTemplate(template, next) {
            fs.readFile(path.resolve(__dirname, './public/templates/' + template), function (err, data) {
                if (err) {
                    return next(err);
                }
                Widget.templates[template] = data.toString();
                next(null);
            });
        }

        Widget.settings(function() {
            async.each(templatesToLoad, loadTemplate);
            var prefix = '/api/admin/widgets/gamedig';
            
            app.get(prefix + '/fetchserver', Widget.fetchserver);
            app.get(prefix + '/fetchallservers', Widget.fetchallservers);
            app.post(prefix + '/addserver', middleware.admin.isAdmin, Widget.addserver);
            app.post(prefix + '/rmserver', middleware.admin.isAdmin, Widget.rmserver);

            callback();
        });
    };

    module.exports = Widget;
}(module));
