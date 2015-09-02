
//var socket = io.connect('/');
var socket = io();

// ---------------------------------------------------------------------
// emit-funktionen
// ---------------------------------------------------------------------

// ------------------------ Board --------------------------------------
function boardchange (new_board){	// Boardwechsel bei seitenaufruf 
	$('#board>div.div').remove();
	$('#board>div.zeitleiste').remove();
	$('#board>canvas').remove();
	$('#users_on_board').remove();
	$('#slides').empty();
	$('#texteingabe').remove();
	$('#text').empty();
	//chat
	message_count=0;
	messages = [];
	all_divs = {};
	if (DEBUG > 4) console.log(new_board);
	console.log("Board soll gewechselt werden zu: "+new_board);
	socket.emit('board_change',new_board,last_boards.get_password(new_board) );	
}

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
function open_presentation(a)		{ socket.emit("presentation_open",a); }
function follow_presentation(id) 	{ socket.emit("presentation_connect",id); }
function show_slide(bid,snr)  		{ socket.emit("slide_show",bid,snr); }

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
function set_grid(val)
{
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

// ---------------------------------------------------------------------
// on-funktionen
// ---------------------------------------------------------------------

// ---------------------------- Board ----------------------------------
socket.on('board_added',function(id){
	if (DEBUG > 4) console.log(id+" ist nun verfügbar");
	// Zum neuen Board wechseln
	boardchange(id);
});

socket.on('board_copied',function(id){
	socket.emit(boardchange(id));	
});

socket.on('board_deleted',function(){
	$('#board>div.div').remove();
	$('#board>canvas').remove();
	$('#users_on_board').remove();
	$('#slides').empty();
	$('#texteingabe').remove();
	all_divs ={};
	socket.emit('board_change',"Anleitung",last_boards.get_password("Anleitung") );	
});

socket.on('board_fehlt',function(){
	// alert("Das gewünschte Board ist nicht verfügbar.");
	console.log("Board nicht verfügbar.");
	boardchange("Anleitung");
});

socket.on('freie_boards',function(data){			// Linkliste erstellen und anzeigen
	$('#boards>div').remove();
	visible = 0;
	for(var i =0; i <data.length; i++) {
		if (data[i].name != "Impressum" && data[i].name != "Anleitung"){	// Special Boards nicht doppelt anzeigen
			$("<div onclick= boardchange('"+data[i].id+"')>"+data[i].name+ " <span>"+data[i].id+"</span></div>").appendTo("#boards"); // boardwechsel durch click	
		}								
		if (data[i].id == current_board){			// eigenes Board sichtbar?
			visible = 1;
		}
	}
	set_visibility();
});

socket.on('special_boards',function(data){			// Linkliste erstellen und anzeigen
	$('#special_boards>div').remove();
	for(var i in data) {
		$("<div onclick= boardchange('"+i+"')>"+data[i].NAME+ " </div>").appendTo("#special_boards"); // boardwechsel durch click	
	}
	
});

socket.on('board_changed',function(id,name,recht,snr){
	$('input').val("");
	current_board=id;
	visible = 0;
	board_list();
	board_name=name;
	last_boards.addBoard(id,name);
	r=recht // nur zum debuggen spaeter entfernen !!!
	console.log("recht: "+r );
	$('body').attr('class','');
	if ( recht == 3) 	$('body').attr('class','ADMIN NUTZER');
	if ( recht == 2) 	$('body').attr('class','NUTZER');
	if ( recht <  3)	$('#users_on_board').remove();
	$('#chatelement').addClass('leiste');
	mode_change('block');
	$('#verschieben').css({left: -($('#board').width()-$('#fenster').width())/2, top: -($('#board').height()-$('#fenster').height())/2 });
	if ( presentation.get.following() != false && snr != undefined) { presentation.show_slide(snr); }
	last_boards_update();			// delete board, which not exists
	console.log("board changed to "+name);
});

socket.on('board_exported', function(data){
	if (DEBUG <4) console.log(data);
	var url = "data:application/octet-stream;base64," + Base64.encode(data);
	window.open(url,'_blank');
});

socket.on('board_renamed', function(data){
	var d=JSON.parse(data);
	last_boards.renameBoard(d.id,d.name);
});

socket.on('users_on_board',function(data){
	var d = JSON.parse(data);
	if ( $('#users_on_board').length == 0 ) $("<div id='users_on_board'>Nutzer hier:</div>").appendTo('#settings_coop');
	$('#users_on_board>span').remove();
	for (var i in d) {
		if ( i != socket.id ) $("<span class='info'>"+i+"</span>").appendTo('#users_on_board');
	}
});
	// browser-cache leeren
socket.on('last_boards_updated',function (data){
	for (var i=0; i< data.length; i++){
		if (data[i] != "Anleitung" && data[i]!= "Impressum"){
			last_boards.removeBoard(data[i]);
			if (DEBUG < 4) console.log("soll gelöscht werden: "+data[i]);
		}
	}
});

// ----------------------- Gitterabstand -------------------------------

socket.on ('grid_set',function(dist){
	grid_change(dist);
});

// ----------------------- background ----------------------------------
socket.on('background_set',function(bild){
	if (DEBUG>4) console.log(bild);
	background=new _background(bild);
	if ( bild[0]=="I" ) $('#input_background').val(bild.substr(1));
});

// ------------------------ presentation ------------------------------
socket.on('slide_shown',function(uid,bid,snr){
	if (DEBUG >3) console.log('show_slide '+uid+" "+bid+" "+snr);
	if ( uid != presentation.get.following() ) return false;
	if ( bid != current_board ) { boardchange( bid ); return false; }
	presentation.show_slide( snr );
});

socket.on('followers',function(data){
	presentation.followers(data);
});

socket.on('public_presentations',function(a){
	presentation.show_public_presentations(a);
});

socket.on('following',function(bid,uid,snr,name){
	if ( current_board != bid && bid !== false ) boardchange( bid );
	if ( current_board == bid && bid !== false ) presentation.show_slide( snr );
	if ( bid == false && presentation.get.following() !== false ) { presentation.follow_presentation(false); }
});

		// bei disconnect und reconnect die präsentation wiederaufnehmen!
socket.on('disconnect', function (){
	if (presentation.get.following() !== false){
		alert('Master ist nicht erreichbar!');
		
		console.log(presentation.get.following());
	}
});
// ------------------------- Chat --------------------------------------
// neue einzelne Nachricht
socket.on('chat', function (data,uid) {
	stored_messages.push(data);
	messages.push(data);
	message_count++;
	message_sort();
	if (sound ==true){
		if (data.name != "Statusmitteilung"&& uid != socket.id ) receive_audio.play();
		else if (uid == socket.id) send_audio.play();
	}
});
// Daten überschreiben bspw. neues Board
socket.on('messages_received',function(data){
	$('#text').empty();
	chat_leiste.empty();
	messages = data;
	message_count=0;
	if ($('#text').hasClass("chat")){
		chat_switch();
	}
	message_sort();
});

// Username
socket.on('username_set', function (data){ 
	console.log("Name gesetzt: "+data);
	identity.set_name(data);
	NAME=data;
	$('#chatname').val(NAME);
});


// --------------------- slides update and delete -------------------- 
socket.on('element_changed', function(data) { element_changed(data); });
socket.on('element_removed', function(data) { element_removed(data); });


// ---------------- div,slide,timeline import -------------------------------

socket.on('div_setzen',function(){							// divs und folien übertragen
	var tmp = anders.shift();
	if (tmp == undefined){ 	// wenn kein weiteres element da, signal an server zum verbinder uebertragen
		verbinder_setzen();
	}
	else if (tmp.id[0]=="d"){
		socket.emit('div_import',JSON.stringify( {	// Divs zur veraederung an server senden
			id:tmp.id,							// evtl. veraendern!
			content:tmp.content,
			pos:tmp.pos,
			hoehe:tmp.hoehe,
			breite:tmp.breite,
			farbe:tmp.farbe,
			textcolor:tmp.textcolor,
			fontsize: tmp.fontsize,
			canvas:tmp.canvas,
			blockiert:0,
			appendto: tmp.appendto
		}));
	}
	else if(tmp.id[0]=="s"){
		socket.emit('slide_import',JSON.stringify( {	// Slides zur veraenderung an server senden
			id:tmp.id,
			pos:tmp.pos,
			hoehe:tmp.hoehe,
			breite:tmp.breite,
			blockiert:0
		}));
	}
	socket.emit("divs_einlesen");
});
// Verbinder delete
socket.on("verbinder_deleted",function (data){
	$("#"+data).remove();
});

// ---------------------- Eigene ID ------------------------------------
socket.on('your_id', function (data) {
	socket.id=data;
});
// ------------------- Create a new socket connection ------------------
socket.on('connect', function() {
	if (DEBUG <4) console.log("current_board: "+current_board);
	//users[ socket.id]={board:"Anleitung"};
	if (current_board != undefined){			// Bugfix
		boardchange(current_board);				// Ansonsten nach reconnect nicht aus serversicht auf board 
	}
	// reconnect to following presentation
	if (presentation_following_id!== false){
		socket.emit("presentation_connect",presentation_following_id);
	}
	if (presentation_master == true){
		presentation.open(undefined,'pm',slide_nr);	// Slidenummer noch speichern
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

socket.on("board_get",function(bid){
	console.log("das letzte Board war "+bid);
	boardchange(bid);
});

socket.on('id_set',function(data){
	ID = data;
	if (current_board == undefined){ // ansonsten boardchange bereits durchgeführt
		var url = window.location.search.substring(1);
		if (url=="") url="Anleitung";
		current_board=url;
		console.log("current_board gesetzt auf: "+current_board+" url ist: "+url);
		socket.emit('board_recover',url,last_boards.get_password(url));	
	}
});

// ----------------------- DEBUGGING -----------------------------------

socket.on('debug', function(d1,d2,d3,d4){
	console.log("debug: "+d1+" "+d2+" "+d3+" "+d4);
});
