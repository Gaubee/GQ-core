// client 拓展 出Redis指令
exports.handleClient = handleClient;
// require("./tcp").config.hidden_groups
var tasks = exports.tasks = new Map();

function handleClient(socket) {
	socket.redisExec = function(handle, args) {
		var task_id = "REDIS-EXEC-TASK-ID-" + Math.random().toString(32).substr(2);
		var p = new Promise(function(resolve, reject) {
			tasks.set(task_id, {
				resolve: resolve,
				reject: reject
			});
			socket.msgInfo("redis-exec", {
				task_id: task_id,
				handle: handle,
				args: args
			});
		});
		return p
	};
	socket.onMsgSuccess("redis-return", function(data, done) {
		console.log(data.info.task_id);
		var task = tasks.get(data.info.task_id);
		tasks.delete(data.info.task_id);
		if (task) {
			task.resolve(data.info.returns);
		}
		done();
	});
	socket.onMsgError("redis-return", function(data, done) {
		console.log(data.info.task_id);
		var task = tasks.get(data.info.task_id);
		tasks.delete(data.info.task_id);
		if (task) {
			task.reject(data.msg);
		}
		done();
	});
}