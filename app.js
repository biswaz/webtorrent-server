const util = require('util')
 
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

//Allow all requests from all domains & localhost
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


let lookup = {}

const hostname = '127.0.0.1';
const port = 3000;


var Server = require('bittorrent-tracker').Server

var server = new Server({
  udp: true, // enable udp server? [default=true]
  http: true, // enable http server? [default=true]
  ws: true, // enable websocket server? [default=true]
  stats: true, // enable web-based statistics? [default=true]
  filter: function (infoHash, params, cb) {
    // Blacklist/whitelist function for allowing/disallowing torrents. If this option is
    // omitted, all torrents are allowed. It is possible to interface with a database or
    // external system before deciding to allow/deny, because this function is async.

    // It is possible to block by peer id (whitelisting torrent clients) or by secret
    // key (private trackers). Full access to the original HTTP/UDP request parameters
    // are available in `params`.

    // This example only allows one torrent.
    
    var allowed = (infoHash === 'aaa67059ed6bd08362da625b3ae77f6f4a075aaa')
    if (allowed) {
      // If the callback is passed `null`, the torrent will be allowed.
      cb(null)
    } else {
      // If the callback is passed an `Error` object, the torrent will be disallowed
      // and the error's `message` property will be given as the reason.
    //   cb(new Error('disallowed torrent'))
    //   console.log(util.inspect(params, false, null, true))
      cb(null)
    }
  }
})

// Internal http, udp, and websocket servers exposed as public properties.
server.http
server.udp
server.ws

server.on('error', function (err) {
  // fatal server error!
  console.log(err.message)
})

server.on('warning', function (err) {
  // client sent bad data. probably not a problem, just a buggy client.
  console.log(err.message)
})

server.on('listening', function () {
  // fired when all requested servers are listening
  console.log('listening on http port:' + server.http.address().port)
  console.log('listening on ws port:' + server.ws.address().port)
})

// start tracker server listening! Use 0 to listen on a random free port.
server.listen(port, hostname, 'listening')

// listen for individual tracker messages from peers:

server.on('start', function (addr) {
  console.log('got start message from ' + addr)
  Object.keys(server.torrents).forEach(hash => {
    lookup[server.torrents[hash].infoHash] = server.torrents[hash].peers.length
    
    // console.log(util.inspect(server.torrents[hash].peers, false, null, true))
    console.log("peers: " + server.torrents[hash].peers.length)
  });
//   console.log(Object.keys(server.torrents))
//   console.log("update")
  // Object.keys(server.torrents).forEach(hash => {
  //     console.log("peers: ")
  //     console.log(util.inspect(server.torrents[hash].peers, false, null, true))
  //   console.log("peers: " + server.torrents[hash].peers.length)
  // });
})

server.on('complete', function (addr) {})
server.on('update', function (addr) {
    Object.keys(server.torrents).forEach(hash => {
      console.log(server.torrents[hash].infoHash)
      lookup[server.torrents[hash].infoHash] = server.torrents[hash].peers.length

      // console.log(util.inspect(server.torrents[hash].peers, false, null, true))
      console.log("peers: " + server.torrents[hash].peers.length)
    });
})
server.on('stop', function (addr) {})

// get info hashes for all torrents in the tracker server
// console.log("Torrent info: " + Object.keys(server.torrents))



// // get the number of seeders for a particular torrent
// server.torrents[infoHash].complete

// // get the number of leechers for a particular torrent
// server.torrents[infoHash].incomplete

// // get the peers who are in a particular torrent swarm
// server.torrents[infoHash].peers


app.get('/peers', function(req, res) {
  res.send(lookup);
});

app.listen(6069);