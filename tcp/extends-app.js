// client 拓展 出Application指令
exports.handleClient = handleClient;

function handleClient(socket) {
	var tasks = new Map();
	socket.onMsgSuccess("use-app", function(data, done) {
		var task = tasks.get(data.info.app_name);
		if (task) {
			tasks.delete(data.info.app_name);
			task.reslove(data.info);
		}
	});

	socket.onMsgError("use-app", function(data, done) {
		var task = tasks.get(data.info.app_name);
		if (task) {
			tasks.delete(data.info.app_name);
			task.reject(data.msg);
		}
	});
	socket.useApp = co.wrap(function(user_name, password, app_name) {
		if (!(user_name && password && app_name)) {
			throw "user_name, password, app_name could not be empty";
		}
		return new Promise(function(reslove, reject) {
			tasks.set(app_name, {
				reslove: reslove,
				reject: reject
			});
			socket.msgInfo("use-app", {
				user_name: user_name,
				password: password,
				app_name: app_name,
			});
		});
	});
};