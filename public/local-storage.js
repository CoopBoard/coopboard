var last_boards;
var identity;

$(document).ready(function(){
	last_boards=new lastBoards();
	last_boards_update();			// delete board, which not exists
	identity= new identity();
});

// ---------------------------------------------------------------------
// Passwörter und Boards im Browser speichern
// ---------------------------------------------------------------------
	
	lastBoards = function(){
		$('<div id="last_boards"></div>').appendTo('#settings');
		$('<h1>besuchte Boards</h1>').appendTo('#last_boards').click( function(){ $('#settings>div').addClass("hidden"); $('#last_boards').toggleClass('hidden');});
		this.boards=$.jStorage.get('boards',[]);
		// -------------------------------------------------------------
		var get_settings = function( id ){
			return $.jStorage.get('settings-'+id,{name: id, zeit: new Date().getTime() , passwort:""} );
		};
		this.get_password = function( id ){
			var settings = get_settings( id );
			return settings.passwort;
		}
		// -------------------------------------------------------------
		// Passwort für ein Board speichern
		this.set_passwort = function( id, pw ){
			var settings = get_settings( id );
			settings.passwort = pw;
			$.jStorage.set( 'settings-'+id, settings );
		}
		// -------------------------------------------------------------
		this.addBoard = function(id,name) {
			// Gegebenfalls das aktuelle Board löschen
			this.removeBoard(id);
			// um es vorne wieder einzufügen
			this.boards.unshift( id );
			this.showBoards();
			$.jStorage.set('boards',this.boards);

			// Eigenschaften des Boards speichern
			var settings = get_settings( id );
			settings.zeit = new Date().getTime();
			settings.name = name;
			$.jStorage.set( 'settings-'+id, settings );
		};
		// -------------------------------------------------------------
		this.removeBoard = function(id) {
			var index = this.boards.indexOf( id );
			if ( index > -1) { this.boards.splice(index, 1); }
			this.showBoards();
			$.jStorage.set('boards',this.boards);
		}
		this.renameBoard = function(id,name) {
			var settings = get_settings( id );
			settings.name = name;
			$.jStorage.set( 'settings-'+id, settings );	
			this.showBoards();		
		}
		// -------------------------------------------------------------
		this.showBoards =  function(){
			$('#last_boards>div').remove();
			for (var i=0; i<this.boards.length; i++) {
				var s = get_settings( this.boards[i] );
				var d = new Date(s.zeit);
				var b = $('<div>'+s.name+"<span>("+d.toLocaleString()+") "+this.boards[i]+'</span></div>')
					.appendTo('#last_boards')
					.data('id',this.boards[i])
					.click(function(){ boardchange( $(this).data('id') ) });
				$('<button class="cancel"></button>')
					.appendTo(b)
					.data('id',this.boards[i])
					.click(function(e){
						e.stopPropagation();
						last_boards.removeBoard( $(this).data('id') );
					});
			}
		};
		// -------------------------------------------------------------
		this.showBoards();
	};

// ---------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------
	identity = function(){
		var get_settings = function(was){
			return $.jStorage.get(was,{name: "",id: "", zeit: new Date().getTime()} );
		};
		this.get_name = function(){
			var settings = get_settings('name-');
			return settings.name;
		};
		this.set_name = function( n ){
			var settings = get_settings('name-');
			settings.name = n;
			$.jStorage.set( 'name-', settings );
		};
		this.remove_name = function (){
			var settings = get_settings('name-');
			settings.name = "";
			$.jStorage.set( 'name-', settings );
		};
		this.get_id = function(){
			var settings = get_settings('id-');
			return settings.id;
		};
		this.set_id = function( id ){
			var settings = get_settings('id-');
			settings.id = id;
			$.jStorage.set( 'id-', settings );
		};
		this.remove_id = function (){
			var settings = get_settings('id-');
			settings.id = "";
			$.jStorage.set( 'id-', settings );
		};
	}



function last_boards_update(){
	socket.emit('last_boards_update',last_boards.boards);
}
