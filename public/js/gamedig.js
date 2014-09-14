$(function() {
    var apiHost = '/api/admin/widgets/gamedig';
    
    var addserver = function(e) {
        e.preventDefault();
        var server = {
            host: $('#gamedig-server-host').val(),
            port: $('#gamedig-server-port').val(),
            type: $('#gamedig-server-type').val()
        };
        $.ajax({
            type: 'post',
            data: {
                _csrf: $('#csrf_token').val(),
                server: server
            },
            url: apiHost + '/addserver',
            cache: false
        });
        return false;
    };

    var rmserver = function(e) {
        debugger;
        
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
        e.preventDefault();
        $.ajax({
            type: 'get',
            url: apiHost + '/fetchallservers',
            cache: false
        });
        return false;
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
        console.log('onserverfetched', data);

        if (!data || data.error) {
            console.warn(data && data.error);
            return;
        }

        var serverEl = $('.gamedig-servers').find('.gamedig-server[data-key="' + data.key + '"]');
        serverEl.find('gamedig-server-map').text(data.map);
        serverEl.find('gamedig-server-players_maxplayers').text( data.players.length + '/' + data.maxplayers);
    };

    var onserveradded = function(data) {
        console.log('onserveradd', data);

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
                .append('<td class="gamedig-server-actions"><i class="fa fa-refresh gamedig-refresh-btn"></i></td>')
        );

        fetchserver(data.key);
    };

    var onserverrmed = function(data) {
        console.log('onserverrm', data);

        if (data) {
            $('.gamedig-server[data-key="' + data.key+ '"]').remove();

            if (! $('.gamedig-server').length) {
                $('.gamedig-servers-container').hide().addClass('hidden');
            }
        }
    };

    var onserversfetchedall = function(data) {
        console.log('onserversfetchedall', data);

        if (data && data.servers) {
            $.each(data.servers, function(key, server) {
                onserverfetched(server);
            });
        }
    };

    var $body = $('body');
    $body.on('click', '.gamedig-add-btn', addserver);
    $body.on('click', '.gamedig-rm-btn', rmserver);
    $body.on('click', '.gamedig-refresh-btn', fetchserver);
    $body.on('click', '.gamedig-refresh-all-btn', fetchallservers);

    socket.on('gamedig.serversfetchedall', onserversfetchedall);
    socket.on('gamedig.serverfetched', onserverfetched);
    socket.on('gamedig.serveradded', onserveradded);
    socket.on('gamedig.serverrmed', onserverrmed);

}());
