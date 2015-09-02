// QR-CODE
// Aus dem votingsystem uebernommen

function qrcode_zeigen(f,b) {
	$('<div id="qrcode"><a></a></div>').appendTo('body').click(function(){ $(this).remove(); });
	var s=Math.floor( Math.min( $('#qrcode').width(), $('#qrcode').height() ) * 0.6 );
	var url=document.location.href.split("/?");
	var a=url[0]+"?"+current_board;
	$('#qrcode a').attr('href',a);
	$('#qrcode a').html(a);

	if ( b == undefined ) b = "#000000";
	if ( f == undefined ) f = "#ffffff";

	$('#qrcode').css({"background-color":b}).qrcode({
		width			: s,
		height			: s,
		background      : f,
		foreground      : b,
		correctLevel	: 1,
		text			: a
	});
	$('#qrcode canvas').css("background-color",f);
}
