// ---------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------


// verhinderung von click UND touchstart 
// ---------------------------------------------------------------------
$.fn.click2 =  function(f){
	var _clicked = false;
	$(this).on("mousedown touchstart",function(e){
		if ( _clicked == true ) return $(this);
		_clicked = true;
		setTimeout(function(){ _clicked=false; },500);
		f(this,e);
		return $(this);
	});
	return $(this);
}

// ---------------------------------------------------------------------
function draggen(){
	$('#verschieben').draggable("destroy");
	$('#verschieben').draggable({
		drag:function(){ if (typeof(background.follow=="function")) background.follow();}
	});  
}

// ---------------------------------------------------------------------	  
function isClicked(o) {
	if ( $(o).data('__clicked')==1 ) return true;
	var O=$(o);
	O.data('__clicked',1);
	setTimeout(function(){ O.data('__clicked',0); },500);
}

// soundfunktion schaltet symbol und sound um
$(function() {
    $("#mute").click(function(e) {
        e.preventDefault();

        if (sound==false){
            sound=true;
            document.getElementById("mute").src = "audio-volume-medium-symbolic.svg";
        }else{
            sound=false;
            document.getElementById("mute").src = "audio-volume-muted-symbolic.svg";
        }
        });
});


$(function() {
   	$('div.flipswitch').on('click',function(e){
        e.preventDefault();
		if (visible == 0){
			board_freigeben(1);
		}
		else{
			board_freigeben(0);
		}
	});
});
  

function freigeben(){
	if (visible == 0){
		board_freigeben(1);
	}
	else{
		board_freigeben(0);
	}
}



function set_visibility(){
	if (DEBUG > 4) console.log("set visibility");
	if (visible == 0){
		$('div.flipswitch').toggleClass('off');
		$('div.flipswitch').text($('div.flipswitch').data('off'));
	}else if (visible == 1){
		$('div.flipswitch').text($('div.flipswitch').data('on'));
		$('div.flipswitch').toggleClass('off');
	}
	
			/*if (wert==0 ) {
			wert=1;
			if ( $('div.flipswitch').text() == $('div.flipswitch').data('on') ){
				$('div.flipswitch').toggleClass('off');
				$('div.flipswitch').text($('div.flipswitch').data('off'));
			}
		} else if (wert ==1 ){
			wert=0;
			if( $('div.flipswitch').text() == $('div.flipswitch').data('off')){
			$('div.flipswitch').text($('div.flipswitch').data('on'));
			$('div.flipswitch').toggleClass('off');
		}
	}
}*/
}
//----------------------- Block- or Slidemode
function mode_change(mode){
	//set body classes
	if (mode == undefined){
		if ($('body').hasClass('blockmode')){
			$('body').removeClass('blockmode').addClass('slidemode');
		}else{
			$('body').removeClass('slidemode').addClass('blockmode');
		}
	}else{
		if (mode == 'block'){
			$('body').removeClass('slidemode').addClass('blockmode');			
		}else if (mode=='slide'){
			$('body').removeClass('blockmode').addClass('slidemode');
		}
	}
	// change textvalue
		if ($('body').hasClass('blockmode')){
			$('#modechange').text('Folienmodus');
		}else{
			$('#modechange').text('Blockmodus');
		}
}

function set_ruler(){
// GItter am rand neu setzen
}


(function($){
    $.fn.block = function(){
		if ( this.data('blocked')==1 ) return false;
		this.data('blocked',1);
		var e = this;
		setTimeout( function(){
			e.data('blocked',0); 
		},500 );
		return true;
    }
 })(jQuery);
