

$(document).ready(function(){
	presentation = new _presentation();
});

// ---------------------------------------------------------------------
var _presentation = function(){
	var P = this;
	var blocked = false;
	var public  = false;
	var _following = false;
	var wx = $('#fenster').width();
	var wy = $('#fenster').height();

	var start_position = $('#board').position();
	var menu = $('<div></div>')
		.appendTo('#settings_coop');
	var button_open = $('<button>offene Präsentation</button>')
		.appendTo(menu)
		.click2( function (){
			$( button_open ).toggleClass('on');
			P.open();
		});
	var menu_public = $('<div>Öffentliche Präsentationen</div>').insertAfter(menu);
	// -----------------------------------------------------------------
	this.get = {};
	this.get.following = function(){ return _following; }
	// -----------------------------------------------------------------
	this.set = {};
	this.set.following = function (f){ _following = f; }
	// -----------------------------------------------------------------
	this.open = function(a,modus,snr) {
		if (modus!="pm"){	//alte funktion
			if ( a==undefined ) { public = !public; } else { public = a; }
			if ( public==true ) { 
				$( button_open ).addClass('on'); 
				presentation_master = true;
			} else { $( button_open ).removeClass('on'); presentation_master=false; }
			open_presentation( $( button_open ).hasClass('on') );
		}
		else{				// reconnect
			if (snr==undefined) snr=0;
			open_presentation(true,"reconnect",snr);
			//slide_nr = snr;
			//P.show_slide(snr);
		}
	}
	// -----------------------------------------------------------------
	this.follow_presentation = function( id ){
		_following = id;
		presentation_following_id= _following;
		follow_presentation(id);
		if ( id == false ) { P.show_slide(-1); }
	};
	this.followers = function(a) {
		var d = JSON.parse(a);
		menu.children('span').remove();
		if (d!=false) {
			for (var i in d) {
				$("<span>"+d[i]+"</span>").css({ position:"static",display:"block" }).appendTo( menu );
			}
		}
	}
	this.show_public_presentations = function(a) {
		console.log(a);
		menu_public.children('button').remove();
		var d=JSON.parse(a);
		for (var i in d) {
			if ( i != socket.id ) {
				var b=$('<button>'+d[i].board_name+'<span>'+i+'</span></button>')
					.appendTo(menu_public)
					.css({display:'block',width:'100%'})
					.data('id',i)
					.click(function(){
						if ( P.get.following() == $(this).data('id') ) { $(this).removeClass('on'); P.follow_presentation(false); return false; }
						$(this).siblings().removeClass('on');
						$(this).addClass('on');
						P.follow_presentation($(this).data('id') );
						P.controlls( true );
					});
				if ( i == P.get.following() ) b.addClass('on');
			}
		}
	}
	// -----------------------------------------------------------------
	$('#praesentation_next1, #praesentation_next')
		.click2(function(platzhalter,e){
			e.stopPropagation();
			P.forward();
		});

	$('#praesentation_back')
		.click2(function(platzhalter,e){
			e.stopPropagation();
			P.backward();
		});

	// -----------------------------------------------------------------
	this.controlls = function(a){
		if ( a === true ) {
			$('body').addClass('praesentation');
			// Sensible Flächen zeigen
			$('#praesentation_next>div,#praesentation_back>div').show().fadeOut(5000);
			// Tasten belegen
			if ( typeof(Mousetrap)=="object" ) {
				Mousetrap.bind(['space','right'], function(e){    e.preventDefault(); P.forward(); });
				Mousetrap.bind(['backspace','left'], function(e){ e.preventDefault(); P.backward(); });
				Mousetrap.bind('escape', function(){ P.show_slide(-1); });
			}
			start_position = $('#verschieben').position();
		} else {
			$('body').removeClass('praesentation');
			if ( typeof(Mousetrap)=="object" ) {
				Mousetrap.unbind(['space','backspace','left','right','escape']);
			}
		}
	}
	// -----------------------------------------------------------------
	this.forward = function() {
		// Neue Präsentation starten?
		if ( $('#slides>div.slide.aktiv').length==0 ) {
			this.controlls(true); // show controlls
			slide_nr=0;
			this.show_slide(0); // show first slide
		} else {
			slide_nr=$('#slides>div.slide.aktiv').index()+1;
			this.show_slide( $('#slides>div.slide.aktiv').index()+1 );
		}
	}
	// -----------------------------------------------------------------
	this.backward = function(){
		slide_nr=$('#slides>div.slide.aktiv').index()-1;
		this.show_slide( $('#slides>div.slide.aktiv').index()-1 );
		event.preventDefault();
	}
	// -----------------------------------------------------------------
	// zooms to active slide with class aktiv
	// else: stop presentation mode
	this.show_slide = function (n) {
		if ( n == undefined ) n = 0;
		// Wenn öffentliche Präsentation, so zum Server melden
		if ( public === true ) show_slide(current_board,n);
		$('#slides>div.slide').removeClass('aktiv');
		$($('#slides>div.slide')[n]).addClass('aktiv');
		// -------------------------------------------------------------
		// zoom to activ slide
		if ( $('#slides>div.slide.aktiv').length==1 ) {
			// ---------------------------------------------------------	
			var sw = $('#slides>div.slide.aktiv').width();
			var sh = $('#slides>div.slide.aktiv').height();
			var scale = Math.min( wx / sw , wy /sh );
			var lo_x = Math.round( -$('#slides>div.slide.aktiv').position().left * scale + (wx-sw*scale)/2 );
			var lo_y = Math.round( -$('#slides>div.slide.aktiv').position().top  * scale + (wy-sh*scale)/2 );
			var board = $('#board');
			
			if ( $('body').hasClass('praesentation') == false ) P.controlls( true );

			// get old scaling
			var scale_old = 1;
			var pos_old_x = $('#background').position().left;
			var pos_old_y = $('#background').position().top;
			var pos_x     = $('#slides>div.slide.aktiv').position().left;
			var pos_y     = $('#slides>div.slide.aktiv').position().top;
			if ( $('#board').css('transform') != undefined && $('#board').css('transform') != "none" ) {
				// -----------------------------------------------------
				// Alter Scale-Faktor kann ermittelt werden -> Animation
				scale_old = Number($('#board').css('transform').match(/\(.*\)/)[0].split(',')[0].replace(/\(/,""));
				var v = $('#verschieben')
				$('#verschieben').animate({
					top:  lo_y,
					left: lo_x,
				},{
					easing: "linear",
					progress:function(a,b,c){
						board.css({
							"transition":"none",
							"transform-origin":"0 0 0",
							"transform":"scale("+((scale*b+scale_old*(1-b)))+")"
						});
						background.follow();
					},
				});
			} else {
				// -----------------------------------------------------
				// Alter Scale-Faktor kann nicht ermittelt werden, also keine Animation
				$('#verschieben').css({
					top:  lo_y,
					left: lo_x,
				});
				board.css({
					"transition":"none",
					"transform-origin":"0 0 0",
					"transform":"scale("+scale+")"
				});
				background.follow();
			}
		} else {
			// ---------------------------------------------------------
			// Wieder zurück zur Normalansicht
			$('#board').css({
				"transition":"none",
				"transform-origin":"0 0 0",
				"transform":"scale(1)",
			});
			$('#verschieben').css({
				top:  start_position.top,
				left: start_position.left
			});
			P.controlls(false);
		}
	}
};

function slide_shown(uid,bid,snr){
	if (DEBUG >3) console.log('show_slide '+uid+" "+bid+" "+snr);
	if ( uid != presentation.get.following() ) return false;
	if ( bid != current_board ) { boardchange( bid ); return false; }
	presentation.show_slide( snr );	
}

function followers(data){
	presentation.followers(data);
	followers = data;
}

function following_set(uid){	// wiederverbinden mit 'verlorener presentation'
	presentation.follow_presentation( uid );
	presentation.controlls( true );
}

function following(bid,uid,snr,name){
	if ( current_board != bid && bid !== false ) boardchange( bid );
	if ( current_board == bid && bid !== false ) presentation.show_slide( snr );
	if ( bid == false && presentation.get.following() !== false ) { presentation.follow_presentation(false); }
}

