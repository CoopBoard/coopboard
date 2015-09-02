	
var slide = function(id){
	var o = this;
	var blockiert = 0;
	var free = function () { if ( blockiert == 0 || blockiert == socket.id ) return true; return false };
	o.id=id;
	var obj = $('<div><div class="handle oben_links"></div></div>')
		.appendTo('#slides')
		.addClass('slide')
		.css({
			top:  Math.round( -$('#board').position().top +$(window).height()/2-240 ),
			left: Math.round( -$('#board').position().left+$(window).width() /2-320 )
		})
		.draggable({ 
			handle: ".oben_links",
			start: function(e,u){ block( socket.id ); },
			stop: function(e,u){emit(['pos']);block( 0 );},
			//grid:[grid_distance,grid_distance],
			drag: function( event, ui ) {
				if (grid_distance > 0){
					ui.position.top  = ui.position.top  - ui.position.top  % grid_distance;
					ui.position.left = ui.position.left - ui.position.left % grid_distance;
				}
			}
		})
		.resizable({
			resize: function( event, ui ) {
				if (grid_distance >0){
					ui.size.width = ui.size.width - ui.size.width % grid_distance;
					ui.size.height = ui.size.height - ui.size.height % grid_distance;
				}
			},
			//grid:[grid_distance,grid_distance],
			handles: 'se',
			minWidth: 200,
			minHeight:100,
			start: function(e,u){ block( socket.id ); },
			stop: function(e,u) {
				console.log('breite: '+$(this).width()+'hoehe: '+$(this).height());
				emit(['hoehe','breite']);
				block( 0 );
			}
		});
	$('<div class="handle oben_rechts remove"></div>')
		.appendTo( obj )
		.click2(function(){
			socket.emit('element_remove',o.id);
			o.nummerierung();
		});
	// -------------------------------------------------------------
	// Nummerierung aller Slides
	this.nummerierung = function(){
		$('#slides>div.slide>span').remove();
		$('#slides>div.slide').each(function(i,v){ $('<span>'+(i+1)+'</span>').appendTo( v ); });
	}
	o.nummerierung();
	// -------------------------------------------------------------
	// Funktionen zum Setzen
	this.set={};
	this.set.id		 		= function (i) { obj.id=i; return o; }
	this.set.pos     		= function (p) { obj.css(p);  return o;};
	this.set.hoehe   		= function (h) { obj.css('height',h);  return o;};	//Hoehe des Divs setzen
	this.set.breite  		= function (b) { obj.css('width',b);   return o;};	//Breite des Divs setzen
	this.set.blockiert		= function (i) {
		blockiert = i;
		if ( free() ) {
			obj.draggable('enable');
			obj.resizable('enable');
			obj.removeClass('blocked');
		} else {
			obj.draggable({ disabled: true });
			obj.resizable({ disabled: true });
			obj.addClass('blocked');
		}
		return this;
	};
	// -------------------------------------------------------------
	// Funktionen zum Erhalten
	this.get={};
	this.get.id		 		= function (){ return o.id; } // Die ID lässt sich nicht ändern. Nur aufgenommen, um keine Fehler zu erhalten.
	this.get.pos	 		= function (){ return obj.position(); }
	this.get.hoehe	 		= function (){ return obj.height(); }
	this.get.breite	 		= function (){ return obj.width(); }
	this.get.blockiert		= function (){ return blockiert; }
	// -------------------------------------------------------------
	// 
	this.remove = function () { obj.remove(); };
	function emit(was){
		var r={};
		if ( was == undefined ) {
			for (var i in o.get) {	r[i]=o.get[i](); }
		} else {
			was.push('id');
			for (var i=0; i< was.length; i++) {
				r[ was[i] ]=o.get[ was[i] ](); 
			}
		}
		socket.emit('element_change', JSON.stringify( r ) );
	};
	function block( id ){	// blockiert slide
		o.set.blockiert( id );			// id des nutzers blockiert objekt
		emit( ['blockiert'] );
	}	
};

// ---------------------------------------------------------------------
// funktionen außerhalb des objektes
// ---------------------------------------------------------------------
function new_slide(){
	socket.emit('element_change',JSON.stringify( {
		id:"s",
		pos:{
			left: -$('#verschieben').position().left+$(window).width()/2-320,
			top:  -$('#verschieben').position().top+$(window).height()/2-240
		},
		hoehe:480,
		breite:640,
		blockiert:0
	  })
	);
}
