var express = require('express')
,   app = express()
,   server = require('http').createServer(app)
,   conf = require('./config.json');
//, 	fs = require('fs');  // beim Speichern ggf. interessant
io = require('socket.io')(server);

var sha1 = require('sha1');
console.log(typeof conf.debug);
console.log(typeof conf.debug);
console.log(typeof conf.debug);
console.log(typeof conf.debug);
console.log(typeof conf.debug);
console.log(typeof conf.debug);
if((typeof conf.debug !== "undefined") ){
	var DEBUG=conf.debug;
}
else{
	var DEBUG=4;
}

// ---------------------------------------------------------------------
// Konstanten für Rechte
const ADMIN =3;
const NUTZER=2;
const GUEST  =1;

// Zeitkonstanten
const WEEK = 7*24*60*60*1000; 
const YEAR = 365*24*60*60*1000;

server.listen(conf.server.port);
app.use(express.static(__dirname + "/public"));

// wenn der Pfad / aufgerufen wird
app.get('/', function (req, res) {
	// so wird die Datei index.html ausgegeben
	res.sendfile(__dirname + '/public/index.html');
});
 
// ---------------------------------------------------------------------
// Datenbankeinbindung
// ---------------------------------------------------------------------
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(conf.db.name);								// Wählt mydb.db als Datenbank aus
var db_interval= 60*5*1000;											
var db_timer = setInterval(db_save,db_interval);						// db speichern alle 5 Minuten aufrufen

// -------------------- Server-Übersicht -------------------------------
setInterval(function(){
	// aktive Nutzer
	var b=[];
	for (var id in USERS) {
		b.push(id);
		if (DEBUG>3) console.log("Nutzer",{id:id,board: USERS[id].get.board()/*,recht:USERS[id].get.rechte()*/});
	}
	var ids=[];
	for (var id in IDS) {
		ids.push(id);
		if (DEBUG>3) console.log("IDs",{sid:id,reconnectID: IDS[id]});
	}
	if ( DEBUG >2 ) {
		console.log("Nutzer",b);
	} else {
		console.log("Anzahl der Nutzer",b.length);
	}
	var b=0;
	for (var id in BOARDS) { b++; }
	console.log("Anzahl der Boards:",b);
},10000);


// Mindestens 1 Board, dass aber ggf. durch die gespeicherten
// überschrieben wird
//var boards = {}; // {"1":{all_divs:{},name:"gfhjk", sichtbar:1, aenderung:0, hintergrund:"" ,passwort:{admin:"",nutzer:"",gast:""}, blockiert:{}} };
var BOARDS = {};
const SPECIAL_BOARDS ={
	// Anleitung
	//Anleitung:{"DIVS":{"d1419028543008":{"content":"Willkommen auf dem Coop-Board\n===\n\nHier kannst Du mit deinen Freunden gemeinsam\n\n* brainstormen\n* mindmappen\n* Präsentationen erstellen\n* ...","pos":{"top":4922,"left":4687},"hoehe":210,"breite":603,"farbe":[175,106,85],"textcolor":[20,21,21],"fontsize":18,"canvas":{"d1419197804906":1,"d1419284695919":1},"blockiert":0,"id":"d1419028543008"},"d1419197804906":{"content":"##Wie nutze ich das Coop-Board?","pos":{"top":5250,"left":4686},"hoehe":101,"breite":484,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419028543008":1,"d1419283133764":1,"d1419283715573":1,"d1420041259823":1},"blockiert":0,"id":"d1419197804906"},"s1419255623631":{"pos":{"top":4835.5,"left":4660},"hoehe":548,"breite":1038,"blockiert":0,"id":"s1419255623631"},"d1419283133764":{"content":"###Grundsätzliche Bedienung","pos":{"top":5431,"left":4252},"hoehe":100,"breite":355,"farbe":[221,221,27],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419197804906":1,"d1419283201068":1,"d1419283377689":1,"d1419283476015":1,"d1431946167755":1},"blockiert":0,"id":"d1419283133764"},"d1419283201068":{"content":"**Neue Blöcke lassen sich einfach erzeugen.**\n\n* oben-links dient zum Verschieben\n* oben-rechts zum Ändern des Hintergrunds\n* unten-links ändert die Schrift\n* unten-rechts verändert die Größe des Blocks\n\nUm einen Block zu löschen, ziehe ihn auf das Löschen, was beim Verschieben erscheint.","pos":{"top":5431,"left":3795},"hoehe":229,"breite":430,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283133764":1},"blockiert":0,"id":"d1419283201068"},"d1419283377689":{"content":"**Präsentationsfolien**\n\nlassen sich ebenso einfach hinzufügen!","pos":{"top":5719,"left":4243},"hoehe":105,"breite":370,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283133764":1},"blockiert":0,"id":"d1419283377689"},"d1419283476015":{"content":"**Verbindungen ...**\n\nerstellt man im Verbindungsmodus, indem man nacheinander 2 Blöcke auswählt.\n\nZum Löschen zieht man die Verbindung auf das erscheinende Löschen.","pos":{"top":5554,"left":4246},"hoehe":154,"breite":365,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283133764":1},"blockiert":0,"id":"d1419283476015"},"d1419283715573":{"content":"###Zusammenarbeit","pos":{"top":5428,"left":4682},"hoehe":100,"breite":402,"farbe":[221,221,28],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419197804906":1,"d1419283809444":1},"blockiert":0,"id":"d1419283715573"},"d1419283809444":{"content":"**Setze zuerst das Admin-Passwort!**\n\nWenn das Admin-Passwort nicht gesetzt ist, sind alle Nutzer auf dem Board Admins. So könntest du aus deinem Board ausgesperrt werden!","pos":{"top":5560,"left":4684},"hoehe":135,"breite":399,"farbe":[221,67,67],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283715573":1,"d1419283934490":1,"d1419284199195":1},"blockiert":0,"id":"d1419283809444"},"d1419283934490":{"content":"**Lade Freunde auf dein Board ein!**\n\nHierzu gibt es 3 Wege:\n\n1. Zeige ihnen den QR-Code\n1. Schicke ihnen den Link (beim QR-Code)\n1. lege das Board offen\n**Auf diesem Weg könnten auch Fremde dein Board finden!**\n\n","pos":{"top":5729,"left":4684},"hoehe":237,"breite":398,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283809444":1,"d1419284395610":1},"blockiert":0,"id":"d1419283934490"},"d1419284199195":{"content":"Es lassen sich 3 Passwörter setzen \n\n* Admin: alle Rechte, auch dieses Passwort lässt sich ändern!\n* Nutzer: kann das Board komplett bearbeiten, aber keine Passwörter setzen.\n* Gast: Hier können auch Besucher ausgesperrt werden!","pos":{"top":5761,"left":5163},"hoehe":206,"breite":413,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283809444":1,"d1420041757375":1,"d1420046233090":1},"blockiert":0,"id":"d1419284199195"},"d1419284395610":{"content":"Entscheidest du dich für den Weg \"Offenlegen\", so kannst du die Passwörter setzen, damit ungewünschte Gäste keinen Unfug machen.","pos":{"top":5997,"left":4680},"hoehe":119,"breite":530,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283934490":1},"blockiert":0,"id":"d1419284395610"},"s1419284555608":{"pos":{"top":5168,"left":4252},"hoehe":360,"breite":1329,"blockiert":0,"id":"s1419284555608"},"s1419284571095":{"pos":{"top":5400,"left":3766},"hoehe":434,"breite":873,"blockiert":0,"id":"s1419284571095"},"s1419284611185":{"pos":{"top":5397,"left":4654},"hoehe":718,"breite":1003,"blockiert":0,"id":"s1419284611185"},"d1419284695919":{"content":"##Was gibt es zu beachten?","pos":{"top":5008,"left":5333},"hoehe":100,"breite":340,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419284749840":1,"d1419284816582":1,"d1419284896106":1,"d1419284979067":1,"d1419028543008":1},"blockiert":0,"id":"d1419284695919"},"d1419284749840":{"content":"###Das Coop-Board setzt ein ständige Verbindung zum Server voraus!","pos":{"top":4955,"left":5729},"hoehe":100,"breite":704,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419284695919":1},"blockiert":0,"id":"d1419284749840"},"d1419284816582":{"content":"###Werden Bilder eingebaut, so muss eine Verbindung zum Internet bestehen!","pos":{"top":5067,"left":5731},"hoehe":100,"breite":702,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419284695919":1},"blockiert":0,"id":"d1419284816582"},"d1419284896106":{"content":"###Alle Bilder werden direkt von der Quelle geladen, somit kann das Laden etwas dauern!","pos":{"top":5181,"left":5732},"hoehe":100,"breite":702,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419284695919":1},"blockiert":0,"id":"d1419284896106"},"d1419284979067":{"content":"###Das Coop-Board setzt einen aktuellen Browser voraus, **immer** vorher testen!","pos":{"top":5297,"left":5732},"hoehe":100,"breite":703,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419284695919":1},"blockiert":0,"id":"d1419284979067"},"s1419285080972":{"pos":{"top":5396,"left":5145},"hoehe":584,"breite":1055,"blockiert":0,"id":"s1419285080972"},"d1420041259823":{"content":"###Präsentation","pos":{"top":5428,"left":5162},"hoehe":100,"breite":420,"farbe":[221,221,29],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1420041757375":1,"d1420046233090":1,"d1419197804906":1},"blockiert":0,"id":"d1420041259823"},"d1420041757375":{"content":"**Direktes Präsentieren**\n\nAm einfachsten öffnet man auf dem Präsentationsrechner \nim Browser das Board.\n\nDazu das Board öffentlich machen **und** Passwörter für Nutzer und Admin setzen!","pos":{"top":5549,"left":5163},"hoehe":173,"breite":414,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419284199195":1,"d1420041259823":1},"blockiert":0,"id":"d1420041757375"},"d1420046233090":{"content":"**Ferngesteuertes Präsentieren**\n\nElegant ist das Steuern der Präsentation vom eigenen Endgerät (Notebook oder Tablet).\n\n1. Man öffnet das Board auf dem eigenen Rechner.\n1. Man gibt die **Präsentation** frei.\n1. Man geht auf dem Präsentationsrechner auf das Koopboard und klinkt sich in die Präsentation ein.\n1. Jetzt kann man vom eigenen Gerät aus Folien weiter gehen ...\n1. Auch andere können sich einklinken und die Präsentation am eigenen Endgerät verfolgen.\n\nAchja, Passwörter für Nutzer und Admin setzen!","pos":{"top":5552,"left":5599},"hoehe":418,"breite":382,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419284199195":1,"d1420041259823":1},"blockiert":0,"id":"d1420046233090"},"s1420048496085":{"pos":{"top":4896,"left":5299},"hoehe":488,"breite":1167,"blockiert":0,"id":"s1420048496085"},"d1431946167755":{"blockiert":0,"id":"d1431946167755","content":"**Zeitleisten lassen sich wie Blöcke bedienen**\n\n * oben links dient zum Verschieben\n * unten links zum Hinzufügen von Jahreszahlen oder Meilensteinen\n * unten rechts verändert die Breite der Zeitleiste\n","pos":{"top":5670,"left":3797},"hoehe":155,"breite":428,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283133764":1}},"blockiert":0},"PASSWORD":{"a":null,"n":null,"g":null},"NAME":"Anleitung","BACKGROUND":"C#ffffff","VISIBILITY":0,"CHANGED":1431947126205},
	Anleitung:{"DIVS":{"d1419028543008":{"content":"V2lsbGtvbW1lbiBhdWYgZGVtIENvb3AtQm9hcmQKPT09CgpIaWVyIGthbm5zdCBEdSBtaXQgZGVpbmVuIEZyZXVuZGVuIGdlbWVpbnNhbQoKKiBicmFpbnN0b3JtZW4KKiBtaW5kbWFwcGVuCiogUHLDpHNlbnRhdGlvbmVuIGVyc3RlbGxlbgoqIC4uLg==","pos":{"top":4922,"left":4687},"hoehe":210,"breite":603,"farbe":[175,106,85],"textcolor":[20,21,21],"fontsize":18,"canvas":{"d1419197804906":1,"d1419284695919":1},"blockiert":0,"id":"d1419028543008"},"d1419197804906":{"content":"IyNXaWUgbnV0emUgaWNoIGRhcyBDb29wLUJvYXJkPw==","pos":{"top":5250,"left":4686},"hoehe":101,"breite":484,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419028543008":1,"d1419283133764":1,"d1419283715573":1,"d1420041259823":1},"blockiert":0,"id":"d1419197804906"},"s1419255623631":{"pos":{"top":4835.5,"left":4660},"hoehe":548,"breite":1038,"blockiert":0,"id":"s1419255623631"},"d1419283133764":{"content":"IyMjR3J1bmRzw6R0emxpY2hlIEJlZGllbnVuZw==","pos":{"top":5431,"left":4252},"hoehe":100,"breite":355,"farbe":[221,221,27],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419197804906":1,"d1419283201068":1,"d1419283377689":1,"d1419283476015":1,"d1431946167755":1},"blockiert":0,"id":"d1419283133764"},"d1419283201068":{"content":"KipOZXVlIEJsw7Zja2UgbGFzc2VuIHNpY2ggZWluZmFjaCBlcnpldWdlbi4qKgoKKiBvYmVuLWxpbmtzIGRpZW50IHp1bSBWZXJzY2hpZWJlbgoqIG9iZW4tcmVjaHRzIHp1bSDDhG5kZXJuIGRlcyBIaW50ZXJncnVuZHMKKiB1bnRlbi1saW5rcyDDpG5kZXJ0IGRpZSBTY2hyaWZ0CiogdW50ZW4tcmVjaHRzIHZlcsOkbmRlcnQgZGllIEdyw7bDn2UgZGVzIEJsb2NrcwoKVW0gZWluZW4gQmxvY2sgenUgbMO2c2NoZW4sIHppZWhlIGlobiBhdWYgZGFzIEzDtnNjaGVuLCB3YXMgYmVpbSBWZXJzY2hpZWJlbiBlcnNjaGVpbnQu","pos":{"top":5431,"left":3795},"hoehe":229,"breite":430,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283133764":1},"blockiert":0,"id":"d1419283201068"},"d1419283377689":{"content":"KipQcsOkc2VudGF0aW9uc2ZvbGllbioqCgpsYXNzZW4gc2ljaCBlYmVuc28gZWluZmFjaCBoaW56dWbDvGdlbiE=","pos":{"top":5719,"left":4243},"hoehe":105,"breite":370,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283133764":1},"blockiert":0,"id":"d1419283377689"},"d1419283476015":{"content":"KipWZXJiaW5kdW5nZW4gLi4uKioKCmVyc3RlbGx0IG1hbiBpbSBWZXJiaW5kdW5nc21vZHVzLCBpbmRlbSBtYW4gbmFjaGVpbmFuZGVyIDIgQmzDtmNrZSBhdXN3w6RobHQuCgpadW0gTMO2c2NoZW4gemllaHQgbWFuIGRpZSBWZXJiaW5kdW5nIGF1ZiBkYXMgZXJzY2hlaW5lbmRlIEzDtnNjaGVuLg==","pos":{"top":5554,"left":4246},"hoehe":154,"breite":365,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283133764":1},"blockiert":0,"id":"d1419283476015"},"d1419283715573":{"content":"IyMjWnVzYW1tZW5hcmJlaXQ=","pos":{"top":5428,"left":4682},"hoehe":100,"breite":402,"farbe":[221,221,28],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419197804906":1,"d1419283809444":1},"blockiert":0,"id":"d1419283715573"},"d1419283809444":{"content":"KipTZXR6ZSB6dWVyc3QgZGFzIEFkbWluLVBhc3N3b3J0ISoqCgpXZW5uIGRhcyBBZG1pbi1QYXNzd29ydCBuaWNodCBnZXNldHp0IGlzdCwgc2luZCBhbGxlIE51dHplciBhdWYgZGVtIEJvYXJkIEFkbWlucy4gU28ga8O2bm50ZXN0IGR1IGF1cyBkZWluZW0gQm9hcmQgYXVzZ2VzcGVycnQgd2VyZGVuIQ==","pos":{"top":5560,"left":4684},"hoehe":135,"breite":399,"farbe":[221,67,67],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283715573":1,"d1419283934490":1,"d1419284199195":1},"blockiert":0,"id":"d1419283809444"},"d1419283934490":{"content":"KipMYWRlIEZyZXVuZGUgYXVmIGRlaW4gQm9hcmQgZWluISoqCgpIaWVyenUgZ2lidCBlcyAzIFdlZ2U6CgoxLiBaZWlnZSBpaG5lbiBkZW4gUVItQ29kZQoxLiBTY2hpY2tlIGlobmVuIGRlbiBMaW5rIChiZWltIFFSLUNvZGUpCjEuIGxlZ2UgZGFzIEJvYXJkIG9mZmVuCioqQXVmIGRpZXNlbSBXZWcga8O2bm50ZW4gYXVjaCBGcmVtZGUgZGVpbiBCb2FyZCBmaW5kZW4hKioKCg==","pos":{"top":5729,"left":4684},"hoehe":237,"breite":398,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283809444":1,"d1419284395610":1},"blockiert":0,"id":"d1419283934490"},"d1419284199195":{"content":"RXMgbGFzc2VuIHNpY2ggMyBQYXNzd8O2cnRlciBzZXR6ZW4gCgoqIEFkbWluOiBhbGxlIFJlY2h0ZSwgYXVjaCBkaWVzZXMgUGFzc3dvcnQgbMOkc3N0IHNpY2ggw6RuZGVybiEKKiBOdXR6ZXI6IGthbm4gZGFzIEJvYXJkIGtvbXBsZXR0IGJlYXJiZWl0ZW4sIGFiZXIga2VpbmUgUGFzc3fDtnJ0ZXIgc2V0emVuLgoqIEdhc3Q6IEhpZXIga8O2bm5lbiBhdWNoIEJlc3VjaGVyIGF1c2dlc3BlcnJ0IHdlcmRlbiE=","pos":{"top":5761,"left":5163},"hoehe":206,"breite":413,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283809444":1,"d1420041757375":1,"d1420046233090":1},"blockiert":0,"id":"d1419284199195"},"d1419284395610":{"content":"RW50c2NoZWlkZXN0IGR1IGRpY2ggZsO8ciBkZW4gV2VnICJPZmZlbmxlZ2VuIiwgc28ga2FubnN0IGR1IGRpZSBQYXNzd8O2cnRlciBzZXR6ZW4sIGRhbWl0IHVuZ2V3w7xuc2NodGUgR8Okc3RlIGtlaW5lbiBVbmZ1ZyBtYWNoZW4u","pos":{"top":5997,"left":4680},"hoehe":119,"breite":530,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283934490":1},"blockiert":0,"id":"d1419284395610"},"s1419284555608":{"pos":{"top":5168,"left":4252},"hoehe":360,"breite":1329,"blockiert":0,"id":"s1419284555608"},"s1419284571095":{"pos":{"top":5400,"left":3766},"hoehe":434,"breite":873,"blockiert":0,"id":"s1419284571095"},"s1419284611185":{"pos":{"top":5397,"left":4654},"hoehe":718,"breite":1003,"blockiert":0,"id":"s1419284611185"},"d1419284695919":{"content":"IyNXYXMgZ2lidCBlcyB6dSBiZWFjaHRlbj8=","pos":{"top":5008,"left":5333},"hoehe":100,"breite":340,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419284749840":1,"d1419284816582":1,"d1419284896106":1,"d1419284979067":1,"d1419028543008":1},"blockiert":0,"id":"d1419284695919"},"d1419284749840":{"content":"IyMjRGFzIENvb3AtQm9hcmQgc2V0enQgZWluIHN0w6RuZGlnZSBWZXJiaW5kdW5nIHp1bSBTZXJ2ZXIgdm9yYXVzIQ==","pos":{"top":4955,"left":5729},"hoehe":100,"breite":704,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419284695919":1},"blockiert":0,"id":"d1419284749840"},"d1419284816582":{"content":"IyMjV2VyZGVuIEJpbGRlciBlaW5nZWJhdXQsIHNvIG11c3MgZWluZSBWZXJiaW5kdW5nIHp1bSBJbnRlcm5ldCBiZXN0ZWhlbiE=","pos":{"top":5067,"left":5731},"hoehe":100,"breite":702,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419284695919":1},"blockiert":0,"id":"d1419284816582"},"d1419284896106":{"content":"IyMjQWxsZSBCaWxkZXIgd2VyZGVuIGRpcmVrdCB2b24gZGVyIFF1ZWxsZSBnZWxhZGVuLCBzb21pdCBrYW5uIGRhcyBMYWRlbiBldHdhcyBkYXVlcm4h","pos":{"top":5181,"left":5732},"hoehe":100,"breite":702,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419284695919":1},"blockiert":0,"id":"d1419284896106"},"d1419284979067":{"content":"IyMjRGFzIENvb3AtQm9hcmQgc2V0enQgZWluZW4gYWt0dWVsbGVuIEJyb3dzZXIgdm9yYXVzLCAqKmltbWVyKiogdm9yaGVyIHRlc3RlbiE=","pos":{"top":5297,"left":5732},"hoehe":100,"breite":703,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419284695919":1},"blockiert":0,"id":"d1419284979067"},"s1419285080972":{"pos":{"top":5396,"left":5145},"hoehe":584,"breite":1055,"blockiert":0,"id":"s1419285080972"},"d1420041259823":{"content":"IyMjUHLDpHNlbnRhdGlvbg==","pos":{"top":5428,"left":5162},"hoehe":100,"breite":420,"farbe":[221,221,29],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1420041757375":1,"d1420046233090":1,"d1419197804906":1},"blockiert":0,"id":"d1420041259823"},"d1420041757375":{"content":"KipEaXJla3RlcyBQcsOkc2VudGllcmVuKioKCkFtIGVpbmZhY2hzdGVuIMO2ZmZuZXQgbWFuIGF1ZiBkZW0gUHLDpHNlbnRhdGlvbnNyZWNobmVyIAppbSBCcm93c2VyIGRhcyBCb2FyZC4KCkRhenUgZGFzIEJvYXJkIMO2ZmZlbnRsaWNoIG1hY2hlbiAqKnVuZCoqIFBhc3N3w7ZydGVyIGbDvHIgTnV0emVyIHVuZCBBZG1pbiBzZXR6ZW4h","pos":{"top":5549,"left":5163},"hoehe":173,"breite":414,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419284199195":1,"d1420041259823":1},"blockiert":0,"id":"d1420041757375"},"d1420046233090":{"content":"KipGZXJuZ2VzdGV1ZXJ0ZXMgUHLDpHNlbnRpZXJlbioqCgpFbGVnYW50IGlzdCBkYXMgU3RldWVybiBkZXIgUHLDpHNlbnRhdGlvbiB2b20gZWlnZW5lbiBFbmRnZXLDpHQgKE5vdGVib29rIG9kZXIgVGFibGV0KS4KCjEuIE1hbiDDtmZmbmV0IGRhcyBCb2FyZCBhdWYgZGVtIGVpZ2VuZW4gUmVjaG5lci4KMS4gTWFuIGdpYnQgZGllICoqUHLDpHNlbnRhdGlvbioqIGZyZWkuCjEuIE1hbiBnZWh0IGF1ZiBkZW0gUHLDpHNlbnRhdGlvbnNyZWNobmVyIGF1ZiBkYXMgS29vcGJvYXJkIHVuZCBrbGlua3Qgc2ljaCBpbiBkaWUgUHLDpHNlbnRhdGlvbiBlaW4uCjEuIEpldHp0IGthbm4gbWFuIHZvbSBlaWdlbmVuIEdlcsOkdCBhdXMgRm9saWVuIHdlaXRlciBnZWhlbiAuLi4KMS4gQXVjaCBhbmRlcmUga8O2bm5lbiBzaWNoIGVpbmtsaW5rZW4gdW5kIGRpZSBQcsOkc2VudGF0aW9uIGFtIGVpZ2VuZW4gRW5kZ2Vyw6R0IHZlcmZvbGdlbi4KCkFjaGphLCBQYXNzd8O2cnRlciBmw7xyIE51dHplciB1bmQgQWRtaW4gc2V0emVuIQ==","pos":{"top":5552,"left":5599},"hoehe":418,"breite":382,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419284199195":1,"d1420041259823":1},"blockiert":0,"id":"d1420046233090"},"s1420048496085":{"pos":{"top":4896,"left":5299},"hoehe":488,"breite":1167,"blockiert":0,"id":"s1420048496085"},"d1431946167755":{"blockiert":0,"id":"d1431946167755","content":"KipaZWl0bGVpc3RlbiBsYXNzZW4gc2ljaCB3aWUgQmzDtmNrZSBiZWRpZW5lbioqCgogKiBvYmVuIGxpbmtzIGRpZW50IHp1bSBWZXJzY2hpZWJlbgogKiB1bnRlbiBsaW5rcyB6dW0gSGluenVmw7xnZW4gdm9uIEphaHJlc3phaGxlbiBvZGVyIE1laWxlbnN0ZWluZW4KICogdW50ZW4gcmVjaHRzIHZlcsOkbmRlcnQgZGllIEJyZWl0ZSBkZXIgWmVpdGxlaXN0ZQo=","pos":{"top":5670,"left":3797},"hoehe":155,"breite":428,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1419283133764":1}},"blockiert":0},"PASSWORD":{"a":1,"n":1,"g":null},"NAME":"Anleitung","BACKGROUND":"C#ffffff","VISIBILITY":0,"CHANGED":1434806864172},
	//Impressum
	//Impressum:{"DIVS":{"d1428790933821":{"blockiert":0,"id":"d1428790933821","content":"#Impressum","pos":{"top":4750,"left":4827},"hoehe":104,"breite":225,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1428790995530":1,"d1428791317251":1}},"d1428790995530":{"blockiert":0,"id":"d1428790995530","content":"<strong>Verantwortlicher i.S.d. § 10 Abs. 3 MDStV</strong> ","pos":{"top":4907,"left":4456},"hoehe":100,"breite":219,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1428790933821":1,"d1428791009015":1}},"d1428791009015":{"blockiert":0,"id":"d1428791009015","content":"Sabrina Gaube<br>\nIm Vöhrumer Feld 22<br>\n31228 Peine <br><br>\nsabrina-gaube@web.de","pos":{"top":5096,"left":4232},"hoehe":124,"breite":250,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1428790995530":1}},"d1428791317251":{"blockiert":0,"id":"d1428791317251","content":"##Haftungsauschluss","pos":{"top":4927,"left":5184},"hoehe":107,"breite":325,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1428790933821":1,"d1428791350096":1,"d1428791372163":1,"d1428791403499":1}},"d1428791350096":{"blockiert":0,"id":"d1428791350096","content":"<p><strong>Haftung für Inhalte</strong></p>\n<p>Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für \neigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. \nNach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht \nverpflichtet, übermittelte oder gespeicherte fremde Informationen zu \nüberwachen oder nach Umständen zu forschen, die auf eine rechtswidrige \nTätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der \nNutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon \nunberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem \nZeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei \nBekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte \numgehend entfernen.</p>","pos":{"top":5173,"left":4690},"hoehe":431,"breite":384,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1428791317251":1}},"d1428791372163":{"blockiert":0,"id":"d1428791372163","content":"<p><strong>Haftung für Links</strong></p>\n<p>Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren \nInhalte wir keinen Einfluss haben. Deshalb können wir für diese \nfremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte \nder verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der \nSeiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung \nauf mögliche Rechtsverstöße überprüft. Rechtswidrige \nInhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente \ninhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte \neiner Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen \nwerden wir derartige Links umgehend entfernen.</p>","pos":{"top":5288,"left":5196},"hoehe":439,"breite":372,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1428791317251":1}},"d1428791403499":{"blockiert":0,"id":"d1428791403499","content":"<p><strong>Urheberrecht</strong></p>\n<p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten \nunterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und \njede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen \nder schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads \nund Kopien dieser Seite sind nur für den privaten, nicht kommerziellen \nGebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, \nwerden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche \ngekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. \nBei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.</p>","pos":{"top":5134,"left":5686},"hoehe":491,"breite":380,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1428791317251":1}}},"CHANGED":1428791587087,"BACKGROUND":"C#ffffff","PASSWORD":{"a":null,"n":null,"g":null},"NAME":"Impressum","VISIBILITY":1,"MESSAGES":[]} 
	Impressum:{"DIVS":{"d1428790933821":{"blockiert":0,"id":"d1428790933821","content":"I0ltcHJlc3N1bQ==","pos":{"top":4750,"left":4827},"hoehe":104,"breite":225,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1428790995530":1,"d1428791317251":1}},"d1428790995530":{"blockiert":0,"id":"d1428790995530","content":"PHN0cm9uZz5WZXJhbnR3b3J0bGljaGVyIGkuUy5kLiDCpyAxMCBBYnMuIDMgTURTdFY8L3N0cm9uZz4g","pos":{"top":4907,"left":4456},"hoehe":100,"breite":219,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1428790933821":1,"d1428791009015":1}},"d1428791009015":{"blockiert":0,"id":"d1428791009015","content":"U2FicmluYSBHYXViZTxicj4KSW0gVsO2aHJ1bWVyIEZlbGQgMjI8YnI+CjMxMjI4IFBlaW5lIDxicj48YnI+CnNhYnJpbmEtZ2F1YmVAd2ViLmRl","pos":{"top":5096,"left":4232},"hoehe":124,"breite":250,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1428790995530":1}},"d1428791317251":{"blockiert":0,"id":"d1428791317251","content":"IyNIYWZ0dW5nc2F1c2NobHVzcw==","pos":{"top":4927,"left":5184},"hoehe":107,"breite":325,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1428790933821":1,"d1428791350096":1,"d1428791372163":1,"d1428791403499":1}},"d1428791350096":{"blockiert":0,"id":"d1428791350096","content":"PHA+PHN0cm9uZz5IYWZ0dW5nIGbDvHIgSW5oYWx0ZTwvc3Ryb25nPjwvcD4KPHA+QWxzIERpZW5zdGVhbmJpZXRlciBzaW5kIHdpciBnZW3DpMOfIMKnIDcgQWJzLjEgVE1HIGbDvHIgCmVpZ2VuZSBJbmhhbHRlIGF1ZiBkaWVzZW4gU2VpdGVuIG5hY2ggZGVuIGFsbGdlbWVpbmVuIEdlc2V0emVuIHZlcmFudHdvcnRsaWNoLiAKTmFjaCDCp8KnIDggYmlzIDEwIFRNRyBzaW5kIHdpciBhbHMgRGllbnN0ZWFuYmlldGVyIGplZG9jaCBuaWNodCAKdmVycGZsaWNodGV0LCDDvGJlcm1pdHRlbHRlIG9kZXIgZ2VzcGVpY2hlcnRlIGZyZW1kZSBJbmZvcm1hdGlvbmVuIHp1IArDvGJlcndhY2hlbiBvZGVyIG5hY2ggVW1zdMOkbmRlbiB6dSBmb3JzY2hlbiwgZGllIGF1ZiBlaW5lIHJlY2h0c3dpZHJpZ2UgClTDpHRpZ2tlaXQgaGlud2Vpc2VuLiBWZXJwZmxpY2h0dW5nZW4genVyIEVudGZlcm51bmcgb2RlciBTcGVycnVuZyBkZXIgCk51dHp1bmcgdm9uIEluZm9ybWF0aW9uZW4gbmFjaCBkZW4gYWxsZ2VtZWluZW4gR2VzZXR6ZW4gYmxlaWJlbiBoaWVydm9uIAp1bmJlcsO8aHJ0LiBFaW5lIGRpZXNiZXrDvGdsaWNoZSBIYWZ0dW5nIGlzdCBqZWRvY2ggZXJzdCBhYiBkZW0gClplaXRwdW5rdCBkZXIgS2VubnRuaXMgZWluZXIga29ua3JldGVuIFJlY2h0c3ZlcmxldHp1bmcgbcO2Z2xpY2guIEJlaSAKQmVrYW5udHdlcmRlbiB2b24gZW50c3ByZWNoZW5kZW4gUmVjaHRzdmVybGV0enVuZ2VuIHdlcmRlbiB3aXIgZGllc2UgSW5oYWx0ZSAKdW1nZWhlbmQgZW50ZmVybmVuLjwvcD4=","pos":{"top":5173,"left":4690},"hoehe":431,"breite":384,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1428791317251":1}},"d1428791372163":{"blockiert":0,"id":"d1428791372163","content":"PHA+PHN0cm9uZz5IYWZ0dW5nIGbDvHIgTGlua3M8L3N0cm9uZz48L3A+CjxwPlVuc2VyIEFuZ2Vib3QgZW50aMOkbHQgTGlua3MgenUgZXh0ZXJuZW4gV2Vic2VpdGVuIERyaXR0ZXIsIGF1ZiBkZXJlbiAKSW5oYWx0ZSB3aXIga2VpbmVuIEVpbmZsdXNzIGhhYmVuLiBEZXNoYWxiIGvDtm5uZW4gd2lyIGbDvHIgZGllc2UgCmZyZW1kZW4gSW5oYWx0ZSBhdWNoIGtlaW5lIEdld8OkaHIgw7xiZXJuZWhtZW4uIEbDvHIgZGllIEluaGFsdGUgCmRlciB2ZXJsaW5rdGVuIFNlaXRlbiBpc3Qgc3RldHMgZGVyIGpld2VpbGlnZSBBbmJpZXRlciBvZGVyIEJldHJlaWJlciBkZXIgClNlaXRlbiB2ZXJhbnR3b3J0bGljaC4gRGllIHZlcmxpbmt0ZW4gU2VpdGVuIHd1cmRlbiB6dW0gWmVpdHB1bmt0IGRlciBWZXJsaW5rdW5nIAphdWYgbcO2Z2xpY2hlIFJlY2h0c3ZlcnN0w7bDn2Ugw7xiZXJwcsO8ZnQuIFJlY2h0c3dpZHJpZ2UgCkluaGFsdGUgd2FyZW4genVtIFplaXRwdW5rdCBkZXIgVmVybGlua3VuZyBuaWNodCBlcmtlbm5iYXIuIEVpbmUgcGVybWFuZW50ZSAKaW5oYWx0bGljaGUgS29udHJvbGxlIGRlciB2ZXJsaW5rdGVuIFNlaXRlbiBpc3QgamVkb2NoIG9obmUga29ua3JldGUgQW5oYWx0c3B1bmt0ZSAKZWluZXIgUmVjaHRzdmVybGV0enVuZyBuaWNodCB6dW11dGJhci4gQmVpIEJla2FubnR3ZXJkZW4gdm9uIFJlY2h0c3ZlcmxldHp1bmdlbiAKd2VyZGVuIHdpciBkZXJhcnRpZ2UgTGlua3MgdW1nZWhlbmQgZW50ZmVybmVuLjwvcD4=","pos":{"top":5288,"left":5196},"hoehe":439,"breite":372,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1428791317251":1}},"d1428791403499":{"blockiert":0,"id":"d1428791403499","content":"PHA+PHN0cm9uZz5VcmhlYmVycmVjaHQ8L3N0cm9uZz48L3A+CjxwPkRpZSBkdXJjaCBkaWUgU2VpdGVuYmV0cmVpYmVyIGVyc3RlbGx0ZW4gSW5oYWx0ZSB1bmQgV2Vya2UgYXVmIGRpZXNlbiBTZWl0ZW4gCnVudGVybGllZ2VuIGRlbSBkZXV0c2NoZW4gVXJoZWJlcnJlY2h0LiBEaWUgVmVydmllbGbDpGx0aWd1bmcsIEJlYXJiZWl0dW5nLCBWZXJicmVpdHVuZyB1bmQgCmplZGUgQXJ0IGRlciBWZXJ3ZXJ0dW5nIGF1w59lcmhhbGIgZGVyIEdyZW56ZW4gZGVzIFVyaGViZXJyZWNodGVzIGJlZMO8cmZlbiAKZGVyIHNjaHJpZnRsaWNoZW4gWnVzdGltbXVuZyBkZXMgamV3ZWlsaWdlbiBBdXRvcnMgYnp3LiBFcnN0ZWxsZXJzLiBEb3dubG9hZHMgCnVuZCBLb3BpZW4gZGllc2VyIFNlaXRlIHNpbmQgbnVyIGbDvHIgZGVuIHByaXZhdGVuLCBuaWNodCBrb21tZXJ6aWVsbGVuIApHZWJyYXVjaCBnZXN0YXR0ZXQuIFNvd2VpdCBkaWUgSW5oYWx0ZSBhdWYgZGllc2VyIFNlaXRlIG5pY2h0IHZvbSBCZXRyZWliZXIgZXJzdGVsbHQgd3VyZGVuLCAKd2VyZGVuIGRpZSBVcmhlYmVycmVjaHRlIERyaXR0ZXIgYmVhY2h0ZXQuIEluc2Jlc29uZGVyZSB3ZXJkZW4gSW5oYWx0ZSBEcml0dGVyIGFscyBzb2xjaGUgCmdla2VubnplaWNobmV0LiBTb2xsdGVuIFNpZSB0cm90emRlbSBhdWYgZWluZSBVcmhlYmVycmVjaHRzdmVybGV0enVuZyBhdWZtZXJrc2FtIHdlcmRlbiwgYml0dGVuIHdpciB1bSBlaW5lbiBlbnRzcHJlY2hlbmRlbiBIaW53ZWlzLiAKQmVpIEJla2FubnR3ZXJkZW4gdm9uIFJlY2h0c3ZlcmxldHp1bmdlbiB3ZXJkZW4gd2lyIGRlcmFydGlnZSBJbmhhbHRlIHVtZ2VoZW5kIGVudGZlcm5lbi48L3A+","pos":{"top":5134,"left":5686},"hoehe":491,"breite":380,"farbe":[221,221,221],"textcolor":[0,0,0],"fontsize":18,"canvas":{"d1428791317251":1}},"blockiert":0},"PASSWORD":{"a":1,"n":1,"g":null},"NAME":"Impressum","BACKGROUND":"C#ffffff","VISIBILITY":0,"CHANGED":1434806902182}
};

// Names
var NAMES = {'Sokrates':0,'Platon':0, 'Euklid':0, 'Thales':0,'Pythagoras':0,'Archimedes':0,'Diophant':0,'Brahmagupta':0,'Fibonacci':0,'Cardano':0,'Kepler':0,'Fermat':0,'Descartes':0,'Bernoulli':0,'Leibniz':0,'Euler':0,'Lagrange':0,'Laplace':0,'Fourier':0,'Cauchy':0,'Abel':0,'Dirichlet':0,'Cayley':0,'Kronecker':0,'Riemann':0,'Cantor':0,'Hilbert':0,'Banach':0,'Aristoteles':0,'Demokrit':0,'Eratosthenes':0,'Feuerbach':0,'Kant':0,'Lessing':0,'Marx':0,'Nietzsche':0};
var IDS = {};	// hier werden die socket.ids den userids zugeordnet (socket.id : reconnectID)


db_read();
// ---------------------------------------------------------------------
// Datenbank Funktionen
// ---------------------------------------------------------------------
function db_read(){
	db.serialize(function(){
		db.each("SELECT board, name FROM boards_db", function (err,row){
			if (row.board==null) { db_board_delete(row.name);}		
			else{
				var d = JSON.parse(row.board);
				if (d.CHANGED + YEAR < new Date().getTime() )
					db_board_delete(row.name);
				if (JSON.stringify(d.DIVS) == "{}")
					db_board_delete(row.name);
				else{
					BOARDS[ row.name ] = new BOARD (row.name, row.board);
					if ( DEBUG>4 ) console.log( "Content: "+JSON.stringify(BOARDS[row.name])+" Name: "+row.name+ "typ: "+typeof(row.name));
				}
			}
		});
	});
}
// ---------------------------------------------------------------------
function db_save(){
	var d = new Date().getTime();
	for ( var id in BOARDS ){
		if ( ( d - BOARDS[id].get.changed() ) <= db_interval ) {
			db_save_board( id );
		} else {
			if ( DEBUG>1 ) console.log('not saving board:',id);
		}
	}
}
// ---------------------------------------------------------------------
function db_save_board(bid){
	if (SPECIAL_BOARDS[bid]==undefined){
		db.serialize(function(){
			db.run("UPDATE boards_db SET board ='"+BOARDS[ bid ].get.save_data()+ " 'WHERE name ='"+bid+"'");
			if (DEBUG>1) console.log('save board:',bid);
			BOARDS[ bid ].save_notification();
		});
	}
}
// ---------------------------------------------------------------------
function db_board_add(id,save_data){										// Board der DB hinzufügen
	if (save_data == undefined) return false;
	db.serialize(function() {
		var stmt = db.prepare("INSERT INTO boards_db (board, name) VALUES (?,?)");
		stmt.run(save_data,id);						
		stmt.finalize();  
	});
} 

function db_board_delete(id){
	db.serialize(function() {
		var stmt = db.prepare("DELETE FROM boards_db WHERE name='"+id+"'");
		stmt.run();						
		stmt.finalize();  
	});
}
// ---------------------------------------------------------------------
// ENDE Datenbank
// ---------------------------------------------------------------------


// ---------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------
// return random name, which is still free

function set_username (){
	var i=0;
	var u_names=[];
	for (var n in NAMES){
		if (NAMES[n] == 0){
			u_names[i]=n;
			i++;
		}
	}
	if (i != 0){
		var j = zufall(0,i-1);
		console.log("NAME ausgewählt: "+u_names[j]);
		return u_names[j];
	}else return 1;
}

function isUser(sid) {
	if ( typeof(USERS[IDS[sid]]) == "object" ) return true;
	for (var i in BOARDS) {
		BOARDS[i].disconnect(sid);
	}
	return false;
}
// ---------------------------------------------------------------------
// Client-Kommunikation
// ---------------------------------------------------------------------
var USERS = {};

// Nutzer-Object
var USER = function(id,s,sid) {
	// reconnectID umbennenen???
	var reconnectID = id; 			// first socket.id load from cache e.g to find presentation master
	var SID = sid;		// socket.id to find USER
	var T = this;
	this.socket = s;
	
	var _board = 1;	 // current board
	var _followers = false;
	var _following = false;
	var _slide = 0;
	var _name = 0;

	// --------------------- getter ------------------------------------
	this.get = {};
	this.get.board     = function(){ return _board; };
	this.get.followers = function(){ return _followers; }
	this.get.slide     = function(){ return _slide; }
	this.get.name	   = function(){ return _name;}
	this.get.reconnectID = function(){ return reconnectID;}
	this.get.sid	   = function(){ return SID; }
	this.get.public_presentation = function(){ 
		if ( _followers===false ) return false;
		return true;
	};
	// --------------------- setter ------------------------------------
	this.set = {};
	this.set.name = function (n){
		// kein name im cache
		if (n == 0){
			_name = set_username();
			if (_name==1){ _name=SID;}		// kein name -> socket.id 
			NAMES[_name] = reconnectID;
			return;
		}else{	// name wird gesendet (cache oder via chat)
			var gesetzt=0;
			for (var name in NAMES){
				if (n == name){
					// keinen NAMENKLAU
					for (var u in USERS){
						if (u==NAMES[n] && u != reconnectID){
							informUser(SID,'username_set',_name);
							return;
						}
					}
					NAMES[name] = reconnectID;
					gesetzt =1;
				}
			}
			if (gesetzt = 0){
				for (var name in NAMES){
					if (NAMES[name]== reconnectID){
						NAMES[name]=0;
					}
				}
				NAMES[n]=reconnectID;
			}
			_name = n;
		}
		informUser(SID,'username_set',_name);
		console.log("NAMES: "+JSON.stringify(NAMES)+" eingetragen wurde: "+ _name);
	}
	
	this.set.sid = function(s){
		if ( DEBUG>3 ) console.log("socket.id changed from "+SID+" to "+s+".!!!");
		SID=s;
	}
	
	this.set.slide  = function(bid,snr) {
		if ( DEBUG>3 ) console.log('slide_show',{bid:bid,snr:snr});
		_slide = snr;
		if ( _followers == false ) return false;
		var u = _followers;
		for (var i=0; i<_followers.length; i++ ) {
			if ( isUser( _followers[i]) ) { informUser(_followers[i],'slide_shown',SID,bid,snr); }
			else { U.follower_remove( u[i] ); }
		}
	}
	
	this.recover_board = function(){		// zustand vor disconnect herstellen
			informUser(SID,"board_get",_board);	
	}

	
//	
// PRÄSENTATION ALS EXTRAOBJEKT AUSGLIEDERN UND MASTER ID SPEICHERN
//

	// -----------------------------------------------------------------
	// follow presentations 
	// -----------------------------------------------------------------
	this.set.following = function(id) {
		// ggf. von alter Präsentation trennen
		if (_following != false && isUser(_following) ) {
			USERS[_following].follower_remove(SID);
		}
		// ggf. mit neuer Präsentation verbinden
		if ( id != false && isUser(id) ) {
			USERS[id].follower_add(SID);
			_following = id;
			informUser(SID,'following',USERS[id].get.board(),id,USERS[id].get.slide(),BOARDS[ USERS[id].get.board()].get.name() );
		} else {
			_following = false;
			informUser(SID,'following',false,false);
		}
		if (DEBUG>3) console.log(SID + " connects to "+id);
	}
	this.set.allow_followers = function() { _followers = []; _slide = 0; }
	this.set.deny_followers  = function() { 
		for (var i=_followers.length-1; i>=0; i--) {
			if ( isUser(_followers[i]) === true ) {
				USERS[ _followers[i] ].set.following(false);
			}
		}
		_followers = false;
	}
	this.follower_add = function(id) {
		if ( typeof(_followers == "object") && _followers.indexOf(id)==-1 ) {
			_followers.push(id);
			for (var i=0; i< _followers.length; i++) {
				if ( isUser(_followers[i]) === false ) { _followers.splice(i,1); }
			}
			informUser(SID,'followers',JSON.stringify(_followers));
			if (DEBUG>3) console.log(SID+' folgen',_followers );
		}
	}
	this.follower_remove = function(id) {
		if ( typeof(_followers == "object") && _followers.indexOf(id)>-1 ) {
			_followers.splice(_followers.indexOf(id),1);
			// 
			for (var i=0; i< _followers.length; i++) {
				if ( isUser(_followers[i]) === false ) { _followers.splice(i,1); }
			}
			informUser(SID,'followers',JSON.stringify(_followers));
			if (DEBUG>3 ) console.log(SID+' folgen',_followers );
		}
	}
	var followers_drop= function(){
		
	}
	// -----------------------------------------------------------------
	// Change boards, disconnect ...
	// -----------------------------------------------------------------
	this.boardchange = function(bid,pw){
		if (DEBUG>2) console.log( SID+' altes Board: '+ _board );
		if (DEBUG>2) console.log("Boardwechsel: "+SID+" ("+bid+")");

		// -------------------------------------------------------------
		if ( BOARDS[ bid ] == undefined ){
			informUser(SID,'board_fehlt');
			return;
		}
		// -------------------------------------------------------------
		if ( BOARDS[ _board ] != undefined ) BOARDS[ _board ].disconnect(SID);
		// -------------------------------------------------------------
		// Handle Presentations
		var snr = false;
		if ( _following != false && isUser(_following) ) snr = USERS[ _following ].get.slide();
		// -------------------------------------------------------------
		if (DEBUG>2) console.log("Boardwechsel: "+SID+" ("+bid+")");
		BOARDS[ bid ].connect(SID,pw,snr);
		_board = bid;
	}
	// -----------------------------------------------------------------
	this.disconnect = function(){
		console.log( 'Disconnect', SID );
		// -------------------------------------------------------------
		T.set.following(false);
		T.set.deny_followers();
		// -------------------------------------------------------------
		BOARDS[ _board ].disconnect( SID );
		// -------------------------------------------------------------
		//delete ( USERS[ SID ] );
	}

	// -----------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------
	function informFollowers(uid, event, data1,data2, data3, data4){
		for ( var o in _followers ) {
			var f_sid=USERS[o].get.sid();
			io.sockets.socket(f_sid).emit( event, data1, data2, data3, data4 );
		}
	}
}

// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on('connection', function(socket) {
	
	// Nutzerobject anlegen
	USERS[ socket.id ] = new USER(socket.id,socket,socket.id); // wird erst nach id_set angelegt oder in einen bereits bekannten gelegt
	IDS[socket.id]=socket.id;	//verhindert server crash beim starten

	informUser(socket.id, 'your_id', socket.id);
	informUser(socket.id, 'special_boards', SPECIAL_BOARDS);
	// öffentliche Präsentationen anzeigen
	public_presentations();
	
	// Statusmitteilung im Chat
	informUser(socket.id,'chat', { zeit: new Date().getTime(), name:"Statusmitteilung", text: 'Mit dem Server verbunden!' });	

	// -----------------------------------------------------------------
	// Boards administrieren
	// -----------------------------------------------------------------
	socket.on('board_add',function(){
		var bid = sha1( socket.id + new Date().getTime()).substr(3,16);
		BOARDS[ bid ] = new BOARD(bid,"new",socket.id);
	});	

	// -----------------------------------------------------------------
	//Board Events
	socket.on('board_copy',	   function(	  ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].copy(socket.id);	});
	socket.on('board_delete',  function(	  ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].delete_board(socket.id); });
	socket.on('board_export',  function(      ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].export(socket.id); });
	socket.on('board_change',  function(bid,pw){ USERS[ IDS[socket.id] ].boardchange(bid,pw); });
	socket.on('disconnect',    function(      ){ if (USERS[IDS[socket.id]] == undefined ) return; USERS[ IDS[socket.id] ].disconnect(); });
	socket.on("password_set",  function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].set.password(data[0],data[1],socket.id); });
	socket.on('visibility_set',function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].set.visibility(data,socket.id); });
	socket.on('grid_set',	   function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].set.grid(data,socket.id); });
	//Change Events
	socket.on('background_set',function( back ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].set.background( back, socket.id ); });
	socket.on('bname_set',     function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].set.name(data,socket.id); });
	socket.on('chat', 		   function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].chat(data,socket.id);});
	socket.on("element_change",function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].change(data,socket.id);});
	socket.on("element_import",function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].import(data,socket.id);});
	socket.on("element_remove",function( data ){ BOARDS[ USERS[ IDS[socket.id] ].get.board() ].remove(data,socket.id); });
	socket.on('verbinder_delete', function( data ){BOARDS[ USERS[ IDS[socket.id] ].get.board() ].verbinder_delete(socket.id,data); });	
	
	socket.on('username_set', function( data ){USERS[ IDS[socket.id] ].set.name(data);});
	socket.on('id_set', function (old_id){
		if (old_id == undefined) old_id = socket.id;
		IDS[socket.id] = old_id;
		
		if (USERS[old_id]!= undefined){
			USERS[old_id].set.sid(socket.id);
			//delete USERS[socket.id];
		}
		
		else{
			USERS[old_id]= new USER(old_id,socket,socket.id);
		}
		socket.emit('id_set',old_id);
	});

	socket.on('board_recover',function(url,pw){
		if (url=="Anleitung"){
			USERS[IDS[socket.id]].recover_board();	//recover old board
		}
		else USERS[IDS[socket.id]].boardchange(url,pw);	// connect to url
	});
	// Sonstiges
	socket.on('freie_boards',  function(){ freie_boards(2,socket.id);});
	socket.on('messages_receive', function(bid){ 
		if (bid == undefined){
			bid = USERS[ IDS[socket.id] ].get.board();
		}
		if (BOARDS[bid] == undefined) return false;	// falls Eingabe Blödsinn
		BOARDS[bid].send_messages(socket.id);
	});
	// browser-cache leeren ermöglichen
	socket.on('last_boards_update', function( data ){ 
		var deleted_lb=[];
		for (var i=0; i< data.length;i++){
			if (BOARDS[data[i]]== undefined){
				deleted_lb.push(data[i]);
			}
		}
		io.emit('last_boards_updated',deleted_lb);
	});
	
	// Import
	socket.on('div_read',function(){informUser(socket.id,'div_set');});	// nur Signal an Client

	// -----------------------------------------------------------------
	// public presentations
	// -----------------------------------------------------------------
	// Wenn keine Präsentation offen ist, so "false"
	// Bei einer offenen Präsentation Array mit UIDs

	socket.on('presentation_open',function(data){
		var U = USERS[ IDS[socket.id]];
	//	if ( U.get.rechte() < GUEST ) return false;
		if (typeof data !=='boolean' ) return false;
		var d = JSON.parse(data);
		if (DEBUG > 1) console.log("public_presentations ("+socket.id+"): ", d);
		if (d==true) {	
			U.set.allow_followers();
		} else { 
			U.set.deny_followers();
		}
		informUser(socket.id,'followers',JSON.stringify( U.get.followers() ));
		public_presentations(1);
		console.log('op',U.get.public_presentation() );
	} );
	socket.on("slide_show",function(bid,snr){ USERS[ IDS[socket.id]].set.slide(bid,snr); });
	socket.on('presentation_connect',	 function( id ){ USERS[ IDS[socket.id] ].set.following( id );	});
	socket.on('presentation_disconnect',function( id ){ USERS[ IDS[socket.id] ].set.following( false );	});

	
	
	// -----------------------------------------------------------------
	// interne Funktionen
	function public_presentations(a){
		var b = {};
		for (var id in USERS) {
			if ( USERS[id].get.public_presentation()===true) { 
				b[id] = { board_id:USERS[id].get.board(), board_name: BOARDS[ USERS[id].get.board() ].get.name() };
			}
		}
		if ( a==1 ) {
			// An alle senden
			informAll('public_presentations',JSON.stringify(b));
		} else {
			informUser(socket.id,'public_presentations',JSON.stringify(b));
		}
		if (DEBUG>1) console.log("public_presentations: "+ b);
	}
});


function freie_boards(a,uid){
	var b=[];
	for (var bid in BOARDS){
		if( BOARDS[bid].get.visibility() == 1 ){
			b.push({id:bid,name:BOARDS[bid].get.name()}); 
		}
	}
	if ( a==1 ) {
		informAll('freie_boards',b);
	} else {
		informUser(uid,'freie_boards',b);
	} 
	if (DEBUG>1) console.log("Freie Boards: ", b);
}
// ---------------------------------------------------------------------
// Boards
// ---------------------------------------------------------------------
var BOARD = function (bid, data,uid){
	var NEW = false;
	
	// -----------------------------------------------------------------
	// Create Data for a new Board
	if (data == "new" && uid != undefined && isUser(uid) ) {
		NEW = true;
		data = JSON.stringify( { 
			DIVS:       {},
			NAME:       bid, 
			VISIBILITY: 0, 
			CHANGED:    new Date().getTime(), 
			BACKGROUND: "",
			PASSWORD:   {a:null,n:null,g:null},
			MESSAGES: 	[],
			GRID:		40
		} );
		if (DEBUG>1) { console.log("board_added " + bid); }
	} else if ( data == "new") {
		return false;
	}
	
	// -----------------------------------------------------------------
	
	var B            = this;
	var BID           = bid;	
	var USERS_here    = {};		// ID : recht
	var D             = JSON.parse(data);
	var MESSAGES	  = [];
	// -----------------------------------------------------------------
	// replace old names
	if ( D.all_divs    != undefined ) { D.DIVS       = D.all_divs;    }
	if ( D.aenderung   != undefined ) { D.CHANGED    = D.aenderung;   }
	if ( D.hintergrund != undefined ) { D.BACKGROUND = D.hintergrund; }
	//if ( D.passwort    != undefined ) { D.PASSWORD 	 = {g:D.passwort.gast, n: D.passwort.nutzer, a: D.passwort.admin};	}
	if ( D.passwort    != undefined ) { D.PASSWORD 	 = {g:D.passwort.g, n: D.passwort.n, a: D.passwort.a};	}
	if ( D.name        != undefined ) { D.NAME       = D.name;        }
	if ( D.sichtbar    != undefined ) { D.VISIBILITY = D.sichtbar;    }
	//if ( D.PASSWORD.gast != undefined ||D.PASSWORD.gast ==null){ D.PASSWORD = {g:D.passwort.gast, n: D.passwort.nutzer, a: D.passwort.admin};}
	if ( D.MESSAGES    != undefined ) { MESSAGES = D.MESSAGES;		  }
	// -----------------------------------------------------------------
	// only import wanted data
	var DIVS          = D.DIVS;
	var CHANGED       = D.CHANGED;
	var BACKGROUND    = D.BACKGROUND;
	if ( BACKGROUND == undefined || BACKGROUND == "" ) BACKGROUND="C#ffffff";
	if ( D.GRID     == undefined ) { D.GRID=40; }
	var GRID 		  = D.GRID;
	var PASSWORD      = D.PASSWORD;
	var NAME          = D.NAME;
	var VISIBILITY    = D.VISIBILITY;
 
	
	delete( D );
	// unblock_elements
	for ( var did in DIVS ) {
		DIVS[ did ].blockiert = 0;
	}
	// -----------------------------------------------------------------
	if (NEW) {
		NEW = false;
		db_board_add( bid,JSON.stringify({
			DIVS:       DIVS,
			CHANGED:    CHANGED,
			BACKGROUND: BACKGROUND,
			PASSWORD:   PASSWORD,
			NAME:       NAME,
			VISIBILITY: VISIBILITY,
			MESSAGES:	MESSAGES,
			GRID:		GRID
		}) );
		informUser(uid,'board_added',bid);
	}
	//------------------------------------------------------------------
	this.get = {};
	//------------------------------------------------------------------
	this.get.visibility = function (uid){ return VISIBILITY; };
	this.get.changed    = function (uid){ return CHANGED; };
	this.get.name       = function (uid){ return NAME; };
	this.get.messages	= function (uid){ return MESSAGES; };
	this.get.grid		= function (uid){ return GRID; };
	this.get.save_data  = function (   ){
		return JSON.stringify({
			DIVS:       DIVS,
			CHANGED:    CHANGED,
			BACKGROUND: BACKGROUND,
			PASSWORD:   PASSWORD,
			NAME:       NAME,
			VISIBILITY: VISIBILITY,
			MESSAGES:	MESSAGES,
			GRID:		GRID
		});
		
	}
	//------------------------------------------------------------------
	this.set = {};
	//------------------------------------------------------------------
	this.set.visibility = function ( data , uid) {
		if ( USERS_here[ IDS[uid] ] < ADMIN ) return false;
		VISIBILITY = data;
		freie_boards(1,uid);
		CHANGED = new Date().getTime();
		db_save_board( BID );	
	}
	//------------------------------------------------------------------
	this.set.name = function (name, uid) {				
		if ( USERS_here[ IDS[uid] ] < ADMIN ) return false;
		if ( typeof name !== "string") return false;
		if (DEBUG>3) console.log("set Board name:"+BID+" "+name);
		NAME    = name;
		CHANGED = new Date().getTime();
		if ( VISIBILITY == 1 ) {
			informAll( 'board_renamed',{ id:BID,name:name} );
			freie_boards(1);
		} else {
			informUser(uid, 'board_renamed',{ id:BID,name:name} );
		}
		db_save_board( BID );
	}
	//------------------------------------------------------------------
	this.set.password = function (a, p, uid) {			
		if ( USERS_here[ IDS[uid] ] < ADMIN ) return false;
		if ( DEBUG>1 ) console.log("password_set",  uid );
		if ( DEBUG>3 ) console.log("password_set", PASSWORD);
		// Nur definierte Gruppen zulassen
		if (a!='admin' && a!= 'nutzer' && a!='gast') return false;
		// Gespeichert wird ein verschlüsseltes Passwort
		// Das führende "$" kennzeichnet dieses
		if ( p=="" ) {
			PASSWORD[ a[0] ] = null;
		} else {
			PASSWORD[ a[0] ] = "$" + sha1( BID + p );
		}
		CHANGED = new Date().getTime();	
		db_save_board( BID );
	}
	//------------------------------------------------------------------
	this.set.background = function (back, uid) {
		if ( USERS_here[ IDS[uid] ] < NUTZER ) return false;
		BACKGROUND = back;
		CHANGED = new Date().getTime();	
		informAllUsers('background_set',back);
	}
	//------------------------------------------------------------------
	this.set.grid = function (dist, uid) {
		if ( USERS_here[ IDS[uid] ] < NUTZER ) return false;
		GRID = dist;
		CHANGED = new Date().getTime();
		informAllUsers("grid_set",dist);
	}
	// -----------------------------------------------------------------
	// Users on board
	// -----------------------------------------------------------------
	this.connect = function( uid,pw,slide ){
		console.log('user:'+uid+" "+sha1(BID+pw));
		if ( !isUser( uid ) ) return false;
		var right=0;
		if ( PASSWORD.g == null || PASSWORD.g === "$"+sha1( BID +pw) ) right = GUEST;
		if ( PASSWORD.n == null || PASSWORD.n === "$"+sha1( BID +pw) ) right = NUTZER;
		if ( PASSWORD.a == null || PASSWORD.a === "$"+sha1( BID +pw) ) right = ADMIN;
		USERS_here[ IDS[uid]  ] = right;
		// -------------------------------------------------------------
		// Alle Elemente übertragen
		if ( right >= GUEST ) {
			if  ( CHANGED+WEEK <= new Date().getTime() ) CHANGED = new Date().getTime();	
			for (d in DIVS){ informUser(uid,'element_changed',DIVS[d] ); }
		}	
		B.send_messages(uid);
		informUser(uid,'chat',{ zeit: new Date().getTime(), name:"Statusmitteilung", text: 'Boardwechsel zu Board "'+NAME+'"' });	
		informUser(uid,'board_changed',BID,NAME,right,(slide==true) );
		informUser(uid,'background_set',BACKGROUND );
		informUser(uid,"grid_set",GRID);
		B.show_users_on_board();
	}
	
	// -----------------------------------------------------------------
	this.disconnect = function(uid){
		if ( USERS_here[  IDS[uid]  ] == undefined ) return false;
		delete( USERS_here[  IDS[uid]  ] );
		// unblock elements
	//	if (USERS[  IDS[uid]  ] != undefined){
			for ( var did in DIVS ) {
				if ( DIVS[ did ].blockiert == USERS[  IDS[uid]  ].get.sid() ) {
					DIVS[ did ].blockiert = 0;
					informAllUsers('element_changed',{id:did,blockiert:0});
				}
			}
	//	}
		B.show_users_on_board();
	}
	// -----------------------------------------------------------------
	this.chat = function(data,uid){
		if ( USERS_here[  IDS[uid]  ] < NUTZER )return false;
		if ( typeof data !== "object"	)return false; 
		if (MESSAGES == undefined){MESSAGES = {};};
		//var nid = uid+new Date().getTime();
		MESSAGES.push({ zeit: new Date().getTime(), name: data.name || USERS[IDS[uid]].get.name(), text: data.text });
		informAllUsers('chat', { zeit: new Date().getTime(), name: data.name || USERS[IDS[uid]].get.name(), text: data.text },uid);
		CHANGED = new Date().getTime();
	}
	this.send_messages = function(uid){
		if ( USERS_here[  IDS[uid] ] < NUTZER )return false;
		if (MESSAGES != undefined){
			informUser(uid,'messages_received',MESSAGES);
		}
	}
	// -----------------------------------------------------------------
	this.show_users_on_board = function() {
		var b = [];
		for (var o in USERS_here  ) { b.push(o); }
		//informAllAdmins('users_on_board', JSON.stringify(b) );	!!!
	}
	// -----------------------------------------------------------------
	// Elements
	// -----------------------------------------------------------------
	// remove Element
	// needs DIV-ID and USER-ID
	this.remove = function (did,uid) {
		if ( USERS_here[ IDS[uid] ] < NUTZER ) return false;
		if ( DEBUG > 4 ) console.log("element_remove", did);
		informAllUsers('element_removed',did,BID);
		delete DIVS[ did ];
		CHANGED = new Date().getTime();
	}
	// -----------------------------------------------------------------
	// Change Element
	// needs data, "s", "d" or "t" and USER-ID
	this.change = function ( data,uid,IMPORT ){
		if ( USERS_here[ IDS[uid] ] < NUTZER ) return false;
		// Falls falsche Eingabe
		if( typeof data !== 'string' && (data[0]!='{'|| data[data.length-1]!='}' ) )return false; 
		if (DEBUG>4) console.log("element changed("+BID+":"+USERS_here[  IDS[uid]  ]+"): ",data);
		d = JSON.parse(data);
		// id must be given
		if (d.id == undefined || ( d.id[0]!="d" && d.id[0]!="s" && d.id[0]!="t" ) ) return false;
		// Create Element if no id is given
		if (d.id.length == 1){
			d.id += new Date().getTime();
			DIVS[ d.id ]={};		
			if ( DEBUG > 5 ) console.log("Neues Element",d.id);
		}
		// import Element
		if (IMPORT ==1){
			DIVS[d.id]={};
			if ( DEBUG > 5 ) console.log("Import Element",d.id);
		}
		
		if ( DIVS[ d.id] == undefined ) return false;
		// Handle Blocking
		if ( DIVS[ d.id ].blockiert == undefined ) DIVS[ d.id ].blockiert = 0;
		if ( d.blockiert != undefined ){
			
			if ( d.blockiert != 0 && DIVS[ d.id ].blockiert == 0 ) {
				d.blockiert = USERS[  IDS[uid]  ].get.sid();
			} else if ( d.blockiert == 0 && DIVS[ d.id ].blockiert == USERS[  IDS[uid]  ].get.sid()) {
				d.blockiert = 0;
			}
			
			/*if ( d.blockiert != 0 && DIVS[ d.id ].blockiert == 0 ) {
				d.blockiert = USERS[  IDS[uid] ].get.name();
			} else if ( d.blockiert == 0 && DIVS[ d.id ].blockiert == USERS[  IDS[uid]  ].get.name() ) {
				d.blockiert = 0;
			} */else {
				delete ( d.blockiert );
			}
		}
		// transfer data into DIVS
		for (var i in d ) { DIVS[ d.id ][ i ] = d[ i ]; }
		informAllUsers("element_changed",  d );
		CHANGED = new Date().getTime();
	}
	// Delete Verbinder
	this.verbinder_delete = function ( uid, vid){
		var U = USERS[IDS[uid]];
		if( USERS_here[ IDS[uid] ] <NUTZER) return false;
		informAllUsers('verbinder_deleted',vid);
		CHANGED = new Date().getTime();	
	} 
	// -----------------------------------------------------------------
	// Copy Board
	// -----------------------------------------------------------------
	this.copy = function ( uid ) {
		var U = USERS[IDS[uid]];
		if( USERS_here[ IDS[uid] ] <ADMIN) return false;	
		var id = sha1( uid+ new Date().getTime()).substr(3,16);
		var data =  JSON.stringify({
			DIVS:       DIVS,
			CHANGED:    new Date().getTime(),
			BACKGROUND: BACKGROUND,
			PASSWORD:   {a:null,n:null,g:null},
			NAME:       id,
			VISIBILITY: 0,
		});

		BOARDS[ id ] = new BOARD(id,data,IDS[uid]);
		db_board_add(id,B.get.save_data());
		informUser(uid,'board_copied',id);
	}
	// -----------------------------------------------------------------
	// delete Board
	// -----------------------------------------------------------------
	this.delete_board = function( uid ) {
		var U = USERS[IDS[uid]];
		if( USERS_here[ IDS[uid] ] < ADMIN) return false;
		delete BOARDS[ bid ];
		db_board_delete(bid);
		for (var u in USERS){
			if (USERS[u].get.board()== bid){
				informUser(USERS[u].get.sid(),"board_deleted");
			}
		}
		freie_boards(1);
	}
	// -----------------------------------------------------------------
	// Export / Import
	// -----------------------------------------------------------------
	this.export = function( uid ) {
		var U = USERS[IDS[uid]];
		if( USERS_here[ IDS[uid] ] < GUEST) return false;
		var b = {
			DIVS:JSON.parse( JSON.stringify( DIVS )),
			PASSWORD:{a:"",n:"",g:""},
			NAME:NAME,
			BACKGROUND:BACKGROUND,
			VISIBILITY:0,
			CHANGED: CHANGED
		};
		// Remove Locks
		for (var i in b.DIVS) { b.DIVS.blockiert = 0; }
		informUser(uid, 'board_exported',JSON.stringify( b ) );
	}
	
	this.import = function (data, uid){
		B.change(data,uid,1); 
	};
/*	this.overwrite = function  (uid, data){		// löst zusätzlich zum import löschen alter daten aus.
		B.change(data,uid,1);
	
	};*/
	// Import fehlt noch
		//	if (Event =="div_import"|| Event =="slide_import")
		//		boards[ U.get.board() ].all_divs[d.id]={};				
		// ggf blockieren oder freigeben
	
	// Statusmeldung board saved 	
	this.save_notification = function (){
		informAllUsers('chat', { zeit: new Date().getTime(), name:"Statusmitteilung", text: 'board saved!' });
	}
	// -----------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------

	// -----------------------------------------------------------------

	// -----------------------------------------------------------------
	function informAllUsers(event, data1, data2, data3, data4 ){
		for ( var o in USERS_here ) {
			var s = USERS[o].get.sid();
			if (IDS[s]==o){
				if ( isUser(s) && USERS_here[o] >= GUEST ) {
					if (io.sockets.connected[s]) {
						io.sockets.connected[s].emit(event, data1, data2, data3, data4);
					}
				}
			}	
		}
	};
	function informAllAdmins(event, data1, data2, data3, data4 ){
		for ( var o in USERS_here ) {
			var sid = USERS[o].get.sid();
			if ( isUser(sid) && USERS_here[o] >= ADMIN ) {
				if (io.sockets.connected[sid]) {
					io.sockets.connected[sid].emit(event, data1, data2, data3, data4);
				}
			}
		}
	};
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
function zufall(a,b) {
	var r=a+Math.floor((Math.random()*(b-a+1)));
    return r;
}

for (var i in SPECIAL_BOARDS){
	BOARDS[ i ] = new BOARD (i, JSON.stringify(SPECIAL_BOARDS[i]));
}

function informUser(uid,event,data1,data2,data3,data4) {
	if (io.sockets.connected[uid]) {
		io.sockets.connected[uid].emit(event, data1, data2, data3, data4);
	}
};

function informAll(event, data1, data2, data3, data4 ){
	for ( var o in USERS ) {
		var sid = USERS[o].get.sid();
		if ( isUser(sid) ) {
			if (io.sockets.connected[sid]) {
				io.sockets.connected[sid].emit(event, data1, data2, data3, data4);
			}
		}
	}
};
