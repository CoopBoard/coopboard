$('#new_timeline')
.click2(function(){ 	
	new_timeline();
})

var timeline = function( id ) {
	// Konstanten	
	var content 	= "<hr>";		// Inhalt des Textfeldes
	var hoehe		= 50;
	var fontsize 	= 18; 
	var convert 	= new Markdown.Converter().makeHtml; //erzeugt Markdown to Html Konvertierfunktion
	var canvas 		= {}; // Hier werden alle Verbindungen drin gespeichert
	
	var O = this;
	O.id = id;
	var blocked = 0;
	var clicked=false;

	// -----------------------------------------------------------------
	function is_clicked(){	// warum nicht auf .click2 zurückführbar ???
		if ( clicked==true ) return true;
		clicked = true;
		setTimeout(function(){ clicked=false; },500);
		return false;
	}
	
	// -----------------------------------------------------------------
	var free = function () { if ( blocked == 0 || blocked == socket.id ) return true; return false };
	var obj        	   = $('<div class="obj" ></div>')
		.appendTo('#board')
		.addClass('zeitleiste')
		.attr('id',id)
		.css({'height':hoehe,'font-size':fontsize});
		
	var content_obj    = $("<div class='content' style='color:rgb(0,0,0)'>"+content+"</div>")
		.appendTo( obj )
		.css('background-color',"transparent")
		.html( convert(content) );
		
	content_obj.click2(function(platzhalter,e){
		e.stopPropagation();
		if ( free() ){
			// ---------------------------------------------------------
			if ( $('body').hasClass('verbindungen') == false ) return;
			// Element aus- oder abwählen
			if ( obj.hasClass('selected') ) { obj.removeClass('selected'); return false; }
			// Verbinden
			if ( $('#board .selected').length==1 ) {
				// Verbindung zu den DIVs hinzufügen
				O.add_canvas( $('#board .selected').attr('id') );
				all_divs[ $('#board .selected').attr('id') ].add_canvas(O.id);
				$('#board .div').removeClass('selected');
				$('#board .zeitleiste').removeClass('selected');
			} else {
				obj.toggleClass('selected');
			}
		}
	});
	
	var verschieben_obj = $('<div class= "oben_links handle"><span>Verschieben</span></div>').appendTo( obj);
	
	// -------------------------------------------------------------
	// Positionsaenderung (linke obere Ecke)
	// -------------------------------------------------------------
	obj.draggable({
		containment: "parent",						
		handle: ".oben_links",
		start: function (e,u){
			if ( free() ){
				block( socket.id );
				// Nur beim Bearbeiten löschbar machen
				$('<button id="drop">löschen</button>')
					.appendTo('#icons')
					.droppable({
						drop: function(e,u){ 
							socket.emit('element_remove',O.id); 
								for (var i in O.contained_divs){
									socket.emit('element_remove',i);
								}
							},
						hoverClass: "drop-hover",
						revertDuration: 50
					});
				}
			},
		drag: function( event, ui ) {
			O.set.canvas();
			if (grid_distance >0){
				ui.position.top  = ui.position.top  - ui.position.top  % grid_distance;
				ui.position.left = ui.position.left - ui.position.left % grid_distance;
			}
		},
		drag: function(e,u){ O.set.canvas(); },
		stop: function(e,u){
			$('#drop').remove();
			emit(['pos']);
			block( 0 );
		}
	});		
		
	
	// Neues Element als Milestone oder Jahreszahl an Leiste heften
	$('<div class="unten_links handle"><span>Jahreszahl hinzufügen</span></div>') //TextÃƒÂ¤nderungsbeginn
		.appendTo( obj )
		.on("mousedown touchstart",function(e){
			if ( is_clicked()) return false;
			new_div(O.id);			// div, das zur leiste gehört
		});
	
	// -------------------------------------------------------------
	// Groessenaenderung  (rechte untere Ecke)
	// -------------------------------------------------------------
	obj.resizable({
		handles: 'se',
		minWidth: 200,				
		minHeight:50,
		maxHeight:50,
		//grid:[grid_distance,grid_distance],
		resize: function( event, ui ) {
			if (grid_distance >0){
				ui.size.width  = ui.size.width  - ui.size.width % grid_distance;
				ui.size.height = ui.size.height - ui.size.height % grid_distance;
			}
		},						
		start:function(e,u) { block( socket.id ); },
		stop: function(e,u) { emit(['breite']); block( 0 ); }
	});
	
	this.set={};
	this.set.id		 	= function (i) { O.id=i; return O; }
	this.set.pos     	= function (p) { obj.css(p); O.set.canvas(); return O;};
	this.set.breite  	= function (b) { obj.css('width',b);  O.set.canvas(); return O;};	
	this.set.canvas	 	= function (c) { if ( c  != undefined ) { canvas = c; } for (var v in canvas ) { verbinden( O.id, v ); }; if ( $('#board').hasClass('verbindungen') ) verbindungen_deletable(); return O;}
	this.set.contained_divs = function (cd) {if (cd!= undefined) O.contained_divs=cd; return O;}
	this.set.blockiert	= function (i) {
		blocked = i;
		if ( free() ) {
			obj.draggable('enable');
			obj.resizable('enable');
			obj.removeClass('blocked');
			obj.find('.spinner').remove();
		} else {
			obj.draggable({ disabled: true });
			obj.resizable({ disabled: true });
			obj.addClass('blocked');
			obj.children('.block').text(i).spin();
		}
		return this;
	};

	// Getter
	this.get={};
	this.get.id		 	= function (){ return O.id; }
	this.get.content 	= function (){ return content; };
	this.get.pos	 	= function (){ return obj.position(); }
	this.get.hoehe	 	= function (){ return hoehe; }
	this.get.breite	 	= function (){ return obj.width(); }
	this.get.fontsize	= function (){ return fontsize; }
	this.get.canvas	 	= function (){ return canvas; }
	this.get.blockiert	= function (){ return blocked; }
	this.get.contained_divs = function(){return O.contained_divs;}
	// -------------------------------------------------------------
	this.add_canvas  	= function (id){ if ( id != undefined ) canvas[id] = 1; emit(['canvas']); return this;	}
	this.delete_canvas 	= function (id){
		$("#"+[id,O.id].sort().join("-") ).remove();
		delete( canvas[id]); emit(['canvas']);
		return this;
	}
	// Jahreszahlen o.ä zur Zeitleiste hinzufügen, die samt Leiste mitgelöscht werden
	this.add_div 	= function (id){ if ( id != undefined) O.contained_divs[id] = 1; emit(['contained_divs']);/*$('#'+id).appendTo(obj)*/; return this; }
	this.remove_div = function (id){ if ( id != undefined ) delete (O.contained_divs[id]); emit(['contained_divs']); return this;}
	
	this.remove 		= function ()  { obj.remove(); };
	function emit(was){
		var r={};
		if ( was == undefined ) {
			for (var i in O.get) {	r[i]=O.get[i](); }
		} else {
			was.push('id');
			for (var i=0; i< was.length; i++) {
				r[ was[i] ]=O.get[ was[i] ](); 
			}
		}
		if (DEBUG>3) console.log('element_change',r);
		socket.emit('element_change', JSON.stringify( r ) );
	};
	// interne Funktionen
	function block( id ){		//blockiert div
		O.set.blockiert( id );
		emit( ['blockiert'] );
	}
	
	// Verbindung zeichnen
	function verbinden (id1, id2){
		div1 = all_divs[id1];
		div2 = all_divs[id2];
		// Nur wenn beide DIVs existieren einen Verbinder zeichnen
		if (div1==undefined || div2==undefined) return false;
		var modus = 0;		// Linie dick(1) oder dünn(0)
		var id=[div1.id,div2.id].sort().join("-");
		$('#'+id).remove(); // möglichen alten Verbinder entfernen
		// Berechnung der Canvas Ecken
		if ( (div2.get.pos().left+div2.get.breite()/2) < (div1.get.pos().left)){
			modus =1;
			var xs = [ div1.get.pos().left +15,
					 div2.get.pos().left+ div2.get.breite()/2];
		}else if((div2.get.pos().left+ div2.get.breite()/2)>(div1.get.pos().left+ div1.get.breite())){
			modus=1;
			var xs = [ div1.get.pos().left + div1.get.breite()-25,
					 div2.get.pos().left+div2.get.breite()/2];
		}else {
			var xs = [ div2.get.pos().left + div2.get.breite()/2,
					 div2.get.pos().left + div2.get.breite()/2 ];
		} 
		var ys = [ div1.get.pos().top  + div1.get.hoehe()/2-5,
				   div2.get.pos().top  + div2.get.hoehe()/2 ];
		var xp = [xs[0],xs[1]].sort(function(a, b){return a-b});
		var yp = [ys[0],ys[1]].sort(function(a, b){return a-b});
		
		// Canvas positionieren und erzeugen
		var c1=$('<canvas>')
			.attr( 'id', id)
			.css({'position':'absolute','left': xp[0]-5, 'top' : yp[0]-5, 'width': xp[1]-xp[0]+10, 'height': yp[1]-yp[0]+10 })
			.appendTo('#board');
		// Linie zeichnen
		var c=c1[0];
		c.width  = xp[1]-xp[0]+10;
		c.height = yp[1]-yp[0]+10;
		var ctx=c.getContext("2d");
		ctx.beginPath();
		ctx.moveTo( xs[0]-xp[0]+5 , ys[0]-yp[0]+5 );				// zum Canvas relative Position
		ctx.lineTo( xs[1]-xp[0]+5 , ys[1]-yp[0]+5 );
		if (modus == 0){
			ctx.lineWidth=3; ctx.strokeStyle = "white";
		}else{ctx.lineWidth=7; ctx.strokeStyle = "white";}
		ctx.stroke();
		if (modus == 1){ctx.lineWidth=5; ctx.strokeStyle = "black";}
		else{			ctx.lineWidth=1; ctx.strokeStyle = "silver";}
		ctx.stroke();		
		ctx.fill();													
	}

	// Hilfen ausblenden
	//obj.children(".handle").children("span").fadeOut(3000,function(){ $(this).remove(); });
};



function new_timeline(){
	if (DEBUG <4) console.log('new_timeline');
	socket.emit('element_change',JSON.stringify( {
		id:"t",
		pos:{ 
			top:  Math.round( -$('#verschieben').position().top +$(window).height()/2-50 ),
			left: Math.round( -$('#verschieben').position().left+$(window).width() /2-100 )
		},
		breite:500,
		canvas:{},
		contained_divs:{},	//divs die zur zeitleiste gehören
		blockiert:0
	  })
	);
}
