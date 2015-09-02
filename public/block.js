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
