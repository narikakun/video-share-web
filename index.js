const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

const server = https.createServer({
    cert: fs.readFileSync('/etc/letsencrypt/live/videoshareweb-websocket.nakn.jp/fullchain.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/videoshareweb-websocket.nakn.jp/privkey.pem')
});

const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws,req) {
    console.log(`新しい接続: ${req.connection.remoteAddress}`);
    ws.on('message',function(message){
        wss.clients.forEach(function(client){
            if (client !== ws) {
                client.send(message);
            }
        });
    });
    ws.on('close',function(){
        console.log(`接続切れた: ${req.connection.remoteAddress}`);
    });
});

server.listen(3000);