var message_count = 0;	
var chat_timeout;
var messages =[];
var stored_messages=[];	// puffer zum hinzufügen
var chat_leiste=$('#text');
var chat_switchblock=0;
var send_audio = document.createElement('audio');
    send_audio.setAttribute('src', 'beep-1.mp3');
var receive_audio = document.createElement('audio');
    receive_audio.setAttribute('src', 'beep-2.mp3');

$('#sofort_antwort').hide();

$(document).ready(function(){
	chat();
	$('#chatelement').click(function(){		// sonst switch bei click auf gesamten block
		if($('#chatelement').hasClass('leiste')){
			chat_switch();
		}
	});
});

function antwort_ausblenden(){
	$('#antwort').show();
	$('#sofort_antwort').hide().removeClass('activ');
}

function chat(){
	x_move(-2);	// laufschrift der leiste aktivieren
	message_count=0;	
	$('#chat_input').keypress(function (e) {	// Nachricht senden mit der Enter-Taste
		if (e.which == 13) {
			send_message($('#chat_input').val());
		}
	});
					$('#sofort_antwort').keypress(function (e) {	// Nachricht senden mit der Enter-Taste
					if ($('#sofort_antwort').hasClass('activ')){
						if (e.which == 13) {
							var text= $('#sofort_antwort').val()
							send_message(text);
							$('#antwort').show();
							$('#sofort_antwort').hide().removeClass('activ');
						}
					}
				});	
}
/**
 * sendet Nachricht
 * */	
 	
function send_message(text){
	if (text == undefined){text = $('#chat_input').val(); }
	if (text!= "") {
		if (NAME != $('#chatname').val()){
			socket.emit('username_set',$('#chatname').val());
		}
		$('#chat_input').val('');
		$('#sofort_antwort').val('');
		setTimeout(function(){socket.emit('chat', { name: NAME, text: text });}, 500);
		
	}
}
	
/** textleiste bewegen	
 *  @param value Der Wert, um den sich die Leiste nach links bewegt
 * 
*/	
function x_move(value){
	/*if (chat_leiste.position().left > -$(window).width()/2 ){
		chat_leiste.css({left: "+="+value});
	}else{
		//console.log(chat_leiste.position().left);
		chat_leiste.css({left: $(window).width()});
	}*/
	// nachrichten anpassen
	//var d=stored_messages.pop();
	/*while(d!=undefined){
		message_add(d);
		d=stored_messages.pop();
	}*/
	if (message_count>5){
		message_delete();
	}
	$('#text').css({'right':'0', 'left':'auto'},1);
	
	clearTimeout(chat_timeout);
	chat_timeout  = setTimeout(function(){x_move(value)}, 50);
}
/**
 * @author sabrina
 * @param d JSON, welches Nachricht und Zeit enthält
 * */		
function message_add(d){ 
	var zeit = new Date(d.zeit);
	var html_nachricht=$('<div>')
		.append($('<span class="time">').text((zeit.getDate()< 10 ? '0' + zeit.getDate() : zeit.getDate())+"."
			+(zeit.getMonth()+1< 10 ? '0' + (zeit.getMonth()+1) : (zeit.getMonth()+1))
			//+"."+(zeit.getFullYear())
			+" - "
			+(zeit.getHours() < 10 ? '0' + zeit.getHours() : zeit.getHours())+ ':' 
			+(zeit.getMinutes() < 10 ? '0' + zeit.getMinutes() : zeit.getMinutes())
			),
			$('<span class="name">').text(d.name+": "),
			$('<span class="text">').text(d.text+" ")
		);
	html_nachricht.appendTo("#text");

	// nach unten scrollen
	if($('#chatelement').hasClass('chat')){
		$('#text').scrollTop($('#text')[0].scrollHeight);	
	}
	//leiste weiterbewegen !!! in move()
	/*else{
		if (message_count>10){
			message_delete();
		}
		$('#text').animate({'right':'0', 'left':'auto'},1);
	}*/
	message_count++;
	
	if (message_count>10){
		message_delete();
	}
}
		
/**
 * @param b_change 1 wenn durch boardchange ausgelöst
 * 0 sonst
 * 
 * */
 
function message_delete(b_change){
	if(message_count == 10 && $('#text').hasClass('leiste')){
		$('#text>div')[0].remove();
		message_count--;
		if (DEBUG >4)console.log("nachricht gelöscht");	
	//	clearTimeout(delete_timeout);
	//	var delete_timeout = setTimeout(function(){message_delete()},10);
	}
	if(b_change ==1 && message_count > 10 && $('#text').hasClass('leiste')){
		$('#text>div')[0].remove();
		message_count--;
		if (DEBUG >4)console.log("nachricht gelöscht");	
		clearTimeout(delete_timeout);
		if (message_count>5){
			var delete_timeout = setTimeout(function(){message_delete(1)},10);
		}
	}
}

/** Nachrichten werden sortiert und in richtiger Reihenfolge angezeigt
*/

function message_sort(){ 
	message_count=0;
	for (var i =0; i < messages.length-1; i++){
		for (var j = i + 1; j < messages.length; j++){
			if (messages[j].zeit < messages[i].zeit){
				var tmp = messages[i];
				messages[i] = messages[j];
				messages[j] = tmp;
				j=1;
				i=0;
			}
		}
	}
	// Nachrichten neu anzeigen
	$('#text').empty();
	if($('#text').hasClass('chat')){
		for(var i=0;i<messages.length;i++){
			message_add(messages[i]);
		}
	// von chat zur leiste
	}else{
		if (messages.length >5){
			for(var i=messages.length-4 ;i<messages.length;i++){
				message_add(messages[i]);
				message_count++;
			}	
		}
		else{ 	
			for(var i=0;i<messages.length;i++){
				message_add(messages[i]);
				message_count++;
			}
		}
	}
}

/**
 * ändert Ansicht des Chatelements
 * @author sabrina
 * 
 * */
function chat_switch(){
	if (chat_switchblock != 0) return false;
	$('#text').empty();
	message_count=0;
	
	$('#chatelement, #text').toggleClass('leiste').toggleClass('chat');
	$('body').toggleClass('chat');
	
	message_sort(); 
	// von leiste zur chatansicht switchen
	if($('#text').hasClass('chat')){
		clearTimeout(chat_timeout);
		$('#text').css({left:0});
		$('#chatname').val(NAME);
	// von chat zur leiste
	}else{
		x_move(-2);
	}
	
	chat_switchblock = 1;
	setTimeout(function(){ chat_switchblock=0; },100);
	antwort_ausblenden();
}
