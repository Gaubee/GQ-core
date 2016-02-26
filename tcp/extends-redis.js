// client 拓展 出Redis指令
exports.handleClient = handleClient;

function handleClient(socket) {
	const redis_server_component_name = "Redis:Server";
	socket.redisClient = function(app_name) {
		return socket.initComponent(app_name || socket.using_app.app_name, redis_server_component_name, [])
	};

	const redisCommands = require("./redis-commands.json");
	const redisMethods = redisCommands.filterMap(redis_command => {
		return redis_command.command.indexOf(" ") === -1 && {
			name: redis_command.command,
			params: redis_command.args.map(arg => {
				return {
					name: arg
				};
			}),
			des: redis_command.des
		}
	});
	// 挂起一个redis组件服务
	socket.redisServer = function(options, redis_init_args) {
		options || (options = {});
		redis_init_args = Array.asArray(redis_init_args);

		const des = options.des || "通用Redis服务";
		const redis = require("redis");

		return socket.registerComponent(redis_server_component_name, {
			des: des,
			methods: redisMethods
		}, function createRedisServer() {
			const client = redis.createClient.apply(redis, redis_init_args);
			const clientProxy = redisMethods.reduce(function(res, redis_method) {
				const method_name = redis_method.name;
				if (res[method_name]) {
					return res;
				}
				res[method_name] = function() {
					const args = Array.slice(arguments);
					return new Promise((resolve, reject) => {
						args.push((err, res) => {
							err ? reject(err) : resolve(res);
						});
						client[method_name].apply(client, args)
					});
				};
				return res;
			}, Object.create(null));

			clientProxy[socket.destroy_symbol] = function() {
				client.end(true);
				return true;
			};
			return clientProxy;
		});
	}
}