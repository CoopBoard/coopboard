
document.getElementById('importfile').addEventListener('change', readFile, false);

// lesen
function readFile (evt) {
	var files = evt.target.files;
	var file = files[0];      
	var reader = new FileReader();
	if (file.type=="application/json"){												// JSON import
		reader.onload = function() {
			console.log(this.result);            
			set_all_divs( JSON.parse(this.result));
		};
	}
	else {
		alert ("Datentyp nicht importierbar");
		tmp_board= undefined;
	}
	reader.readAsText(file);
}

	
function set_all_divs( tmp_board){
	var vorhanden;
	var anders=[];
	var alt=[];			// alte elemente, die nicht im tmp_board vorhanden sind
	
	console.log(JSON.stringify(tmp_board)+" tmp_board");
	if (tmp_board == undefined) return;
	if (JSON.stringify(tmp_board.DIVS) === JSON.stringify(all_divs)){ 
		console.log("Boards stimmen überein");
		return;
	}
	console.log("Boards stimmen nicht überein");		
	// -----------------------------------------------------------------
	//  Hintergrund
	if(tmp_board.BACKGROUND!= undefined){
		if (tmp_board.BACKGROUND[0]=='C'){	// Colour
			new _background(tmp_board.BACKGROUND,1);
		}
		else{								// url
			$('#input_background').val((tmp_board.BACKGROUND.substring(1)));
			$('#input_background_submit').click();	
		}
	}
	// Neue elemente und veränderungen einfügen
	for (var neu in tmp_board.DIVS){							// neue mit alten elementen vergleichen
		vorhanden = 0;													// prüft ob element genauso bereits vorhanden
		var tmp = tmp_board.DIVS[neu];
		var typ_tmp = neu[0];												// "d", "t" oder "s"
	
		for (var alt in all_divs ){
			var a=all_divs[alt];
			var typ_alt=alt[0]
			//----DIVS
			if (typ_tmp == "d" && typ_alt== "d"){			// divs vergleichen
				if (	tmp.content 					== a.get.content()									
					&& 	JSON.stringify(tmp.pos) 		== JSON.stringify(a.get.pos() )
					&& 	tmp.hoehe   					== a.get.hoehe()
					&& 	tmp.breite  					== a.get.breite()
					&& 	JSON.stringify(tmp.farbe) 		== JSON.stringify(a.get.farbe() )
					&& 	JSON.stringify(tmp.textcolor) 	== JSON.stringify(a.get.textcolor() )
					&& 	tmp.fontsize 					== a.get.fontsize()
					&& 	JSON.stringify( tmp.canvas)  	== JSON.stringify( a.get.canvas() )  
					&&	tmp.appendto == a.get.appendto()
					){
						vorhanden = 1;				//wenn board in beiden feldern vorhanden
						console.log(tmp+" gleich");
				}
			}	
			//----SLIDES
			else if (typ_tmp == "s"&& typ_alt=="s"){
				if( JSON.stringify(tmp.pos) == JSON.stringify(a.get.pos())
					&& tmp.hoehe   == a.get.hoehe()
					&& tmp.breite  == a.get.breite())
						vorhanden = 1;
			}
			//----TIMELINES
			if (typ_tmp == "t" && typ_alt== "t"){
				if ( 	JSON.stringify(tmp.pos) 			== JSON.stringify(a.get.pos() )
					&& 	tmp.breite   						== a.get.breite()
					&& 	JSON.stringify( tmp.canvas)  		== JSON.stringify( a.get.canvas() )
					&&	JSON.stringify( tmp.contained_divs) == JSON.stringify(a.get.contained_divs() )
					){	vorhanden = 1; }
				}
			}	
		if (vorhanden == 0)										//zu den aenderungen hinzufügen
			anders.push(tmp);
	}
	
	socket.emit("div_read");								// auf uebertragungssignal warten
	
	socket.on('div_set',function(){							// übertragen
	var tmp = anders.shift();
	//console.log(anders);
		if (tmp == undefined){ verbinder_set(); return;} 	// wenn kein weiteres element da, signal an server zum verbinder uebertragen
		else if (tmp.id[0]=="d"){
			console.log('div_import');
			socket.emit('element_import',JSON.stringify( {	// Divs zur veraederung an server senden
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
			console.log('slide_import');
			socket.emit('element_import',JSON.stringify( {	// Slides zur veraenderung an server senden
				id:tmp.id,
				pos:tmp.pos,
				hoehe:tmp.hoehe,
				breite:tmp.breite,
				blockiert:0
			}));
		}
		else if(tmp.id[0]=="t"){
			console.log('timeline_import');
			socket.emit('element_import',JSON.stringify({
				id:tmp.id,
				content:tmp.content,
				pos:tmp.pos,
				hoehe:tmp.hoehe,
				breite:tmp.breite,
				fontsize:tmp.fontsize,
				canvas:tmp.canvas,
				contained_divs:tmp.contained_divs,
				blockiert:0
			}));
		}
		
		socket.emit("div_read");
	});
	
}

	// Verbinder setzen
function verbinder_set(){
		//console.log('verbinder setzen');
		for (var tmp in all_divs){
			if (tmp[0]=="d")					// nur bei divs
				all_divs[tmp].set.canvas();
		}
}
	
