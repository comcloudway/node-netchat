const net = require('net');

let users = {};
let clients = {};

function generateID(t) {
	if(t>20) return -1;
	let id = Math.floor(Math.random()*1000);
	if(!!clients[id]) return generateID(t+1);
	return id;
}
function pipe(msg) {
	Object.values(clients).forEach(({conn})=>conn.write(msg));
}

var server = net.createServer();

server.on('connection', function(conn) {
  	conn.id = generateID(0);
	clients[conn.id]={
		conn:conn};
	conn.write("Connected to server as: " + conn.id);
	conn.write("\n+---+\n");
  	conn.on('data', function(data) {
	  	let cont = data.toString('utf8');
		if(cont.lastIndexOf("\n")===cont.length-1)cont=cont.slice(0,-1);
		let cmd = cont.split(" ");
	switch(cmd[0]) {
			case "+login":
				if(cmd.length<2) {
					//no parameters
					conn.write("use [+login username] to login with that username");
				}
				else if(!!clients[conn.id].nick) {
					// user already exits
					conn.write("already logged in");
				} else {
					// login
					  clients[conn.id].nick= cmd[1];
					conn.write("logged in");
				}
				break;
			case "+logout":
				if(!clients[conn.id].nick) {
					conn.write("not logged in");
				} else {
					delete clients[conn.id].nick;
					conn.write("logged out");
				}
				break;
			case "+send":
				if(!clients[conn.id].nick) {
					conn.write("not logged in");
				} else if(cmd.length <2){
					conn.write("no msg found");
				} else {
					let msg = [...cmd];
					msg.shift();
					pipe(`\n[${clients[conn.id].nick}@${conn.id}]: ${msg.join(" ")}\n`);
				}
				break;
			case "+users":
				conn.write("ONLINE: \n");
				conn.write(Object.entries(clients).map(([id,{nick}])=>{
					let out = nick;
					if(!out) out="<not-logged-in>";
					out+=`@${id}`;
					if(id===`${conn.id}`) out=`<[${out}]>`;
					return out;
				}).join("\n"));
				break;
			case "+help":
			default:
				conn.write("HELP:\n");
				conn.write(">> +login [username] << to login eith your username\n");
				conn.write(">> +logout << to logout\n");
				conn.write(">> +send [msg] << to send a message to the chat\n");
				conn.write(">> +users << lists all online users\n");
				conn.write(">> +help << shows this menu\n");
		}
		conn.write("\n");
  });
	// remove ended connections
	conn.on('end',()=>{
		delete clients[conn.id];
	});

});

//server.listen(1337, '127.0.0.1');
server.listen(1337)
