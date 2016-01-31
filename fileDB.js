require("./$.fs");
require("./$.Object");
require("./$.Array");

var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
const _pre_file_range = 1000; //每一个JSON文件存储1000条数据

var _db_root = __dirname + "/.db/";
if (!fs.existsSync(_db_root)) {
	fs.mkdirSync(_db_root);
}

var _ti = {};
var _file_v2_db_file_content = ""

//数据缓存文件
if (fs.existsSync(_db_root + "file_v2_db.js")) {
	var _db = require(_db_root + "file_v2_db.js");
	_file_v2_db_file_content = fs.readFileSync(_db_root + "file_v2_db.js").toString();
} else if (fs.existsSync(_db_root + "data.cache.json")) {
	_db = require("./.db/data.cache.json");
	// fs.writeFileSync(_db_root + "file_v2_db.js", _file_v2_db_file_content);
	console.log("DB-V2 录入数据");
	process.nextTick(function() {
		Object.keys(_db).forEach(function(tableName) {
			//数据整理，删除空数据
			var _remove_num = 0;
			var _table = _db[tableName];
			for (var i = 0, _len = _table.length; i < _len; i += 1) {
				var v = _table[i];
				if (!v) {
					_table.splice(i, 1);
					_remove_num += 1;
					_len -= 1;
					i -= 1;
				}
			}
			console.log(`< ${tableName} > 共有 ${_remove_num} 条空数据！`);
			foo.__updateCache(tableName);
		});
	});
}
//索引缓存文件
var _index;

// process.on('uncaughtException', function(err) {
// 	console.info("进程未知错误，强行数据写入", err, err.stack);
// 	foo.__storeIntoOneFile();
// });

// function _on_db_exit(type) {
// 	return function() {
// 		console.info("进程意外中断，强行数据写入", type);
// 		foo.__storeIntoOneFile();
// 		process.exit();
// 	}
// };
// process.on('SIGHUP', _on_db_exit("SIGHUP"));
// process.on('SIGINT', _on_db_exit("SIGINT"));
// process.on('SIGQUIT', _on_db_exit("SIGQUIT"));
// process.on('SIGABRT', _on_db_exit("SIGABRT"));
// process.on('SIGTERM', _on_db_exit("SIGTERM"));
var foo = {
	autoBackup: function() {

		setInterval(function() {
			foo.__storeIntoOneFile("data.cache." + (new Date).format("yy-MM-dd[HH=mm=ss]") + ".json");
			var r = /data\.cache\.(\d\d)\-(\d\d)\-(\d\d)\[(\d\d)\=(\d\d)\=(\d\d)\]\.json/;
			var timeline = 3 * 24 * 60 * 60 * 1000; //3天72小时
			fs.readdirSync(__dirname + "/.db/").forEach(function(fileName) {
				var match_info = fileName.match(r);
				if (match_info) {
					var date = new Date("20" + match_info.slice(1, 4).join("/") + " " + match_info.slice(4).join(":"));
					if ((+new Date() - timeline) > +date) { //如果这个文件的存在时间超过3天，删除
						fs.unlinkSync(__dirname + "/.db/" + fileName);
					}
				}
			});
		}, 3 * 60 * 60 * 1000); //3小时进行一次数据备份，删除3天前的数据

	},
	__storeIntoOneFile: function(fileName) {
		console.time("parse_data");
		var _data = JSON._stringify(_db)
		console.timeEnd("parse_data");
		console.time("update_data");
		if (_data) {
			fs.writeFileSync(_db_root + (fileName || "data.cache.json"), _data);
		}
		console.timeEnd("update_data");
	},
	__updateCache: function(tableName, range_start, range_end) {
		var table = _db[tableName];
		if (range_start) {
			range_start = Math.floor(range_start / _pre_file_range) * _pre_file_range;
		} else {
			range_start = 0
		}
		if (range_end) {
			range_end = Math.ceil(range_end / _pre_file_range) * _pre_file_range; // Math.min(range_end, table.length)
		} else {
			range_end = Math.ceil(table.length / _pre_file_range) * _pre_file_range
		}
		var _range_start = range_start;
		var _range_end = Math.min(range_end, _range_start + _pre_file_range);
		while (_range_start < _range_end) {
			var _task_name = ` <${tableName}>[${_range_start}, ${_range_end}]`;
			//取出指定范围的数据，解析成JSON
			console.time("[parse  data]" + _task_name);
			var _data = table.slice(_range_start, _range_end)
			_data = JSON._stringify(_data);
			console.timeEnd("[parse  data]" + _task_name);

			//写入文件
			console.time("[update data]" + _task_name);
			var _file_name = `${tableName}-${_range_start}-${_range_end}.json`;
			fs.writeFileSync(_db_root + "file_v2_db/" + _file_name, _data);
			console.timeEnd("[update data]" + _task_name);

			//将数据文件写入集合
			if (_file_v2_db_file_content.indexOf(_file_name) == -1) {
				var _placeholder = `\/\/---${tableName}---\n`
				if (_file_v2_db_file_content.indexOf(`\/\/---${tableName}---`) === -1) {
					_file_v2_db_file_content += `exports.${tableName} = [];\n${_placeholder}`
				}
				_file_v2_db_file_content = _file_v2_db_file_content.replace(_placeholder,
					`	exports.${tableName} = exports.${tableName}.concat(require('./file_v2_db/${_file_name}'));\n${_placeholder}`)
			}
			_range_start = _range_end;
			_range_end = Math.min(range_end, _range_end + _pre_file_range);
		}
		_task_name && fs.writeFileSync(_db_root + "file_v2_db.js", _file_v2_db_file_content);
	},
	_updateCache: function(tableName, range_start, range_end) {
		var __ti_name = `${tableName}-${range_start}-${range_end}`;
		clearTimeout(_ti[__ti_name]);
		_ti[__ti_name] = setTimeout(function() {
			foo.__updateCache(tableName, range_start, range_end);
			delete _ti[__ti_name];
		}, 1000);
	},
	_updateCacheByIndex: function(tableName, _index, _to_end) {
		//一千条数据为一个范围
		var _range_start = Math.floor(_index / _pre_file_range) * _pre_file_range;
		var _range_end = Math.ceil(_index / _pre_file_range) * _pre_file_range;
		if (_range_start == _range_end) { //1000:index:0~999
			_range_end += _pre_file_range;
		}
		foo._updateCache(tableName, _range_start, _to_end ? null : _range_end);
	},
	insert: function(db_name, obj, index) {
		db_name = db_name.toLowerCase();
		var table = _db[db_name];
		if (!table) {
			//创建表
			table = _db[db_name] = [];
			//初始化索引
			_index[db_name] = {};
		}
		var table_index = _index[db_name];
		//根据ID判断是否存在这条数据，避免update后再insert，确保ID唯一性
		if (!table_index[obj._id]) { //新数据，直接插入
			var __index = table.push(obj) - 1;
		} else { //update模式
			return foo.update(db_name, obj._id || index, obj)
		}
		if (obj._id || (obj._id = index)) { //更新索引
			table_index[obj._id] = obj;
		}

		foo._updateCacheByIndex(db_name, __index);

		foo.emit("insert", db_name, obj);
	},
	update: function(db_name, obj_index, obj, _is_cover) {
		db_name = db_name.toLowerCase();
		var old_obj = foo.find_by_id(db_name, obj_index);
		if (old_obj) {
			for (var key in obj) {
				if (obj.hasOwnProperty(key)) {
					old_obj[key] = obj[key];
				}
			}
			if (_is_cover) {
				for (var key in old_obj) {
					if (!obj.hasOwnProperty(key)) {
						delete old_obj[key]
					}
				}
			}
			obj._id = obj_index;
			//更新索引的对象
			_index[db_name][old_obj._id] = old_obj;
			foo._updateCacheByIndex(db_name, _db[db_name].indexOf(old_obj));
		} else {
			foo.insert(db_name, obj, obj_index);
		}
	},
	find_by_id: function(db_name, id) {
		db_name = db_name.toLowerCase();
		var table_index = _index[db_name];
		if (table_index) {
			return table_index[id];
		}
	},
	find_one: function(db_name, obj) {
		db_name = db_name.toLowerCase();
		var table = _db[db_name];
		var result;
		if (table instanceof Array) {
			table.every(function(item_obj) {
				if (item_obj && foo._obj_has(item_obj, obj)) {
					result = item_obj;
				} else {
					return true;
				}
			});
		}
		return result;
	},
	find_last_one: function(db_name, obj, sort_key, no_asc) {
		//默认是大~小
		db_name = db_name.toLowerCase();
		var table = _db[db_name];
		var result;
		if (table instanceof Array) {
			table = foo._sortBy(table, sort_key, !no_asc)
			for (var i = table.length - 1, item_obj; i >= 0; i -= 1) {
				item_obj = table[i];
				if (item_obj && foo._obj_has(item_obj, obj)) {
					result = item_obj;
					break;
				}
			}
		}
		return result;
	},
	find_list: function(db_name, obj, num, page) {
		num || (num = Number.MAX_VALUE);
		page || (page = 0);
		var _start_index = (num * page) || 0;
		db_name = db_name.toLowerCase();
		var table = _db[db_name];
		var result = [];
		if (table instanceof Array) {
			for (var i = _start_index, item_obj, len = table.length; i < len; i += 1) {
				item_obj = table[i];
				if (item_obj && foo._obj_has(item_obj, obj)) {
					result.push(item_obj)
				}
				if (result.length > num) {
					break
				}
			}
		}
		return result;
	},
	find_all: function(db_name) {
		db_name = db_name.toLowerCase();
		return _db[db_name] || [];
	},
	remove: function(db_name, obj_index) {
		db_name = db_name.toLowerCase();
		var table = _db[db_name];
		if (!(table instanceof Array)) {
			return
		}
		var __index = false;
		table.every(function(obj, index) {
			if (obj && obj._id === obj_index) {
				__index = index;
				//保持数据长度，替换为无用的null对象
				table.splice(index, 1, null);
				return false;
			}
			return true;
		});
		if (__index !== false) {
			//移除索引中的数据
			_index[db_name][obj_index] = null;
			//因为是删除，所以列表后面的数据都有受到变动
			foo._updateCacheByIndex(db_name, __index);
		}
	},
	remove_list: function(db_name, obj) {
		var remover_list = foo.find_list(db_name, obj);
		remover_list.forEach(function(remover) {
			foo.remove(db_name, remover._id);
		});
	},
	remove_all: function(db_name) {
		db_name = db_name.toLowerCase();
		_db[db_name] = [];
		_index[db_name] = {};
		foo._updateCache(db_name);
	},
	fix_no_id_data: function(db_name) {
		db_name = db_name.toLowerCase();
		var table = _db[db_name];
		var new_table = [];
		table.forEach(function(item) {
			if (item._id) {
				new_table.push(item)
			}
		});
		_db[db_name] = new_table;
		foo._refreshIndex_by_tableName(db_name);
		foo._updateCache(db_name);
	},
	refreshIndex: function() {
		//初始化所需文件夹
		var _need_create_v2 = true
		var _v2_db_name = _db_root + "file_v2_db";
		if (fs.existsSync(_v2_db_name)) {
			_need_create_v2 = !fs.statSync(_v2_db_name).isDirectory()
		}
		if (_need_create_v2) {
			fs.mkdirSync(_v2_db_name)
		}

		//重置索引，消除数组冗余
		_index = {};
		var $exports_list = [];
		for (var tableName in _db) {
			foo._refreshIndex_by_tableName(tableName);
			// foo._create_table(tableName);
		}
	},
	_create_table: function(tableName) {
		var tablePath = _db_root + "file_v2_db/" + tableName;
		if (fs.existsSync(tablePath)) {
			var _no_need_create_dir = fs.statSync(tablePath).isDirectory()
		}
		if (!_no_need_create_dir) {
			fs.mkdirSync(tablePath)
		}
	},
	_refreshIndex_by_tableName: function(tableName) {
		if (_db.hasOwnProperty(tableName)) {
			var table = _index[tableName] = {};
			var _arr = _db[tableName];
			if (_arr instanceof Array) {
				for (var i = 0, len = _arr.length; i < len; i += 1) {
					var obj = _arr[i];
					if (!obj) { //空对象，忽略过
						continue;
					}
					var old_obj = table[obj._id];
					if (old_obj) {
						//删除冗余数据
						_arr.splice(_arr.indexOf(old_obj), 1);
						i -= 1;
					}
					table[obj._id] = obj;
				}
			}
		}
	},
	mulCall: function(method, args) {
		var method_name_map = {
			"insert": "insert",
			"findAll": "find_all",
			"findOne": "find_one",
			"findById": "find_by_id",
			"findList": "find_list",
			"update": "update",
			"remove": "remove",
		}
		var method_foo = foo[method_name_map[method]];
		return args.map(function(params) {
			return method_foo.apply(foo, params)
		});
	},
	//排序函数
	_sortBy: Array.sortBy,
	_obj_has: Object.has,
	_db: _db
};
foo.__proto__ = EventEmitter.prototype;
EventEmitter.call(foo);

module.exports = foo;
global.fileDB = foo;

// var testArr = [{v:1},{v:3},{v:2}]
// var res = foo._sortBy(testArr,"v",true);
// console.log(res);

// var me = foo.find_last_one("visitorinfo", {
// 	bus_id: "www",
// 	user_ip: "127.0.0.1"
// }, "begin_visit_time");
// console.log(me);