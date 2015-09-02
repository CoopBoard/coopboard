
$(document).ready(function(){
	var a = $('<div class="NUTZER"></div>').appendTo('#settings_board');
	var b = $('<div>Hintergrundfarbe setzen </div>').appendTo(a);
	$('<input type="color">').appendTo(b).on('change',function(){
		background=new _background("C"+this.value,1);
	});
	var b = $('<div>Hintergrundbild setzen:<br>URL: </div>').appendTo(a);
	var c = $('<input id="input_background" type="text">').appendTo(b).on('change',function(){
		background=new _background("I"+this.value,1);
	});
	$('<button id="input_background_submit" class="submit"></button>')
		.appendTo(b)
		.click(function(){
			background=new _background( "I"+$('#input_background').val(),1 );
		});
	var backs = [
		"https://openclipart.org/people/anarres/1392738806.svg",
		"http://gnome-look.org/CONTENT/content-files/74005-aurora.svg",
		"http://gnome-look.org/CONTENT/content-files/96640-simple_blue_widescreen.svg",
		"http://www.debianart.org/cchost/people/canci/canci_-_Debian_Ciel_Theme_Wallpapers.svg",
		"http://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg",
		"http://upload.wikimedia.org/wikipedia/commons/a/ad/BlankMap-World_gray.svg",
		"http://kde-look.org/CONTENT/content-files/128157-BlueCurls.svg",
		"http://kde-look.org/CONTENT/content-files/86115-zeduxosxlikewall3plain.svg",
		"http://kde-look.org/CONTENT/content-files/37708-palm.svg",
		"http://gnome-look.org/CONTENT/content-files/93544-red_acquarius.svg"
	];
	var d = $("<div></div>").appendTo(b);
	$("<button>Beispiele</button>").appendTo(d).click(function(){ $(this).parent().children('div').toggle(); });
	for (var i=0; i<backs.length; i++) {
		$('<div>...'+backs[i].substring(backs[i].length-24,backs[i].length)+'</div>')
			.data('url',backs[i])
			.appendTo(d)
			.css({"font-size":"70%;",display:"none"})
			.click( function(){ $('#input_background').val($(this).data('url')); $('#input_background_submit').click(); } );
	}
});
// ---------------------------------------------------------------------
/**
 * @author bla 
 * @param url beschreibt den link oder die farbe 
 * @param s beschreibt, was passieren soll
 * @class background
 * 
*/

var _background = function(url,s){
	if (url==undefined) url="C#ffffff";
	// Hintergrund an Server senden
	if (s==1) socket.emit('background_set',url);
	// Zuerst das Hintergrundbild entfernen
	$('#background').css('background-color','');
	$('#background>img')
		.css({width:"",height:""})
		.attr('src',"" ).hide();
	$('#background_url').empty();
	var fw=$('#fenster').width();
	var fh=$('#fenster').height();
	var bw=$('#verschieben').width();
	var bh=$('#verschieben').height();
	var board=$('#verschieben');
	var n = $('#background');
	var nw;
	var nh;
	if (url!=undefined && url[0]=="I" ) {
		// set background-image
		this.follow = function( ){
			var p = board.position();
			var x = Math.round( p.left * (fw-nw) / (fw-bw) );
			var y = Math.round( p.top *  (fh-nh) / (fh-bh) );
			n.css({left:x,top:y});
		};
		// Quelle angeben
		$('#background_url').text( url.substr(1) );
		// Eingabefeld belegen
		$('#input_background').val( url.substr(1) );
		$('#background>img')
			.show()
			.css({width:"",height:""})
			.attr('src',url.substr(1) )
			.show()
			.one('load',function(){
				var ix=$(this).width();
				var iy=$(this).height();
				nw = Math.max(fw,ix);
				nh = Math.round(nw*iy/ix);
				if (nh<fh) {
					nh = Math.max(fh,iy);
					nw = Math.round(nh*ix/iy);
				}
				$(this).css({ width:nw,height:nh });
				background.follow();
			});
		
	} else if (url != undefined && url[0]=="C" ) {
		// set background-color
		this.follow = function(){};
		$('#background').css('background-color',url.substr(1) );
		$('#background>img')
			.hide()
			.css({width:"",height:""})
			.attr('src',"" );		
	} else {
		this.follow = function(){};
	}
};
// ---------------------------------------------------------------------
var background=new _background('C#ffffff');
