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
	socket.emit('board_change',new_board,last_boards.get_password(new_board) );	
}

function board_added(id){
	if (DEBUG > 4) console.log(id+" ist nun verfügbar");
	// Zum neuen Board wechseln
	boardchange(id);
}

function board_deleted(){
	$('#board>div.div').remove();
	$('#board>canvas').remove();
	$('#board>div.zeitleiste').remove();
	$('#users_on_board').remove();
	$('#slides').empty();
	$('#texteingabe').remove();
	all_divs ={};
	boardchange("Anleitung");
	//socket.emit('board_change',"Anleitung",last_boards.get_password("Anleitung") );	
}

function board_fehlt(){
	// alert("Das gewünschte Board ist nicht verfügbar.");
	console.log("Board nicht verfügbar.");
	boardchange("Anleitung");
}

// Linkliste erstellen und anzeigen
function freie_boards(data){
	$('#boards>div').remove();
	visible = 0;
	for(var i =0; i <data.length; i++) { //special boards haben visibility:0
		$("<div onclick= boardchange('"+data[i].id+"')>"+data[i].name+ " <span>"+data[i].id+"</span></div>").appendTo("#boards"); // boardwechsel durch click								
		if (data[i].id == current_board){			// eigenes Board sichtbar?
			visible = 1;
		}
	}
	set_visibility();	
}

// Linkliste erstellen und anzeigen
function special_boards(data){	$('#special_boards>div').remove();
	for(var i in data) {
		$("<div onclick= boardchange('"+i+"')>"+data[i].NAME+ " </div>").appendTo("#special_boards"); // boardwechsel durch click	
	}
}

function board_changed(id,name,recht,snr){
	$('input').val("");
	current_board=id;
	visible = 0;
	board_list();
	board_name=name;
	last_boards.addBoard(id,name);
	r=recht // nur zum debuggen spaeter entfernen !!!
	$('body').attr('class','');
	if ( recht == 3) 	$('body').attr('class','ADMIN NUTZER');
	if ( recht == 2) 	$('body').attr('class','NUTZER');
	if ( recht <  3)	$('#users_on_board').remove();
	$('#chatelement').addClass('leiste');
	mode_change('block');
	$('#verschieben').css({left: -($('#board').width()-$('#fenster').width())/2, top: -($('#board').height()-$('#fenster').height())/2 });
	if ( presentation.get.following() != false && snr != undefined) { presentation.show_slide(snr); console.log("slidenummer: "+snr);}
	last_boards_update();			// delete board, which not exists
}

function board_exported(data){
	if (DEBUG <4) console.log(data);
	var url = "data:application/octet-stream;base64," + Base64.encode(data);
	window.open(url,'_blank');
}

function board_renamed(data){
	var d=JSON.parse(data);
	last_boards.renameBoard(d.id,d.name);
}

function board_recovered(bid){	// bei reconnect sollen board und präsi wiederhergestellt werden
	boardchange(bid);
	//socket.emit("presentation_reconnect");	
	//presentation reconnect
	if (presentation_following_id != false){
		socket.emit("presentation_connect",presentation_following_id);
	}
	if (presentation_master == true){
		presentation.open(undefined,'pm',slide_nr);	
	}
}

function users_on_board(data){
	var d = JSON.parse(data);
	if ( $('#users_on_board').length == 0 ) $("<div id='users_on_board'>Nutzer hier:</div>").appendTo('#settings_coop');
	$('#users_on_board>span').remove();
	for (var i in d) {
		if ( i != socket.id ) $("<span class='info'>"+i+"</span>").appendTo('#users_on_board');
	}	
}
