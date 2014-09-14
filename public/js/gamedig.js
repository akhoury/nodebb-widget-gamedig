$(function() {
    var serversContainer = $('#gamedig-servers-container');

    var addserver = function(e) {
        e.preventDefault();
        var server = {
            host: $('#gamedig-server-host').val(),
            port: $('#gamedig-server-port').val(),
            type: $('#gamedig-server-type').val()
        };
        socket.emit('gamedig.addserver', server, function(){});
        return false;
    };

    var rmserver = function(e) {
        e.preventDefault();
        socket.emit('gamedig.rmserver', {key: $(e.target).parents('.gamedig-server').attr('data-key')}, function(){});
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

    var onserveradd = function(data) {
        console.log('onserveradd', data);

        if (!data || data.error) {
            console.warn(data && data.error);
            return;
        }

        serversContainer.removeClass('hidden').show();

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
        );

        socket.emit('gamedig.serverfetch', {key: data.key});
    };

    var onserverrm = function(data) {
        console.log('onserverrm', data);

        if (data) {
            $('.gamedig-server[data-key="' + data.key+ '"]').remove();

            if (! $('.gamedig-server').length) {
                serversContainer.hide().addClass('hidden');
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

    socket.on('gamedig.serversfetchedall', onserversfetchedall);
    socket.on('gamedig.serverfetched', onserverfetched);
    socket.on('gamedig.serveradd', onserveradd);
    socket.on('gamedig.serverrm', onserverrm);

}());