<link rel="stylesheet" href="/plugins/nodebb-widget-gamedig/css/gamedig.css" />

<h4>Servers</h4>

<!-- IF servers.length -->
<div class="table-responsive gamedig-servers-container">
<!-- ELSE -->
<div class="table-responsive gamedig-servers-container hidden">
<!-- ENDIF servers.length -->
    <table class="table">
        <thead>
            <tr>
                <th>Type</th>
                <th>Host:Port</th>
                <th>Map</th>
                <th>Players</th>
                <th>Actions <i class="fa fa-refresh gamedig-refresh-all-btn"></i></th>
            </tr>
        </thead>
        <tbody class="gamedig-servers">
        <!-- BEGIN servers -->
            <tr class="gamedig-server" data-key="{servers.key}">
                <td class="gamedig-server-type">{servers.type}</td>
                <td class="gamedig-server-host_port">{servers.host}:{servers.port}</td>

                <!-- IF servers.map -->
                <td class="gamedig-server-map">{servers.map}</td>
                <!-- ELSE -->
                <td class="gamedig-server-map">loading...</td>
                <!-- ENDIF servers.map -->

                <!-- IF servers.maxplayers -->
                <td class="gamedig-server-players_maxplayers">{servers.players}/{servers.maxplayers}</td>
                <!-- ELSE -->
                <td class="gamedig-server-players_maxplayers">loading...</td>
                <!-- ENDIF servers.maxplayers -->

                <td class="gamedig-server-actions"><i class="fa fa-refresh gamedig-refresh-btn"></i>&nbsp;<i class="fa fa-times gamedig-rm-btn"></i></td>
            </tr>
        <!-- END servers -->
        </tbody>
    </table>
</div>

<div class="form-inline" role="form">
  <div class="form-group">
    <label class="sr-only" for="gamedig-server-host">host</label>
    <input type="text" class="form-control" name="gamedig-server-host" id="gamedig-server-host"  placeholder="host i.e 123.456.789.012" />
  </div>

  <div class="form-group">
    <label class="sr-only" for="gamedig-server-port">port</label>
    <input type="text" class="form-control" name="gamedig-server-port" id="gamedig-server-port" placeholder="port i.e 28960" />
  </div>

  <div class="form-group">
    <label class="sr-only" for="gamedig-server-type">type</label>
    <input type="text" class="form-control" name="gamedig-server-type" id="gamedig-server-type"  placeholder="type i.e codmw2" />
  </div>
</div>

<div class="gamedig-toolbar">
	<button class="gamedig-add-btn btn btn-default">Add Server</button>
</div>


<script src="/plugins/nodebb-widget-gamedig/js/gamedig.js"></script>

