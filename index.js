const server = require('ws').Server;
const s = new server({port:3000});

s.on('connection',function(ws){
    ws.on('message',function(message){
        //console.log(message);
        s.clients.forEach(function(client){
            if (client !== ws) {
                client.send(message);
            }
        });
    });
    ws.on('close',function(){
        console.log('I lost a client');
    });
});