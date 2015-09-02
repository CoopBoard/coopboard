$('#new_div')
.click2(function(){ 	
	new_div();
}); /*
.on("mousedown touchstart",function(){
	if ( isClicked(this)) return false;
	new_div();
});*/
// format in base64 ändern:
function change_content(){
	for (var d in all_divs){
		if (d[0] == 'd'){
			all_divs[d].change_content();
		}
	}
}

var div = function( id, leiste ) {
	var canvas = {}; // Hier werden alle Verbindungen drin gespeichert
	var O = this;
	O.id = id;
	var blocked = 0;
	var clicked=false;
	var TIMELINE = leiste;	// nur wenn div an timeline gekoppelt ist
	// -----------------------------------------------------------------
	function is_clicked(){	// warum nicht auf .click2 zurückführbar ???
		if ( clicked==true ) return true;
		clicked = true;
		setTimeout(function(){ clicked=false; },500);
		return false;
	}
	// -----------------------------------------------------------------
	var free = function () { if ( blocked == 0 || blocked == NAME ) return true; return false };
	var content 	   = "12345";		// Inhalt des Textfeldes
	var obj        	   = $('<div class="obj" ><div class="block">In Arbeit ...</div></div>').appendTo('#board').addClass('div').attr('id',id);
	var content_obj    = $("<div class='content'>"+content+"</div>").css({'overflow':'hidden'}).appendTo( obj );;
	content_obj.click2(function(platzhalter,e){
		e.stopPropagation();
		if ( free() ){
			// ---------------------------------------------------------
			if ( $('body').hasClass('verbindungen') == false ) return;
			// Element aus- oder abwählen
			if ( obj.hasClass('selected') ) { obj.removeClass('selected'); return false; }
			// Verbinden
			if ( $('#board .selected').length==1  ) {
				// Verbindung zu den DIVs hinzufügen
				O.add_canvas( $('#board .selected ').attr('id') );
				all_divs[ $('#board .selected ').attr('id') ].add_canvas(O.id);
				$('#board .div').removeClass('selected');
				$('#board .zeitleiste').removeClass('selected');
			} else {
				obj.toggleClass('selected');
			}
		}
	});
	
	var verschieben_obj = $('<div class= "oben_links handle"><span>Verschieben</span></div>').appendTo( obj);
	//var vergroessern_obj = $('<div class= "unten_rechts handle"><span>Größenänderung</span></div>').appendTo( obj);
	
	var colors = [221,221,221];
	var textcolor = [0,0,0];
	var fontsize = 18; 
	// -------------------------------------------------------------
	// Funktion zum Erstellen von Drehreglern
	// -------------------------------------------------------------
	function knob(groesse,farbe,max_w,min_w,wert,objekt,change,ausrichtung){
		if (ausrichtung == "ro"){var angle_start = -90; var angle = 270;}			
		else if(ausrichtung == "lu"){var angle_start = 90;var angle = 270;}		
		$('<input class="knob " data-cursor="true" data-thickness="'+30/groesse+'" data-width='+ groesse+' data-height='+groesse+'  data-angleOffset='+angle_start+' data-angleArc='+angle+' data-fgColor="#000000" data-bgColor="'+farbe+'" data-rotation="clockwise" data-displayInput="false"> visibility:"visible"')
			.val( Number(wert) )
			.knob({ lineWidth:1,
				max:max_w,
				min:min_w,
				change: change
			})
			.appendTo(objekt); 	
	}

	// -------------------------------------------------------------
	// Text bearbeiten
	// -------------------------------------------------------------
	$('<div class="unten_links handle"><span>Text</span></div>') //TextÃƒÂ¤nderungsbeginn
		.appendTo( obj )
		/*.click2(function(platzhalter,e){
			e.stopPropagation();
			if ( free() ){
				e.stopPropagation();
				block( socket.id );
				// Nicht erneut ausführen
				if ( $(this).css('opacity')==1 ) return;
				if ( $('#texteingabe').length!=0 ) return;
				$(this).css({ opacity:1 });
				// -------------------------------------------------
				// Positionieren, dass man links den Text eingeben kann
				$('#verschieben').css({
					left: Math.round( -O.get.pos().left  +$('#fenster').width() /2+200 ),
					top:  Math.round( -O.get.pos().top + 100 )
				});
				// -------------------------------------------------
				// Textfeld zur Eingabe erzeugen
				var T = $('<div id="texteingabe"><div id="wmd-button-bar"></div><textarea id="wmd-input"></textarea></div>')
					.appendTo('body');
				content_obj.attr("id","wmd-preview");
				$('#texteingabe>textarea').val(content).focus();
				var converter = new Markdown.Converter();
				var editor = new Markdown.Editor(converter);
				editor.run();
				// -------------------------------------------------
				// Schaltfläche zum Schließen
				$("<div class='handle'></div>")
					.appendTo( $(this) )
					.on("mousedown touchstart",function(e){
						if ( is_clicked()) return false;
						e.stopPropagation();
						$(this).parent().empty().css({opacity:""});
						content = $('#texteingabe>textarea').val();
						content_obj.removeAttr("id");
						$('#texteingabe').remove();
						// Änderungen übertragen
						emit(['textcolor','fontsize','content']);
						block( 0 );
					});
				// -------------------------------------------------
				knob(192,"#808080",100,0,fontsize,     $(this),function(v){ O.set.fontsize(parseInt(v)); },"lu" );
				knob(160,"#FF0000",255,0,textcolor[0], $(this),function(v){ O.set.textcolor([parseInt(v),colors[1],textcolor[2]]); },"lu" );
				knob(128,"#00FF00",255,0,textcolor[1], $(this),function(v){ O.set.textcolor([textcolor[0],parseInt(v),textcolor[2]]); },"lu");
				knob( 96,"#0000FF",255,0,textcolor[2], $(this),function(v){ O.set.textcolor([textcolor[0],textcolor[1],parseInt(v)]); },"lu" );
				// -------------------------------------------------
				// Positionieren der Drehregler
				var w = $(this).width();
				$(this).children('div').each(function(i,o){
					$(o).css({ display:"inline-block", position:"absolute", top: -($(o).width()-w)/2, left:-($(o).width()-w)/2});
				});
			}	
		});*/
		.on("mousedown touchstart",function(e){
			if ( is_clicked()) return false;
			e.stopPropagation();
			if ( free() ){
				e.stopPropagation();
				block( NAME );
				// Nicht erneut ausführen
				if ( $(this).css('opacity')==1 ) return;
				if ( $('#texteingabe').length!=0 ) return;
				$(this).css({ opacity:1 });
				// -------------------------------------------------
				// Positionieren, dass man links den Text eingeben kann
				$('#verschieben').css({
					left: Math.round( -O.get.pos().left  +$('#fenster').width() /2+200 ),
					top:  Math.round( -O.get.pos().top + 100 )
				});
				// -------------------------------------------------
				// Textfeld zur Eingabe erzeugen
				var T = $('<div id="texteingabe"><div id="wmd-button-bar"></div><textarea id="wmd-input"></textarea></div>')
					.appendTo('body');
				content_obj.attr("id","wmd-preview");
				$('#texteingabe>textarea').val(content).focus();
				var converter = new Markdown.Converter();
				var editor = new Markdown.Editor(converter);
				editor.run();
				Tex.Init(document.getElementById("wmd-preview"));
				$('#wmd-input').keyup(function(){Tex.Update();});
					// -------------------------------------------------
				// Schaltfläche zum Schließen
				$("<div class='handle'></div>")
					.appendTo( $(this) )
					.on("mousedown touchstart",function(e){
						if ( is_clicked()) return false;
						e.stopPropagation();
						$(this).parent().empty().css({opacity:""});
						content = $('#texteingabe>textarea').val();
						content_obj.removeAttr("id");
						$('#texteingabe').remove();
						// Änderungen übertragen
						emit(['textcolor','fontsize','content']);
						block( 0 );
					});
				// -------------------------------------------------
				knob(192,"#808080",100,0,fontsize,     $(this),function(v){ O.set.fontsize(parseInt(v)); },"lu" );
				knob(160,"#FF0000",255,0,textcolor[0], $(this),function(v){ O.set.textcolor([parseInt(v),colors[1],textcolor[2]]); },"lu" );
				knob(128,"#00FF00",255,0,textcolor[1], $(this),function(v){ O.set.textcolor([textcolor[0],parseInt(v),textcolor[2]]); },"lu");
				knob( 96,"#0000FF",255,0,textcolor[2], $(this),function(v){ O.set.textcolor([textcolor[0],textcolor[1],parseInt(v)]); },"lu" );
				// -------------------------------------------------
				// Positionieren der Drehregler
				var w = $(this).width();
				$(this).children('div').each(function(i,o){
						$(o).css({ display:"inline-block", position:"absolute", top: -($(o).width()-w)/2, left:-($(o).width()-w)/2});
					});
				}
		});


	// -----------------------------------------------------------------
	// TeX
	// -----------------------------------------------------------------
	var Tex = {
		delay: 20,        
		output: null,     // filled in by Init below
		timeout: null,     // store setTimout id	
		mjRunning: false,  // true when MathJax is processing
		oldText: null,     // used to check if an update is needed

		Init: function (input) {
			this.output = input;
		},

		Update: function () {
			if (this.timeout) {clearTimeout(this.timeout)}
			this.timeout = setTimeout(this.callback,this.delay);
		},

		CreateTex: function () {
			Tex.timeout = null;
			if (this.mjRunning) return;
			this.mjRunning = true;
			MathJax.Hub.Queue(
				["Typeset",MathJax.Hub,this.output],
				["TexDone",this]
			);
		},
		
		TexDone: function () {
			this.mjRunning = false;
		}	

	};

	// callback to the CreateTex action
	Tex.callback = MathJax.Callback(["CreateTex",Tex]);
	Tex.callback.autoReset = true;  // make sure it can run more than once
	//------------------------------------------------------------------
	// TeX ENDE
	// -----------------------------------------------------------------
		
		
		// -------------------------------------------------------------
		// Einstellungen
		// -------------------------------------------------------------
		$('<div class="oben_rechts handle"><span>Hintergrund</span></div>')
			.appendTo( obj )
			/*.click2(function(platzhalter,e){
				e.stopPropagation();
				if ( free() ) {
					block( socket.id );
					// Nicht erneut ausführen
					if ( $(this).css('opacity')==1 ) return;
					$(this).css({ opacity:1 });
					// -----------------------------------------------------
					// Schaltfläche zum Schließen
					$("<div class='handle'></div>")
						.appendTo( $(this) )
						.on("mousedown touchstart",function(e){
							if ( is_clicked()) return false;
							e.stopPropagation();
							$(this).parent().empty().css({opacity:""});
							// Änderungen übertragen
							emit(['farbe']);
							block( 0 );
						});
				
					// -----------------------------------------------------
					// Drehregler für die Farbe
					knob(160,"#FF0000",256,0,colors[0], $(this),function(v){ O.set.farbe([parseInt(v),colors[1],colors[2]]); },"ro" );
					knob(128,"#00FF00",256,0,colors[1], $(this),function(v){ O.set.farbe([colors[0],parseInt(v),colors[2]]); },"ro");
					knob(96,"#0000FF",256,0,colors[2], $(this),function(v){ O.set.farbe([colors[0],colors[1],parseInt(v)]); },"ro" );
					// -----------------------------------------------------
					// Positionieren der Drehregler
					var w=$(this).width();
					$(this).children('div').each(function(i,o){
							$(o).css({ display:"inline-block", position:"absolute", top: -($(o).width()-w)/2, left:-($(o).width()-w)/2});
						});
				}
			});*/
			.on("mousedown touchstart",function(e){
				if ( is_clicked()) return false;
				e.stopPropagation();
				if ( free() ) {
					block( NAME );
					// Nicht erneut ausführen
					if ( $(this).css('opacity')==1 ) return;
					$(this).css({ opacity:1 });
					// -----------------------------------------------------
					// Schaltfläche zum Schließen
					$("<div class='handle'></div>")
						.appendTo( $(this) )
						.on("mousedown touchstart",function(e){
							if ( is_clicked()) return false;
							e.stopPropagation();
							$(this).parent().empty().css({opacity:""});
							// Änderungen übertragen
							emit(['farbe']);
							block( 0 );
						});
				
					// -----------------------------------------------------
					// Drehregler für die Farbe
					knob(160,"#FF0000",256,0,colors[0], $(this),function(v){ O.set.farbe([parseInt(v),colors[1],colors[2]]); },"ro" );
					knob(128,"#00FF00",256,0,colors[1], $(this),function(v){ O.set.farbe([colors[0],parseInt(v),colors[2]]); },"ro");
					knob(96,"#0000FF",256,0,colors[2], $(this),function(v){ O.set.farbe([colors[0],colors[1],parseInt(v)]); },"ro" );
					// -----------------------------------------------------
					// Positionieren der Drehregler
					var w=$(this).width();
					$(this).children('div').each(function(i,o){
							$(o).css({ display:"inline-block", position:"absolute", top: -($(o).width()-w)/2, left:-($(o).width()-w)/2});
						});
				}
			});
		// -------------------------------------------------------------
		// Positionsaenderung (linke obere Ecke)
		// -------------------------------------------------------------
	/*	if (timeline == undefined){
			var containment_area = "parent";
		}else {
			var l = all_divs[timeline];
			var containment_area=[l.get.pos()[0],l.get.pos()[1]-20,l.get.pos()[0]+l.get.breite()/2,l.get.pos()[1]+20];
			//var containment_area=[0,0,100,0];
		}*/
			obj.draggable({
				//containment: containment_area,					
				containment: "parent",
				handle: ".oben_links",
				start: function (e,u){
					if ( free() ){
						block( NAME );
						// Nur beim Bearbeiten löschbar machen
						$('<button id="drop">löschen</button>')
							.appendTo('#icons')
							.droppable({
								drop: function(e,u){ 
									socket.emit('element_remove',O.id);
									if (TIMELINE!= undefined) 
										all_divs[TIMELINE].remove_div(O.id);
								},
								hoverClass: "drop-hover",
								revertDuration: 50
							});
						}
					},
				//grid:[grid_distance,grid_distance],
				drag: function( event, ui ) {
					O.set.canvas();
					if (grid_distance >0){
						ui.position.top  = ui.position.top  - ui.position.top  % grid_distance;
						ui.position.left = ui.position.left - ui.position.left % grid_distance;
					}
				},
				stop: function(e,u){
					$('#drop').remove();
					emit(['pos']);
					block( 0 );
				}
			});		
		// -------------------------------------------------------------
		// Konvertierungsfunktion	
		// -------------------------------------------------------------
		//var convert = new Markdown.getSanitizingConverter().makeHtml; //erzeugt Markdown to Html Konvertierfunktion
		var convert = new Markdown.Converter().makeHtml; //erzeugt Markdown to Html Konvertierfunktion
		// -------------------------------------------------------------
		// Groessenaenderung  (rechte untere Ecke)
		// -------------------------------------------------------------
		obj.resizable({
			handles: 'se',
			minWidth: 50,				
			minHeight:30,
			//grid:[grid_distance,grid_distance],
			resize: function( event, ui ) {
				if (grid_distance >0){
					ui.size.width  = ui.size.width  - ui.size.width % grid_distance;
					ui.size.height = ui.size.height - ui.size.height % grid_distance;
				}
			},				
			start:function(e,u) { block( NAME ); },
			stop: function(e,u) { emit(['hoehe','breite']); block( 0 ); }
		});
		// -------------------------------------------------------------
		// Funktionen zum Setzen
		this.set={};
		this.set.id		 	= function (i) { O.id=i; return O; }
		this.set.pos     	= function (p) { obj.css(p); O.set.canvas(); return O;};
		this.set.hoehe   	= function (h) { obj.css('height',h); O.set.canvas(); return O;};	//Hoehe des Divs setzen
		this.set.breite  	= function (b) { obj.css('width',b);  O.set.canvas(); return O;};	//Breite des Divs setzen
		this.set.fontsize	= function (t) { fontsize=t;  obj.css('font-size',t); return O;}
		this.set.textcolor 	= function (c) { textcolor = c; content_obj.css('color','rgb('+c.join(',')+')'); return O;}
		this.set.farbe 	 	= function (f) { 
			colors = f;
			if ( f[0]==256 || f[1]==256 || f[2]==256 ) {
				content_obj.css('background-color',"transparent");
			} else {
				content_obj.css('background-color',"rgb("+f.join(",")+")");
			}
			return O;
		};
		this.set.canvas	 	= function (c) { 	// verbinder setzen und ggf klasse timeline hinzufügen
			if ( c  != undefined ) { canvas = c; var z = 0;} 
			for (var v in canvas ) { 
				verbinden( O.id, v );
				if (v[0]=='t') z=1;
			}; 
			if (z==1) {obj.addClass('timeline');}
			if ( $('#board').hasClass('verbindungen') ) verbindungen_deletable();
			return O;
		}
		this.set.content 	= function (msg) { 
			//content = msg; 						// Merken des Quelltexts
			//content_obj.html( convert(msg) ); 	// Content in HTML konvertiert anzeigen
			
			content = Base64.decode(msg); 						// Merken des Quelltexts
			content_obj.html( convert(Base64.decode(msg)) ); 	// Content in HTML konvertiert anzeigen
			Tex.Init(content_obj[0]);
			Tex.Update();
			return O; 
		};
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
		// -------------------------------------------------------------
		// Funktionen zum Erhalten
		this.get={};
		this.get.id		 	= function (){ return O.id; }
		this.get.content 	= function (){ return Base64.encode(content); };			// Base64 codiert in DB speichern
		this.get.pos	 	= function (){ return obj.position(); }
		this.get.hoehe	 	= function (){ return obj.height(); }
		this.get.breite	 	= function (){ return obj.width(); }
		this.get.farbe	 	= function (){ return colors; }
		this.get.fontsize	= function (){ return fontsize; }
		this.get.textcolor	= function (){ return textcolor; }
		this.get.canvas	 	= function (){ return canvas; }
		this.get.blockiert	= function (){ return blocked; }
		this.get.appendto	= function (){ if (O.appendto != undefined) return O.appendto; else return undefined;}
		// -------------------------------------------------------------
		this.add_canvas  	= function (id){ if ( id != undefined ) canvas[id] = 1; emit(['canvas']); return this;	}
		this.delete_canvas 	= function (id){			
			if (id[0]=='t'){		// falls keine verbindung zu ner timeline -> klasse ändern
				var zeitleiste = 0;
				for(z in O.canvas){
					if (z[0]=='t') zeitleiste =1;
				}
				if (zeitleiste == 0) {obj.removeClass('timeline');}
			}
			
			$("#"+[id,O.id].sort().join("-") ).remove();
			delete( canvas[id]); emit(['canvas']);
			return this;
		}
		this.remove 		= function ()  { obj.remove(); };
		
		this.change_content = function (){	emit(['content']);
		}
		
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
		// -------------------------------------------------------------
		// interne Funktionen
		function block( id ){		//blockiert div
			O.set.blockiert( id );
			emit( ['blockiert'] );
		}
	// -----------------------------------------------------------------
	// Verbindung zeichnen
	function verbinden (id1, id2){
		div1 = all_divs[id1];
		div2 = all_divs[id2];
		// Nur wenn beide DIVs existieren einen Verbinder zeichnen
		if (div1==undefined || div2==undefined) return false;
		var modus = 0;		// ersparrt abfragen
		var id=[div1.id,div2.id].sort().join("-");
		$('#'+id).remove(); // möglichen alten Verbinder entfernen
		// Berechnung der Canvas Ecken
		if (div2.id[0]=='t'||div1.id[0]=='t'){		// anderes element ist zeitleiste
			modus = 1;
		}
		if (modus==1 && ( (div1.get.pos().left+div1.get.breite()/2)<(div2.get.pos().left)  || (div1.get.pos().left+ div1.get.breite()/2)>(div2.get.pos().left+ div2.get.breite()) ) ){
			modus = 2;
		} 
		
		if (modus ==1){
			obj.addClass('timeline');
			var xs = [ div1.get.pos().left + div1.get.breite()/2,
					 div1.get.pos().left + div1.get.breite()/2 ];
			var ys = [ div1.get.pos().top  + div1.get.hoehe()/2,
					div2.get.pos().top  + div2.get.hoehe()/2-5 ];
		}
		if (modus == 2){
			obj.addClass('timeline');
			if ( (div1.get.pos().left+div1.get.breite()/2) < (div2.get.pos().left)){
				var xs = [ div1.get.pos().left + div1.get.breite()/2,
						 div2.get.pos().left+15];
			}else {
				var xs = [ div1.get.pos().left + div1.get.breite()/2,
						 div2.get.pos().left+div2.get.breite()-25];
			}		 
			var ys = [ div1.get.pos().top  + div1.get.hoehe()/2,
					div2.get.pos().top  + div2.get.hoehe()/2 -5];
		}
		else if (modus == 0){
			var xs = [ div1.get.pos().left + div1.get.breite()/2,
					 div2.get.pos().left + div2.get.breite()/2 ];
			var ys = [ div1.get.pos().top  + div1.get.hoehe()/2,
					div2.get.pos().top  + div2.get.hoehe()/2 ];
		}
		
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
		if (modus == 1){ctx.lineWidth=3; ctx.strokeStyle = "white";
		}else{ctx.lineWidth=7; ctx.strokeStyle = "white";}
		ctx.stroke();
		if (modus == 1){
			ctx.lineWidth=1; ctx.strokeStyle = "silver";
		}
		else{
			ctx.lineWidth=5; ctx.strokeStyle = "black";
		}
		ctx.stroke();		
		ctx.fill();													
	}


	// Anpassungen durch Timeline	
	if (TIMELINE != undefined) { 
		obj.addClass('timeline');					// markiert divs, die nur zur Leiste gehören (Jahreszahlen, etc..)
		//O.add_canvas(TIMELINE);						// verbinder zur Timeline automatisch setzen
		all_divs[TIMELINE].add_canvas(O.id);
		all_divs[TIMELINE].add_div(O.id);
	}
	
	// -------------------------------------------------------------
	// Hilfen ausblenden
	//obj.children(".handle").children("span").fadeOut(3000,function(){ $(this).remove(); });
};
// ---------------------------------------------------------------------
// Funktionen außerhalb des Objektes
// ---------------------------------------------------------------------
function new_div(TIMELINE){
	if (DEBUG < 4 ) console.log('new_div');
	if (TIMELINE == undefined){
		socket.emit('element_change',JSON.stringify( {
			id:"d",
			content:Base64.encode("Standardtext"),
			pos:{ 
				top:  Math.round( -$('#verschieben').position().top +$(window).height()/2-50 ),
				left: Math.round( -$('#verschieben').position().left+$(window).width() /2-100 )
			},
			hoehe:100,
			breite:200,
			farbe:[221,221,221],
			textcolor:[0,0,0],
			fontsize: 18,
			canvas:{},
			blockiert:0,
		})
		);
	}
	else {
		socket.emit('element_change',JSON.stringify( {
			id:"d",
			content:Base64.encode("Zahl"),
			pos:{ 
				top:  Math.round( -$('#verschieben').position().top +$(window).height()/2-50 ),
				left: Math.round( -$('#verschieben').position().left+$(window).width() /2-100 )
			},
			hoehe:35,
			breite:60,
			farbe:[221,221,221],
			textcolor:[0,0,255],
			fontsize: 18,
			canvas:{},
			blockiert:0,
			appendto: TIMELINE
		})
		);
	}
}
// ---------------------------------------------------------------------
function verbindungen_deletable(){
	$('#board canvas').draggable({
		start: function (e,u){
			var canvas_div = $(this).attr('id').split("-");
			// Zahlendivs an Zeitleiste sollen verbunden bleiben
			if (canvas_div[1][0] == "t"){
				for (var d in all_divs[canvas_div[1]].get.contained_divs()){
					if (d == canvas_div[0]) return;
				}
			}
			//if (all_divs[canvas_div[0]].appendto == canvas_div[1] || all_divs[canvas_div[1]].appendto == canvas_div[0] ||)
			//	return;
			// Nur beim Bearbeiten löschbar machen
			if ( $('body').hasClass('verbindungen') ) {
				$('<button id="drop" class="verbindungen">löschen</button>')
					.appendTo('#icons')
					.droppable({
						drop: function(e,u){
							socket.emit("verbinder_delete",(u.draggable.attr('id')));
							var canvas_div = u.draggable.attr('id').split("-");
							all_divs[canvas_div[0]].delete_canvas( canvas_div[1] );
							all_divs[canvas_div[1]].delete_canvas( canvas_div[0] );
							u.draggable.remove();

						},
						hoverClass: "drop-hover",
						revertDuration: 50
					});
				}
			},
			stop: function(e,u){ $('#drop').remove();},
			revert: true,
			drag:function(){ if ( $('body').hasClass('verbindungen') == false ) return false; }
	});			
		
		
}

