(function(){
	'use strict';

	angular
		.module('shipyard.containers')
		.controller('ExecController', ExecController);

	ExecController.$inject = ['$http', '$stateParams', 'ContainerService'];
	function ExecController($http, $stateParams, ContainerService) {
            var vm = this;
            vm.id = $stateParams.id;
            vm.addr = "";
            vm.command = "bash";
            vm.connect = connect;
            vm.disconnect = disconnect;
            vm.debugging = debugging;

            // handling multiple consoles
            var containers = vm.id.split(",");
            vm.containers = containers;
            var term_array = [];
            var websocket_array = [];

            for(var i=0; i<containers.length; i++){
                connect(i);
            }



            function connect(container_index) {
                var termWidth = Math.round((($(window).width() - 20) / 6.838));
                var termHeight = Math.round((($(window).height() - 107) / 14.9));
                var cmd = vm.command.replace(" ", ",");

                var url = window.location.href;
                var urlparts = url.split("/");
                var scheme = urlparts[0];
                var wsScheme = "ws";

                if (scheme === "https:") {
                    wsScheme = "wss";
                }

                // we make a request for a console session token; this is used
                // as authentication to make sure the user has console access
                // for this exec session


                $http
                    .get('/api/consolesession/' + containers[container_index])
                    .success(function(data, status, headers, config) {

                        vm.token = data.token;
                        vm.addr = wsScheme + "://" + window.location.hostname + ":" + window.location.port + "/exec?id=" + containers[container_index] + "&cmd=" + cmd + "&h=" + termHeight + "&w=" + termWidth + "&token=" + vm.token;

                        console.log("vm.addr");
                        console.log(vm.addr);

                        var term;
                        if (term != null) {
                            term.destroy();
                        }

                        var websocket = new WebSocket(vm.addr);

                        websocket.onopen = function(evt) {
                            term = new Terminal({
                                cols: termWidth,
                                rows: termHeight,
                                screenKeys: true,
                                useStyle: true,
                                cursorBlink: true
                            });
                            term.on('data', function(data) {
                                websocket.send(data);
                            });
                            term.on('title', function(title) {
                                document.title = title;
                            });
                            term.open(document.getElementById('container-terminal-'+container_index));
                            websocket.onmessage = function(evt) {
                                term.write(evt.data);
                            }
                            websocket.onclose = function(evt) {
                                term.write("Session terminated");
                                term.destroy();
                            }
                            websocket.onerror = function(evt) {
                                if (typeof console.log == "function") {
                                    //console.log(evt)
                                }
                            }

                            console.log("term");
                            console.log(term);
                            term_array.push(term);
                        }
                        console.log("websocket");
                        console.log(websocket);
                        websocket_array.push(websocket);
                    })
                    .error(function(data, status, headers, config) {
                        vm.error = data;
                    });




            }

            function activeTab(num){
                var tab_element = document.getElementById('tab-' + num);
                clearActiveTabs();
                tab_element.className += " active";
                document.getElementById('content-' + num).className = 'ui bottom attached tab segment active';
            }
            vm.activeTab = activeTab;

            function clearActiveTabs(){
                var items_array = document.getElementsByClassName('item');
                for(var i=0; i<items_array.length; i++){
                    items_array[i].className = 'item';
                }
                var tabs_array = document.getElementsByClassName('ui bottom attached tab segment active');
                for(var i=0; i<tabs_array.length; i++){
                    tabs_array[i].className = 'ui bottom attached tab segment';
                }
            }

            function disconnect() {
                for(var i=0; i < websocket_array.length; i++){
                    if (websocket_array[i] != null) {
                        websocket_array[i].close();
                    }
                    if (term_array[i] != null) {
                        term_array[i].destroy();
                    }
                }
            }

            function debugging() {
                console.log("term_array");
                console.log(term_array);
                console.log(term_array.length);
                for(var i=0; i < term_array.length; i++){
                    console.log(term_array[i]);
                }

                console.log("websocket_array");
                console.log(websocket_array);
                console.log(websocket_array.length);
                for(var i=0; i < websocket_array.length; i++){
                    console.log(websocket_array[i]);
                }

                console.log("containers");
                console.log(containers);
                console.log(containers.length);
                for(var i=0; i < containers.length; i++){
                    console.log(containers[i]);
                }
            }
	}
})();
