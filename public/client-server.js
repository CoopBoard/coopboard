
var socket = io();

// ---------------------------------------------------------------------
// emit-funktionen
// ---------------------------------------------------------------------

// ------------------------ Board --------------------------------------
function new_board ()				{ socket.emit('board_add'); }
function copy_board()				{ socket.emit('board_copy');}
function delete_board()				{ socket.emit('board_delete');}
function board_list() 				{ socket.emit('freie_boards'); }
function board_export() 			{ socket.emit('board_export'); }
function set_boardname(b_name)		{ socket.emit('bname_set', b_name); }
function board_freigeben(a)			{ socket.emit("visibility_set",a); }

// ------------------------------ Chat ---------------------------------
function receive_messages(bid)		{ socket.emit("messages_receive",bid);}		//ggf um nachrichten eines boards auszutauschen

// ---------------------- Praesentation --------------------------------
function open_presentation(a,reconnect,snr)	{ socket.emit("presentation_open",a,reconnect,snr); }
function follow_presentation(id) 			{ socket.emit("presentation_connect",id); }
function show_slide(bid,snr)  				{ socket.emit("slide_show",bid,snr); }

// ---------------------------------------------------------------------
// Passwortfunktionen
function set_passwd(gruppe,pw){
	var confirm_passwd=pw;
	var group = gruppe;
	var dialog = $('<form id="password-confirm"><input type="password" autofocus><input type=submit value="ändern"></form>').dialog({
		modal:true,
		resizeable:false,
		closeText:"",
		dialogClass: "password",
		title:"Passwort bestätigen",
		close: function( event, ui ) { $(this).dialog("destroy"); }
	});
	$('#password-confirm').on("submit",function(e){
		e.preventDefault();
		if ( $(this).children('input').val()==confirm_passwd ) {
			socket.emit('password_set',[group,confirm_passwd]);
			dialog.dialog("destroy");
		} else {
			alert('Passwörter stimmen nicht überein. Bitte wiederholen!');
		}
	});
}

// Gitterabstand für Divs etc.
function set_grid(val){
	document.getElementById("grid").innerHTML=val;
	socket.emit("grid_set",val);
}
// noch nicht eingebaut (Gitter am äußeren rand des boards)
function grid_change(dist){
	if (DEBUG>4) console.log(dist);
	grid_distance = dist;
	document.getElementById("grid").innerHTML=dist;
	$('#grid_range').val(dist);
	//set_ruler(); // noch nicht definiert
}
// ------------------------- DIV ---------------------------------------

function element_changed(d) {
	if (DEBUG>3) console.log("element_changed:", d);
	if (d.id == undefined) return;
	var O = all_divs[d.id];
	// das Objekt existiert noch nicht
	if ( O==undefined ) {
		if (d.id[0]=='d'){
			if (d.appendto != undefined){
				d.canvas[d.appendto]=1;
				if (DEBUG < 4) console.log("Div wird an Zeitleiste: "+d.appendto+" gehängt.");
			}
			O = new div( d.id,d.appendto );
			all_divs[d.id] = O;
		}
		else if (d.id[0]=='s'){
			O = new slide (d.id);
			all_divs[d.id] = O;
		}
		else if (d.id[0]=='t'){
			O = new timeline (d.id);
			all_divs[d.id] = O;
		}
	}
	for (var i in d) {	
		if (i != 'appendto')		// hier wird timeline übergeben... 
			O.set[i](d[i]); 
	}
}
// ---------------------------------
function element_removed( id ){
	if ( DEBUG>4 ) console.log('element_removed: ', id);
	var d = all_divs[id];
	if ( d == undefined ) { return false; }
	d.remove();  		  // HTML-Objekt löschen
	
	if( id[0]=='d'||id[0]=='t'){	//Verbinder löschen
		var c = d.get.canvas();			
		for (var i in c){
			all_divs[i].delete_canvas( id );
		}
	} else if( id[0]=='s' ){		// bei Slides neu nummerieren
		all_divs[ id ].nummerierung();
	}
	delete all_divs[id]; // Objekt löschen	
}

// cache leeren
function last_boards_update(){
	socket.emit('last_boards_update',last_boards.boards);
}

// ---------------------------------------------------------------------
// on-funktionen
// ---------------------------------------------------------------------

// ---------------------------- Board ----------------------------------
socket.on('board_added',	function( id )				{ board_added(id);			});
socket.on('board_copied',	function( id )				{ boardchange(id);			});
socket.on('board_deleted',	function(    )				{ board_deleted();			});
socket.on('board_fehlt',	function(    )				{ board_fehlt();			});
socket.on('freie_boards',	function(data)				{ freie_boards(data);		});			
socket.on('special_boards',	function(data)				{ special_boards(data);	});	
socket.on('board_changed',	function(id,name,recht,snr)	{ board_changed(id,name,recht,snr);});
socket.on('board_exported', function(data)				{ board_exported(data);		});
socket.on('board_renamed', 	function(data)				{ board_renamed(data);		});

socket.on('users_on_board',	function(data)				{ users_on_board(data);		});


// ----------------------- Local storage -------------------------------
// browser-cache leeren (local-storage.js)
socket.on('last_boards_updated',function (data){ last_boards_updated(data);});


// ----------------------- Gitterabstand -------------------------------
socket.on ('grid_set',function(dist){ grid_change(dist);});

// ----------------------- background ----------------------------------
socket.on('background_set',function(data){ background_set(data);});


// ------------------------ presentation -------------------------------
socket.on('slide_shown',			function(uid,bid,snr)		{ slide_shown(uid,bid,snr);});
socket.on('followers',				function(data)				{ console.log(data);followers(data);});
socket.on('public_presentations',	function( a  )				{ presentation.show_public_presentations(a);});
socket.on('following',				function(bid,uid,snr,name)	{ following(bid,uid,snr,name);});
socket.on('following_set',			function(uid)				{ following_set(uid);});

socket.on('presentation_reconnected',function(snr)				{presentation.show_slide(snr);});

// ------------------------- Chat --------------------------------------
// neue einzelne Nachricht
socket.on('message_added',	 	function (data,uid) { message_added(data,uid);});
socket.on('messages_received',	function (data)		{ messages_received(data);});


// Username
socket.on('username_set', 		function (data)		{ username_set(data);});


// --------------------- slides update and delete -------------------- 
socket.on('element_changed', function(data) { element_changed(data); });
socket.on('element_removed', function(data) { element_removed(data); });


// ---------------- div,slide,timeline import -------------------------------
socket.on("verbinder_deleted",function (data){ $("#"+data).remove(); });

// ---------------------- Eigene ID ------------------------------------
socket.on('your_id', function (data) { socket.id=data; });

// ------------------- Create a new socket connection ------------------
socket.on('connect', function() {
	$('#board').css({
				"transition":"none",
				"transform-origin":"0 0 0",
				"transform":"scale(1)",
			});
			
	if (DEBUG <4) console.log("current_board: "+current_board);
	users[ socket.id]={board:"Anleitung"};
	if (current_board != undefined){			// Bugfix
		boardchange(current_board);				// Ansonsten nach reconnect nicht aus serversicht auf board 1
	}
	//name to server
	NAME=identity.get_name();
	if (NAME == "") NAME = 0;
	socket.emit('username_set',NAME);
	// ID to server
	ID = identity.get_id();
	if (ID =="") {			// bei neuanlegung speichert server automatisch
		ID = socket.id;
		identity.set_id(ID);
	}
		console.log("id_set: "+ID);
		socket.emit('id_set',ID);	
});

socket.on("board_recovered",function(bid) {	board_recovered(bid); });
socket.on('id_set',			function(data){ id_set(data);});

// bei disconnect und reconnect die präsentation wiederaufnehmen!
socket.on('disconnect', function (){
	if (presentation.get.following() !== false){
		alert('Master ist nicht erreichbar!');
	}
});

// ----------------------- DEBUGGING -----------------------------------
socket.on('debug', function(d1,d2,d3,d4){ console.log("debug: "+d1+" "+d2+" "+d3+" "+d4); });
