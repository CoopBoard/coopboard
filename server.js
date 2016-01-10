var express = require('express');
var app = express();
var server = require('http').createServer(app);
var conf = require('./config.json');
var path = require("path");
var fs = require("fs");

io = require('socket.io')(server);

var sha1 = require('sha1');

if((typeof conf.debug !== "undefined") ){
	var DEBUG=conf.debug;
}
else{
	var DEBUG = 10;
	debug_log(10,"debug level was not set in config.json");
}
// ---------------------------------------------------------------------
// Konstanten für Rechte
const ADMIN  =3;
const NUTZER =2;
const GUEST  =1;

// Zeitkonstanten
const WEEK = 7*24*60*60*1000; 
const YEAR = 365*24*60*60*1000;

server.listen(conf.server.port);
app.use(express.static(__dirname + "/public"));

// wenn der Pfad / aufgerufen wird
app.get('/', function (req, res) {
	// so wird die Datei index.html ausgegeben
	res.sendfile(__dirname + '/public/index.html');
});
 
// ---------------------------------------------------------------------
// Datenbankeinbindung
// ---------------------------------------------------------------------
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(conf.db.name);		// Wählt Datenbank aus
var db_interval= 60*5*1000;											
var db_timer = setInterval(db_save,db_interval);	// db speichern alle 5 Minuten aufrufen

// -------------------- Server-Übersicht -------------------------------
setInterval(function(){
	// aktive Nutzer
	var b=[];
	for (var id in USERS) {
		b.push(id);
		debug_log(3,"Nutzer "+ JSON.stringify({id:id,board: USERS[id].get.board()/*,recht:USERS[id].get.rechte()*/}));
	}
	var ids=[];
	for (var id in IDS) {
		ids.push(id);
		debug_log(3,"IDs "+JSON.stringify({sid:id,reconnectID: IDS[id]}));
	}
	debug_log(3,"Nutzer "+JSON.stringify(b));
	debug_log(0,"Anzahl der Nutzer "+b.length,2);
	var b=0;
	for (var id in BOARDS) { b++; }
	debug_log(2,"Anzahl der Boards: "+ b);
},10000);


// Mindestens 1 Board, dass aber ggf. durch die gespeicherten
// überschrieben wird
//var boards = {}; // {"1":{all_divs:{},name:"gfhjk", sichtbar:1, aenderung:0, hintergrund:"" ,passwort:{admin:"",nutzer:"",gast:""}, blockiert:{}} };
var BOARDS = {};

var special_boards_path = path.join(__dirname, "special_boards");
var	SPECIAL_BOARDS = {};

var specialboards_files =fs.readdirSync(special_boards_path);
for(var i in specialboards_files){// files may not contain special characters
	SPECIAL_BOARDS[specialboards_files[i]] = JSON.parse(fs.readFileSync(path.join(__dirname, "special_boards", specialboards_files[i]), 'utf8'));
	SPECIAL_BOARDS[specialboards_files[i]]['PASSWORD'] = {"a":1,"n":1,"g":null};
	SPECIAL_BOARDS[specialboards_files[i]]['NAME'] = specialboards_files[i];
	SPECIAL_BOARDS[specialboards_files[i]]['VISIBILITY'] = 0;
}

// Names
var NAMES = {'Sokrates':0,'Platon':0, 'Euklid':0, 'Thales':0,'Pythagoras':0,'Archimedes':0,'Diophant':0,'Brahmagupta':0,'Fibonacci':0,'Cardano':0,'Kepler':0,'Fermat':0,'Descartes':0,'Bernoulli':0,'Leibniz':0,'Euler':0,'Lagrange':0,'Laplace':0,'Fourier':0,'Cauchy':0,'Abel':0,'Dirichlet':0,'Cayley':0,'Kronecker':0,'Riemann':0,'Cantor':0,'Hilbert':0,'Banach':0,'Aristoteles':0,'Demokrit':0,'Eratosthenes':0,'Feuerbach':0,'Kant':0,'Lessing':0,'Marx':0,'Nietzsche':0};
var IDS = {};	// hier werden die socket.ids den userids zugeordnet (socket.id : reconnectID)


db_read();
// ---------------------------------------------------------------------
// Datenbank Funktionen
// ---------------------------------------------------------------------
function db_read(){
	db.serialize(function(){
		db.each("SELECT board, name FROM boards_db", function (err,row){
			if (row.board==null) { db_board_delete(row.name);}		
			else{
				var d = JSON.parse(row.board);
				if (d.CHANGED + YEAR < new Date().getTime() )
					db_board_delete(row.name);
				if (JSON.stringify(d.DIVS) == "{}")
					db_board_delete(row.name);
				else{
					BOARDS[ row.name ] = new BOARD (row.name, row.board);
					debug_log(4,"Content: "+JSON.stringify(BOARDS[row.name])+" Name: "+row.name+ "typ: "+typeof(row.name));
				}
			}
		});
	});
}
// ---------------------------------------------------------------------
function db_save(){
	var d = new Date().getTime();
	for ( var id in BOARDS ){
	//	if ( ( d - BOARDS[id].get.changed() ) <= db_interval ) {
			db_save_board( id );
	//	} else {
	//		debug_log(1,'not saving board: '+id);
	//	}
	}
}
// ---------------------------------------------------------------------
function db_save_board(bid){
	if (SPECIAL_BOARDS[bid]==undefined){
		db.serialize(function(){
			db.run("UPDATE boards_db SET board ='"+BOARDS[ bid ].get.save_data()+ " 'WHERE name ='"+bid+"'");
			debug_log(1,'save board: '+bid);
			BOARDS[ bid ].save_notification();
		});
	}
}
// ---------------------------------------------------------------------
function db_board_add(id,save_data){										// Board der DB hinzufügen
	if (save_data == undefined) return false;
	db.serialize(function() {
		var stmt = db.prepare("INSERT INTO boards_db (board, name) VALUES (?,?)");
		stmt.run(save_data,id);						
		stmt.finalize();  
	});
} 

function db_board_delete(id){
	db.serialize(function() {
		var stmt = db.prepare("DELETE FROM boards_db WHERE name='"+id+"'");
		stmt.run();						
		stmt.finalize();  
	});
}
// ---------------------------------------------------------------------
// ENDE Datenbank
// ---------------------------------------------------------------------


// ---------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------

// return random name, which is still free
function set_username (){
	var i=0;
	var u_names=[];
	for (var n in NAMES){
		if (NAMES[n] == 0){
			u_names[i]=n;
			i++;
		}
	}
	if (i != 0){
		var j = zufall(0,i-1);
		debug_log(4,"NAME ausgewählt: "+u_names[j]);
		return u_names[j];
	}else return 1;
}

function isUser(sid) {
	if ( typeof(USERS[IDS[sid]]) == "object" ) return true;
	for (var i in BOARDS) {
		BOARDS[i].disconnect(sid);
	}
	return false;
}

function debug_log(min,message,max){
	if(DEBUG == 0){
		return;
	}
	if(typeof max === "undefined"){
		if(min<=DEBUG){
			console.log(message);
		}
	}
	else{
		if(min<=DEBUG && max>=DEBUG){
			console.log(message);
		}
	}
}
// ---------------------------------------------------------------------
// Client-Kommunikation
// ---------------------------------------------------------------------
var USERS = {};

// Nutzer-Object
var USER = function(id,s,sid) {
	// reconnectID umbennenen???
	var reconnectID = id; 			// first socket.id load from cache e.g to find presentation master
	var SID = sid;		// socket.id to find USER
	var T = this;
	this.socket = s;
	
	var _board = 1;	 // current board
	var _followers = false;
	var _following = false;
	var _slide = 0;
	var _name = 0;

	// --------------------- getter ------------------------------------
	this.get = {};
	this.get.board     = function(){ return _board; };
	this.get.followers = function(){ return _followers; }
	this.get.slide     = function(){ return _slide; }
	this.get.name	   = function(){ return _name;}
	this.get.reconnectID = function(){ return reconnectID;}
	this.get.sid	   = function(){ return SID; }
	this.get.public_presentation = function(){ 
		if ( _followers===false ) return false;
		return true;
	};
	// --------------------- setter ------------------------------------
	this.set = {};
	this.set.name = function (n){
		// kein name im cache
		if (n == 0){
			_name = set_username();
			if (_name==1){ _name=SID;}		// kein name -> socket.id 
			NAMES[_name] = reconnectID;
			//return;
		}else{	// name wird gesendet (cache oder via chat)
			var gesetzt=0;
			for (var name in NAMES){
				if (n == name){
					// keinen NAMENKLAU
					for (var u in USERS){
						if (u==NAMES[n] && u != reconnectID){
							informUser(SID,'username_set',_name);
							return;
						}
					}
					NAMES[name] = reconnectID;
					gesetzt =1;
				}
			}
			if (gesetzt = 0){
				for (var name in NAMES){
					if (NAMES[name]== reconnectID){
						NAMES[name]=0;
					}
				}
				NAMES[n]=reconnectID;
			}
			_name = n;
		}
		informUser(SID,'username_set',_name);
		debug_log(4,"NAMES: "+JSON.stringify(NAMES)+" eingetragen wurde: "+ _name);
	}
	
	this.set.sid = function(s){
		debug_log(4,"socket.id changed from "+SID+" to "+s+".!!!");
		SID=s;
	}
	
	this.set.slide  = function(bid,snr) {
		debug_log(3,'slide_show '+ JSON.stringify({bid:bid,snr:snr}));
		_slide = snr;
		if ( _followers == false ) return false;
		var u = _followers;
		for (var i=0; i<_followers.length; i++ ) {
			if (USERS[_followers[i] ]!=undefined){
				var s=USERS[_followers[i] ].get.sid();
				if ( isUser( s) ) { 
					informUser(s,'slide_shown',SID,bid,snr);
				}
			}
			else { U.follower_remove( u[i] ); }
		}
	}
	
	this.recover_board = function(){		// zustand vor disconnect herstellen
			informUser(SID,"board_recovered",_board);		
	}
	
	// -----------------------------------------------------------------
	// follow presentations 
	// -----------------------------------------------------------------
	this.set.following = function(id) {
		// ggf. von alter Präsentation trennen
		for (var j in IDS){
			if (IDS[j]==_following){
				if (_following != false && isUser(j) ) {
					USERS[_following].follower_remove(reconnectID);
				}
			}
		}
		// ggf. mit neuer Präsentation verbinden
		if ( id != false && isUser(id) ) {
			USERS[IDS[id]].follower_add(SID);
			_following = IDS[id];
			informUser(SID,'following',USERS[IDS[id]].get.board(),IDS[id],USERS[IDS[id]].get.slide(),BOARDS[ USERS[IDS[id]].get.board()].get.name() );
		} else {
			_following = false;
			informUser(SID,'following',false,false);
		}
		debug_log(3,SID + " connects to "+id);
	}
	this.set.allow_followers = function() { _followers = []; _slide = 0; }
	this.set.deny_followers  = function() { 
		for (var i=_followers.length-1; i>=0; i--) {
			if ( isUser(_followers[i]) === true ) {
				USERS[ _followers[i] ].set.following(false);
			}
		}
		_followers = false;
	}
	this.follower_add = function(id) {
		//if ( typeof(_followers == "object") && _followers.indexOf(id)==-1 ) {
			_followers.push(IDS[id]);
			for (var i=0; i< _followers.length; i++) {
				for (var j in IDS){
					if (IDS[j]==_followers[i]){
						if ( isUser(j) === false ) { _followers.splice(i,1);}
					}
				}
			}
			informUser(SID,'followers',JSON.stringify(_followers));
			debug_log(3,SID+' folgen '+ _followers );
		//}
	}
	this.follower_remove = function(id) {
		if ( _followers != undefined && typeof(_followers) == "object" && _followers.indexOf(id)>-1 ) {
			_followers.splice(_followers.indexOf(id),1);
			// 
			for (var i=0; i< _followers.length; i++) {
				for (var j in IDS){
					if (IDS[j]==_followers[i]){
						if ( isUser(j) === false ) { _followers.splice(i,1);}
					}
				}
			}
			informUser(SID,'followers',JSON.stringify(_followers));
			debug_log(3,SID+' folgen '+_followers );
		}
	}
	var followers_drop= function(){
		
	}
	// -----------------------------------------------------------------
	// Change boards, disconnect ...
	// -----------------------------------------------------------------
	this.boardchange = function(bid,pw){
		debug_log(2, SID+' altes Board: '+ _board );
		debug_log(2,"Boardwechsel: "+SID+" ("+bid+")");
		informUser(SID,"debug","name", _name);
		// -------------------------------------------------------------
		if ( BOARDS[ bid ] == undefined ){
			informUser(SID,'board_fehlt');
			return;
		}
		// -------------------------------------------------------------
		if ( BOARDS[ _board ] != undefined ) BOARDS[ _board ].disconnect(SID);
		// -------------------------------------------------------------
		// Handle Presentations
		var snr = false;
		if ( _following != false){
			for (var j in IDS){
				if (IDS[j]==_following){
					if ( isUser(j) ) snr = USERS[ _following ].get.slide();
				}
			}
		}
		// -------------------------------------------------------------
		debug_log(2,"Boardwechsel: "+SID+" ("+bid+")");
		BOARDS[ bid ].connect(SID,pw,snr);
		_board = bid;
		// falls reconnect mit laufender presentation
		if (_followers != false)
			informUser(SID,"presentation_reconnected");
	}
	// -----------------------------------------------------------------
	this.disconnect = function(){
		debug_log(1, 'Disconnect', SID );
		// -------------------------------------------------------------
		//T.set.following(false);
		//T.set.deny_followers();

		// -------------------------------------------------------------
		BOARDS[ _board ].disconnect( SID );
		// -------------------------------------------------------------
		delete IDS[SID];
		//delete ( USERS[ SID ] );
	}

	// -----------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------
	function informFollowers(uid, event, data1,data2, data3, data4){
		for ( var o in _followers ) {
			var f_sid=USERS[o].get.sid();
			io.sockets.socket(f_sid).emit( event, data1, data2, data3, data4 );
		}
	}
}

// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on('connection', function(socket) {
	
	// Nutzerobject anlegen
	USERS[ socket.id ] = new USER(socket.id,socket,socket.id); // wird erst nach id_set angelegt oder in einen bereits bekannten gelegt
	IDS[socket.id]=socket.id;	//verhindert server crash beim starten

	informUser(socket.id, 'your_id', socket.id);
	informUser(socket.id, 'special_boards', SPECIAL_BOARDS);
	// öffentliche Präsentationen anzeigen
	public_presentations(1);
	
	// Statusmitteilung im Chat
	informUser(socket.id,'message_added', { zeit: new Date().getTime(), name:"Statusmitteilung", text: 'Mit dem Server verbunden!' , is_system:true});	


	// -----------------------------------------------------------------
	//Board Events
	socket.on('board_copy',	   function(	  ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].copy(socket.id);	});
	socket.on('board_delete',  function(	  ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].delete_board(socket.id); });
	socket.on('board_export',  function(      ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].export(socket.id); });
	socket.on('board_change',  function(bid,pw){ USERS[ IDS[socket.id] ].boardchange(bid,pw); });
	socket.on('disconnect',    function(      ){ if (USERS[IDS[socket.id]] == undefined ) return; USERS[ IDS[socket.id] ].disconnect(); });
	socket.on("password_set",  function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].set.password(data[0],data[1],socket.id); });
	socket.on('visibility_set',function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].set.visibility(data,socket.id); });
	socket.on('grid_set',	   function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].set.grid(data,socket.id); });
	socket.on('freie_boards',  function(){ freie_boards(2,socket.id);});
	socket.on('board_recover',function(url,pw){
		if (url=="Anleitung"){
			USERS[IDS[socket.id]].recover_board();	//recover old board
		}
		else USERS[IDS[socket.id]].boardchange(url,pw);	// connect to url
		// reconnecting to presentation
		informUser(socket.id,"presentation_reconnected");
	});
	socket.on('last_boards_update', function( data ){ // browser-cache leeren ermöglichen
		var deleted_lb=[];
		for (var i=0; i< data.length;i++){
			if (BOARDS[data[i]]== undefined){
				deleted_lb.push(data[i]);
			}
		}
		informUser(socket.id,'last_boards_updated',deleted_lb);
	});
	socket.on('board_add',function(){
		var bid = sha1( socket.id + new Date().getTime()).substr(3,16);
		BOARDS[ bid ] = new BOARD(bid,"new",socket.id);
	});	
	
	// -----------------------------------------------------------------
	//Change Events
	socket.on('background_set',function( back ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].set.background( back, socket.id ); });
	socket.on('bname_set',     function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].set.name(data,socket.id); });
	socket.on('message_add',   function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].chat(data,socket.id);});
	socket.on("element_change",function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].change(data,socket.id);});
	socket.on("element_import",function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].import(data,socket.id);});
	socket.on("element_remove",function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].remove(data,socket.id); });
	socket.on('verbinder_delete', function( data ){BOARDS[ USERS[ IDS[socket.id] ].get.board() ].verbinder_delete(socket.id,data); });	

	// -----------------------------------------------------------------	
	// User Settings
	socket.on('username_set', function( data ){USERS[ IDS[socket.id] ].set.name(data);});
	socket.on('id_set', function (old){ id_set(old,socket.id);});

	// -----------------------------------------------------------------
	// Chat
	socket.on('messages_receive', function(bid){ message_receive(bid,socket.id);});
	
	// -----------------------------------------------------------------
	// Import
	socket.on('div_read',function(){informUser(socket.id,'div_set');});	// nur Signal an Client

	// -----------------------------------------------------------------
	// public presentations
	// Wenn keine Präsentation offen ist, so "false"
	// Bei einer offenen Präsentation Array mit UIDs
	socket.on('presentation_open',function(data,reconnect,snr){if (snr==undefined) snr=0; presentation_open(data,reconnect,snr,socket.id);});
	socket.on("slide_show",function(bid,snr){ USERS[ IDS[socket.id]].set.slide(bid,snr); });
	socket.on('presentation_connect',	 function( id ){ USERS[ IDS[socket.id] ].set.following( id );	});
	socket.on('presentation_disconnect',function( id ){ USERS[ IDS[socket.id] ].set.following( false );	});
	
	// -----------------------------------------------------------------
	// Debugging
	socket.on("debug",function(data){informUser(socket.id,"debug",data);});
		
	
	// -----------------------------------------------------------------
	// interne Funktionen
	// -----------------------------------------------------------------
	
	// ------------ presentation ---------------------------------------
	function public_presentations(a){
		var b = {};
		for (var id in IDS) {
			if ( USERS[IDS[id]].get.public_presentation()===true) { 
				b[id] = { board_id:USERS[IDS[id]].get.board(), board_name: BOARDS[ USERS[IDS[id]].get.board() ].get.name() };
			}
		}
		if ( a==1 ) {
			// An alle senden
			informAll('public_presentations',JSON.stringify(b));
		} else {
			informUser(socket.id,'public_presentations',JSON.stringify(b));
		}
		debug_log(1,"public_presentations: "+ JSON.stringify(b));
	}
	// -----------------------------------------------------------------
	function presentation_open(data,reconnect,snr,sid){
	var U = USERS[ IDS[sid]];
	//	if ( U.get.rechte() < GUEST ) return false;
		if (typeof data !=='boolean' ) return false;
		var d = JSON.parse(data);
		debug_log(2,"public_presentations ("+sid+"): "+ data);
		if (reconnect==undefined){
			if (d==true) {	
				U.set.allow_followers();
			} else { 
				U.set.deny_followers();
			}
		}
		var f = U.get.followers();
		if (f != false){
			for (var i in f){
				for (var s in IDS){
					if (IDS[s]==f[i]){	
						informUser(s,'following_set',sid);
					}
				}	
			}
		}
		informUser(sid,'followers',JSON.stringify( U.get.followers() ));
		public_presentations(1);
		debug_log(1,'op '+U.get.public_presentation() );
		// notiz an den client raussenden,damit der den slide zeigen und aufrufen kann.
		if (reconnect != undefined){
			informUser(sid, "presentation_reconnected",snr);
		}	
	}
	// -----------------------------------------------------------------
	// ------------------------- User ----------------------------------
	function id_set(old,sid){
		if (old == undefined) old = sid;
		IDS[sid] = old;
		
		if (USERS[old]!= undefined){
			USERS[old].set.sid(sid);
		}else{
			USERS[old]= new USER(old,socket,sid);
		}
		socket.emit('id_set',old);	
	}
	// -----------------------------------------------------------------
	// ------------------------- Chat ----------------------------------
	function message_receive(bid,sid){
		if (bid == undefined){
			bid = USERS[ IDS[sid] ].get.board();
		}
		if (BOARDS[bid] == undefined) return false;	// falls Eingabe Blödsinn
		BOARDS[bid].send_messages(sid);	
	}
	// -----------------------------------------------------------------
});


function freie_boards(a,uid){
	var b=[];
	for (var bid in BOARDS){
		if( BOARDS[bid].get.visibility() == 1 ){
			b.push({id:bid,name:BOARDS[bid].get.name()}); 
		}
	}
	if ( a==1 ) {
		informAll('freie_boards',b);
	} else {
		informUser(uid,'freie_boards',b);
	} 
	debug_log(1,"Freie Boards: "+ JSON.stringify(b));
}
// ---------------------------------------------------------------------
// Boards
// ---------------------------------------------------------------------
var BOARD = function (bid, data,uid){
	var NEW = false;
	
	// -----------------------------------------------------------------
	// Create Data for a new Board
	if (data == "new" && uid != undefined && isUser(uid) ) {
		NEW = true;
		data = JSON.stringify( { 
			DIVS:       {},
			NAME:       bid, 
			VISIBILITY: 0, 
			CHANGED:    new Date().getTime(), 
			BACKGROUND: "",
			PASSWORD:   {a:null,n:null,g:null},
			MESSAGES: 	[],
			GRID:		40
		} );
		debug_log("board_added " + bid);
	} else if ( data == "new") {
		return false;
	}
	
	// -----------------------------------------------------------------
	
	var B            = this;
	var BID           = bid;	
	var USERS_here    = {};		// ID : recht
	var D             = JSON.parse(data);
	var MESSAGES	  = [];
	// -----------------------------------------------------------------
	// replace old names
	if ( D.all_divs    != undefined ) { D.DIVS       = D.all_divs;    }
	if ( D.aenderung   != undefined ) { D.CHANGED    = D.aenderung;   }
	if ( D.hintergrund != undefined ) { D.BACKGROUND = D.hintergrund; }
	//if ( D.passwort    != undefined ) { D.PASSWORD 	 = {g:D.passwort.gast, n: D.passwort.nutzer, a: D.passwort.admin};	}
	if ( D.passwort    != undefined ) { D.PASSWORD 	 = {g:D.passwort.g, n: D.passwort.n, a: D.passwort.a};	}
	if ( D.name        != undefined ) { D.NAME       = D.name;        }
	if ( D.sichtbar    != undefined ) { D.VISIBILITY = D.sichtbar;    }
	//if ( D.PASSWORD.gast != undefined ||D.PASSWORD.gast ==null){ D.PASSWORD = {g:D.passwort.gast, n: D.passwort.nutzer, a: D.passwort.admin};}
	if ( D.MESSAGES    != undefined ) { MESSAGES = D.MESSAGES;		  }
	// -----------------------------------------------------------------
	// only import wanted data
	var DIVS          = D.DIVS;
	var CHANGED       = D.CHANGED;
	var BACKGROUND    = D.BACKGROUND;
	if ( BACKGROUND == undefined || BACKGROUND == "" ) BACKGROUND="C#ffffff";
	if ( D.GRID     == undefined ) { D.GRID=40; }
	var GRID 		  = D.GRID;
	var PASSWORD      = D.PASSWORD;
	var NAME          = D.NAME;
	var VISIBILITY    = D.VISIBILITY;
 
	
	delete( D );
	// unblock_elements
	for ( var did in DIVS ) {
		DIVS[ did ].blockiert = {sid:0, name:0};
	}
	// -----------------------------------------------------------------
	if (NEW) {
		NEW = false;
		db_board_add( bid,JSON.stringify({
			DIVS:       DIVS,
			CHANGED:    CHANGED,
			BACKGROUND: BACKGROUND,
			PASSWORD:   PASSWORD,
			NAME:       NAME,
			VISIBILITY: VISIBILITY,
			MESSAGES:	MESSAGES,
			GRID:		GRID
		}) );
		informUser(uid,'board_added',bid);
	}
	//------------------------------------------------------------------
	this.get = {};
	//------------------------------------------------------------------
	this.get.visibility = function (uid){ return VISIBILITY; };
	this.get.changed    = function (uid){ return CHANGED; };
	this.get.name       = function (uid){ return NAME; };
	this.get.messages	= function (uid){ return MESSAGES; };
	this.get.grid		= function (uid){ return GRID; };
	this.get.save_data  = function (   ){
		return JSON.stringify({
			DIVS:       DIVS,
			CHANGED:    CHANGED,
			BACKGROUND: BACKGROUND,
			PASSWORD:   PASSWORD,
			NAME:       NAME,
			VISIBILITY: VISIBILITY,
			MESSAGES:	MESSAGES,
			GRID:		GRID
		});
		
	}
	//------------------------------------------------------------------
	this.set = {};
	//------------------------------------------------------------------
	this.set.visibility = function ( data , uid) {
		if ( USERS_here[ IDS[uid] ] < ADMIN ) return false;
		VISIBILITY = data;
		freie_boards(1,uid);
		CHANGED = new Date().getTime();
		db_save_board( BID );	
	}
	//------------------------------------------------------------------
	this.set.name = function (name, uid) {				
		if ( USERS_here[ IDS[uid] ] < ADMIN ) return false;
		if ( typeof name !== "string") return false;
		debug_log(3,"set Board name:"+BID+" "+name);
		NAME    = name;
		CHANGED = new Date().getTime();
		if ( VISIBILITY == 1 ) {
			informAll( 'board_renamed',{ id:BID,name:name} );
			freie_boards(1);
		} else {
			informUser(uid, 'board_renamed',{ id:BID,name:name} );
		}
		db_save_board( BID );
	}
	//------------------------------------------------------------------
	this.set.password = function (a, p, uid) {			
		if ( USERS_here[ IDS[uid] ] < ADMIN ) return false;
		debug_log(1,"password_set " +  uid );
		debug_log(3,"password_set " + PASSWORD);
		// Nur definierte Gruppen zulassen
		if (a!='admin' && a!= 'nutzer' && a!='gast') return false;
		// Gespeichert wird ein verschlüsseltes Passwort
		// Das führende "$" kennzeichnet dieses
		if ( p=="" ) {
			PASSWORD[ a[0] ] = null;
		} else {
			PASSWORD[ a[0] ] = "$" + sha1( BID + p );
		}
		CHANGED = new Date().getTime();	
		db_save_board( BID );
	}
	//------------------------------------------------------------------
	this.set.background = function (back, uid) {
		if ( USERS_here[ IDS[uid] ] < NUTZER ) return false;
		BACKGROUND = back;
		CHANGED = new Date().getTime();	
		informAllUsers('background_set',back);
	}
	//------------------------------------------------------------------
	this.set.grid = function (dist, uid) {
		if ( USERS_here[ IDS[uid] ] < NUTZER ) return false;
		GRID = dist;
		CHANGED = new Date().getTime();
		informAllUsers("grid_set",dist);
	}
	// -----------------------------------------------------------------
	// Users on board
	// -----------------------------------------------------------------
	this.connect = function( uid,pw,slide ){
		debug_log(1,'user:'+uid+" "+sha1(BID+pw));
		if ( !isUser( uid ) ) return false;
		var right=0;
		if ( PASSWORD.g == null || PASSWORD.g === "$"+sha1( BID +pw) ) right = GUEST;
		if ( PASSWORD.n == null || PASSWORD.n === "$"+sha1( BID +pw) ) right = NUTZER;
		if ( PASSWORD.a == null || PASSWORD.a === "$"+sha1( BID +pw) ) right = ADMIN;
		USERS_here[ IDS[uid]  ] = right;
		// -------------------------------------------------------------
		// Alle Elemente übertragen
		if ( right >= GUEST ) {
			if  ( CHANGED+WEEK <= new Date().getTime() ) CHANGED = new Date().getTime();	
			for (d in DIVS){ informUser(uid,'element_changed',DIVS[d] ); }
		}	
		B.send_messages(uid);
		informUser(uid,'message_added',{ zeit: new Date().getTime(), name:"Statusmitteilung", text: 'Boardwechsel zu Board "'+NAME+'"' , is_system:true});	
		//informUser(uid,'board_changed',BID,NAME,right,(slide==true) );
		informUser(uid,'board_changed',BID,NAME,right,slide );
		informUser(uid,'background_set',BACKGROUND );
		informUser(uid,"grid_set",GRID);
		B.show_users_on_board();
	}
	
	// -----------------------------------------------------------------
	this.disconnect = function(uid){
		if ( USERS_here[  IDS[uid]  ] == undefined ) return false;
		delete( USERS_here[  IDS[uid]  ] );
		// unblock elements
	//	if (USERS[  IDS[uid]  ] != undefined){
			for ( var did in DIVS ) {
				if (typeof(DIVS[did])=="object"){
					if ( DIVS[ did ].blockiert == undefined ) DIVS[ did ].blockiert = {sid:0,name:0};
					else if ( typeof(DIVS[ did ].blockiert) != 'object' || DIVS[ did ].blockiert == 0) DIVS[ did ].blockiert = {sid:0,name:0};
					if ( DIVS[ did ].blockiert.sid == USERS[  IDS[uid]  ].get.sid() ) {
						DIVS[ did ].blockiert = {sid:0, name:0};
						informAllUsers('element_changed',{id:did,blockiert:{sid:0,name:0}});
					}
				}
			}
	//	}
		B.show_users_on_board();
	}
	// -----------------------------------------------------------------
	this.chat = function(data,uid){
		if ( USERS_here[  IDS[uid]  ] < NUTZER )return false;
		if ( typeof data !== "object"	)return false; 
		if (MESSAGES == undefined){MESSAGES = {};};
		//var nid = uid+new Date().getTime();
		MESSAGES.push({ zeit: new Date().getTime(), name: data.name || USERS[IDS[uid]].get.name(), text: data.text });
		informAllUsers('message_added', { zeit: new Date().getTime(), name: data.name || USERS[IDS[uid]].get.name(), text: data.text },uid);
		CHANGED = new Date().getTime();
	}
	this.send_messages = function(uid){
		if ( USERS_here[  IDS[uid] ] < NUTZER )return false;
		if (MESSAGES != undefined){
			informUser(uid,'messages_received',MESSAGES);
		}
	}
	// -----------------------------------------------------------------
	this.show_users_on_board = function() {
		var b = [];
		for (var o in USERS_here  ) { b.push(o); }
		//informAllAdmins('users_on_board', JSON.stringify(b) );	!!!
	}
	// -----------------------------------------------------------------
	// Elements
	// -----------------------------------------------------------------
	// remove Element
	// needs DIV-ID and USER-ID
	this.remove = function (did,uid) {
		if ( USERS_here[ IDS[uid] ] < NUTZER ) return false;
		debug_log(6,"element_remove "+ did);
		informAllUsers('element_removed',did,BID);
		delete DIVS[ did ];
		CHANGED = new Date().getTime();
	}
	// -----------------------------------------------------------------
	// Change Element
	// needs data, "s", "d" or "t" and USER-ID
	this.change = function ( data,uid,IMPORT ){
		if ( USERS_here[ IDS[uid] ] < NUTZER ) return false;
		// Falls falsche Eingabe
		if( typeof data !== 'string' && (data[0]!='{'|| data[data.length-1]!='}' ) )return false; 
		debug_log(4,"element changed("+BID+":"+USERS_here[  IDS[uid]  ]+"): "+data);
		d = JSON.parse(data);
		// id must be given
		if (d.id == undefined || ( d.id[0]!="d" && d.id[0]!="s" && d.id[0]!="t" ) ) return false;
		// Create Element if no id is given
		if (d.id.length == 1){
			d.id += new Date().getTime();
			DIVS[ d.id ]={};		
			debug_log(5,"Neues Element"+d.id);
		}
		// import Element
		if (IMPORT ==1){
			DIVS[d.id]={};
			debug_log(5,"Import Element"+d.id);
		}
		
		if ( DIVS[ d.id] == undefined ) return false;
		// Handle Blocking
		if ( DIVS[ d.id ].blockiert == undefined || typeof(DIVS[ d.id ].blockiert) != 'object') DIVS[ d.id ].blockiert = {sid:0,name:0};
		if ( d.blockiert != undefined ){
			if(typeof(d.blockiert) != 'object' && d.blockiert  == 0) d.blockiert = {sid:0,name:0};
			if ( d.blockiert.sid != 0 && DIVS[ d.id ].blockiert.sid == 0 ) {
				d.blockiert = {sid:USERS[  IDS[uid]  ].get.sid(),name:USERS[  IDS[uid]  ].get.name()};
			} else if ( d.blockiert.sid == 0 && DIVS[ d.id ].blockiert.sid == USERS[  IDS[uid]  ].get.sid()) {
				d.blockiert = {sid:0,name:0};
			}
			/*if ( d.blockiert != 0 && DIVS[ d.id ].blockiert == 0 ) {
				d.blockiert = USERS[  IDS[uid] ].get.name();
			} else if ( d.blockiert == 0 && DIVS[ d.id ].blockiert == USERS[  IDS[uid]  ].get.name() ) {
				d.blockiert = 0;
			} */else {
				delete ( d.blockiert );
			}
		}
		// transfer data into DIVS
		for (var i in d ) { DIVS[ d.id ][ i ] = d[ i ]; }
		informAllUsers("element_changed",  d );
		CHANGED = new Date().getTime();
	}
	// Delete Verbinder
	this.verbinder_delete = function ( uid, vid){
		var U = USERS[IDS[uid]];
		if( USERS_here[ IDS[uid] ] <NUTZER) return false;
		informAllUsers('verbinder_deleted',vid);
		CHANGED = new Date().getTime();	
	} 
	// -----------------------------------------------------------------
	// Copy Board
	// -----------------------------------------------------------------
	this.copy = function ( uid ) {
		var U = USERS[IDS[uid]];
		if( USERS_here[ IDS[uid] ] <ADMIN) return false;	
		var id = sha1( uid+ new Date().getTime()).substr(3,16);
		var data =  JSON.stringify({
			DIVS:       DIVS,
			CHANGED:    new Date().getTime(),
			BACKGROUND: BACKGROUND,
			PASSWORD:   {a:null,n:null,g:null},
			NAME:       id,
			VISIBILITY: 0,
		});

		BOARDS[ id ] = new BOARD(id,data,IDS[uid]);
		db_board_add(id,B.get.save_data());
		informUser(uid,'board_copied',id);
	}
	// -----------------------------------------------------------------
	// delete Board
	// -----------------------------------------------------------------
	this.delete_board = function( uid ) {
		var U = USERS[IDS[uid]];
		if( USERS_here[ IDS[uid] ] < ADMIN) return false;
		delete BOARDS[ bid ];
		db_board_delete(bid);
		for (var u in USERS){
			if (USERS[u].get.board()== bid){
				informUser(USERS[u].get.sid(),"board_deleted");
			}
		}
		freie_boards(1);
	}
	// -----------------------------------------------------------------
	// Export / Import
	// -----------------------------------------------------------------
	this.export = function( uid ) {
		var U = USERS[IDS[uid]];
		if( USERS_here[ IDS[uid] ] < GUEST) return false;
		var b = {
			DIVS:JSON.parse( JSON.stringify( DIVS )),
			PASSWORD:{a:"",n:"",g:""},
			NAME:NAME,
			BACKGROUND:BACKGROUND,
			VISIBILITY:0,
			CHANGED: CHANGED
		};
		// Remove Locks
		for (var i in b.DIVS) { b.DIVS.blockiert = {"sid":0,"name":0}; }
		informUser(uid, 'board_exported',JSON.stringify( b ) );
	}
	
	this.import = function (data, uid){
		B.change(data,uid,1); 
	};
/*	this.overwrite = function  (uid, data){		// löst zusätzlich zum import löschen alter daten aus.
		B.change(data,uid,1);
	
	};*/
	// Import fehlt noch
		//	if (Event =="div_import"|| Event =="slide_import")
		//		boards[ U.get.board() ].all_divs[d.id]={};				
		// ggf blockieren oder freigeben
	
	// Statusmeldung board saved 	
	this.save_notification = function (){
		informAllUsers('message_added', { zeit: new Date().getTime(), name:"Statusmitteilung", text: 'board saved!' , is_system:true});
	}
	// -----------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------

	// -----------------------------------------------------------------
	function informAllUsers(event, data1, data2, data3, data4 ){
		for ( var o in USERS_here ) {
			var s = USERS[o].get.sid();
			if (IDS[s]==o){
				if ( isUser(s) && USERS_here[o] >= GUEST ) {
					if (io.sockets.connected[s]) {
						io.sockets.connected[s].emit(event, data1, data2, data3, data4);
					}
				}
			}	
		}
	};
	function informAllAdmins(event, data1, data2, data3, data4 ){
		for ( var o in USERS_here ) {
			var sid = USERS[o].get.sid();
			if ( isUser(sid) && USERS_here[o] >= ADMIN ) {
				if (io.sockets.connected[sid]) {
					io.sockets.connected[sid].emit(event, data1, data2, data3, data4);
				}
			}
		}
	};
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
function zufall(a,b) {
	var r=a+Math.floor((Math.random()*(b-a+1)));
    return r;
}

for (var i in SPECIAL_BOARDS){
	BOARDS[ i ] = new BOARD (i, JSON.stringify(SPECIAL_BOARDS[i]));
}

function informUser(uid,event,data1,data2,data3,data4) {
	if (io.sockets.connected[uid]) {
		io.sockets.connected[uid].emit(event, data1, data2, data3, data4);
	}
};

function informAll(event, data1, data2, data3, data4 ){
	for ( var o in USERS ) {
		var sid = USERS[o].get.sid();
		if ( isUser(sid) ) {
			if (io.sockets.connected[sid]) {
				io.sockets.connected[sid].emit(event, data1, data2, data3, data4);
			}
		}
	}
};
