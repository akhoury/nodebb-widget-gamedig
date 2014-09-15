$(function() {
    var apiHost = '/api/admin/widgets/gamedig';
    
    var addserver = function(e) {
        e.preventDefault();
        var $host = $('#gamedig-server-host');
        var $port = $('#gamedig-server-port');
        var $type = $('#gamedig-server-type');

        var server = {
            host: $host.val(),
            port: $port.val(),
            type: $type.val()
        };

        if (!server.host || !server.port || !server.type) {
            return app.alertError('All fields are required');
        }

        $.ajax({
            type: 'post',
            data: {
                _csrf: $('#csrf_token').val(),
                server: server
            },
            url: apiHost + '/addserver',
            cache: false
        }).done(function() {

            $host.val('');
            $port.val('');
            $type.val('');
        });

        return false;
    };

    var rmserver = function(e) {
        e.preventDefault();
        $.ajax({
            type: 'post',
            data: {
                _csrf: $('#csrf_token').val(),
                server: {
                    key: $(e.target).parents('.gamedig-server').attr('data-key')
                }
            },
            url: apiHost + '/rmserver',
            cache: false
        });
        return false;
    };
    
    var fetchallservers = function(e) {
        if (e && e.preventDefault)
            e.preventDefault();

        var dfd = $.ajax({
            type: 'get',
            url: apiHost + '/fetchallservers',
            cache: false
        });

        if (e) {
            return false;
        } else {
            return dfd;
        }
    };
    
    var fetchserver = function(e) {
        if (e && e.preventDefault)
            e.preventDefault();

        var key;
        if (e.target) {
            key = $(e.target).parents('.gamedig-server').attr('data-key');
        } else {
            key = e;
        }

        $.ajax({
            type: 'get',
            url: apiHost + '/fetchserver?key=' + key,
            cache: false
        });
        return false;
    };


    var onserverfetched = function(data) {
        if (!data || data.error) {
            console.warn(data && data.error);
            return;
        }

        var serverEl = $('.gamedig-servers').find('.gamedig-server[data-key="' + data.key + '"]');
        serverEl.find('.gamedig-server-map').text(data.map);
        serverEl.find('.gamedig-server-players_maxplayers').text( data.players.length + '/' + data.maxplayers);
    };

    var onserveradded = function(data) {

        if (!data || data.error) {
            console.warn(data && data.error);
            return;
        }

        $('.gamedig-servers-container').removeClass('hidden').show();

        $('.gamedig-servers').append(
            $('<tr />')
                .addClass('gamedig-server')
                .attr({
                    'data-key': data.key
                })
                .append('<td class="gamedig-server-type">' + data.type + '</td>')
                .append('<td class="gamedig-server-host_port">' + data.host + ':' + data.port + '</td>')
                .append('<td class="gamedig-server-map">' + (data.map || 'loading...') + '</td>')
                .append('<td class="gamedig-server-players_maxplayers">' + (data.maxplayers && Array.isArray(data.players) ? data.players.length + '/' + data.maxplayers : 'loading ...')+ '</td>')
                .append('<td class="gamedig-server-actions"><i class="fa fa-refresh gamedig-refresh-btn"></i>' + (app.isAdmin ? '&nbsp;<i class="fa fa-times gamedig-rm-btn"></i>' : '' ) + '</td>')
        );

        bind();
        fetchserver(data.key);
    };

    var onserverrmed = function(data) {
        if (data) {
            $('.gamedig-server[data-key="' + data.key+ '"]').remove();

            if (! $('.gamedig-server').length) {
                $('.gamedig-servers-container').hide().addClass('hidden');
            }
        }
    };

    var onserversfetchedall = function(servers) {
        if (servers) {
            $.each(servers, function(key, server) {
                onserverfetched(server);
            });
        }
        bind();
    };

    var $body = $('body');
    $body.on('click', '.gamedig-add-btn', addserver);

    socket.on('gamedig.serversfetchedall', onserversfetchedall);
    socket.on('gamedig.serverfetched', onserverfetched);
    socket.on('gamedig.serveradded', onserveradded);
    socket.on('gamedig.serverrmed', onserverrmed);

    var bind = function() {
        var serversContainer = $('.gamedig-servers-container');
        serversContainer.on('click', '.gamedig-rm-btn', rmserver);
        serversContainer.on('click', '.gamedig-refresh-btn', fetchserver);
        serversContainer.on('click', '.gamedig-refresh-all-btn', fetchallservers);
    };

    bind();
    fetchallservers();
}());
