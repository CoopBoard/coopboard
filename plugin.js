var EventEmitter = events.EventEmitter;
 
plugin = new EventEmitter();
var normalizedPath = path.join(__dirname, "plugins");

fs.readdirSync(normalizedPath).forEach(function(file) {
	require(path.join(normalizedPath,file));
	//plugin.setMaxListeners(plugin.getMaxListeners()+1);
});

plugin.on("newListener", function (evtName, fn) {
	console.log("[Pluginmanager] Loaded Plugin: " + evtName);
});
 
plugin.on("removeListener", function (evtName) {
	console.log("[Pluginmanager] Unloaded Plugin: " + evtName);
});