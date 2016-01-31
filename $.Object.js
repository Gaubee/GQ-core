require("./$.Object");
//添加不可被forin遍历出来的方法或者属性
Object.defineProperty(Object.prototype, "setUnEnum", {
	enumerable: false,
	value: function(key, value) {
		Object.defineProperty(this, key, {
			enumerable: false,
			value: value
		});
	}
});

function _mix(sObj, nObj) {
	var obj_n,
		obj_s,
		i;
	if (sObj instanceof Object && nObj instanceof Object) {
		for (var i in nObj) {
			if (nObj.hasOwnProperty(i)) {
				obj_n = nObj[i];
				obj_s = sObj[i]; //||(sObj[i]={});
				if (obj_s !== obj_n) { //避免循环 Avoid Circular
					sObj[i] = _mix(obj_s, obj_n);
				}
			}
		}
		var nojson_able_keys = sObj.__nojson_able_keys__;
		if (nojson_able_keys instanceof Array) {
			Object.defineProperty(nObj, "__nojson_able_keys__", {
				enumerable: false,
				value: nojson_able_keys
			});
		}
		return sObj;
	} else {
		return nObj;
	}
};
Object.clone = function(obj) {
	var sobj = obj instanceof Array ? [] : {};
	return _mix(sobj, obj);
};
Object.prototype.setUnEnum("$clone", function() {
	return Object.clone(this)
});
Object.mix = _mix;
Object.prototype.setUnEnum("$mix", function(nObj) {
	return _mix(this, nObj)
});
Object.deepClone = function (obj) {
	return JSON.parse(JSON.stringify(obj));
};
Object.prototype.setUnEnum("$deepClone", function() {
	return Object.deepClone(this)
});
Object.extend = function(instance, extendObj) {
	var instance_proto = instance.__proto__;
	instance = this.clone(instance);
	var new_proto = Object.create(instance_proto);
	Object.keys(extendObj).forEach(function(key) {
		new_proto[key] = extendObj[key];
	});
	instance.__proto__ = new_proto;
	return instance;
};
Object.prototype.setUnEnum("$extend", function(extendObj) {
	return Object.extend(this, extendObj)
});

//多继承
function multiInherits() {
	var args = Array.prototype.slice.call(arguments);
	var obj = this;
	args.forEach(function(extendObj) {
		for (var i in extendObj) {
			obj[i] = extendObj[i];
		}
	});
	return obj;
};
// 对象对比
Object.eql = function obj_eql(obj_a, obj_b) {
	//non-Object
	var result = obj_a === obj_b;
	if (!result) {
		var keys_a = obj_a instanceof Object ? Object.keys(obj_a) : [];
		var keys_b = obj_b instanceof Object ? Object.keys(obj_b) : [];
		if (String(keys_a) == String(keys_b) && String(obj_a) === String(obj_b) /*RegExp,Function*/ ) {
			result = keys_a.every(function(key) {
				var value_a = obj_a[key];
				var value_b = obj_b[key];
				if (value_a === value_b) {
					return true;
				} else {
					var type_a = typeof value_a instanceof Object;
					var type_b = typeof value_b instanceof Object;
					if (type_a === type_b === true) {
						return obj_eql(value_a, value_b);
					}
				}
			});
		}
	}
	return result;
};
Object.prototype.setUnEnum("$eql", function(obj_b) {
	return Object.has(this, obj_b)
});
// 对象是否包含另外一个对象
Object.has = function obj_has(obj_big, obj_small) {
	//non-Object
	var result = obj_big === obj_small;
	if (!result && String(obj_big) === String(obj_small) /*RegExp,Function*/ ) {
		var keys_big = obj_big instanceof Object ? Object.keys(obj_big) : [];
		var keys_small = obj_small instanceof Object ? Object.keys(obj_small) : [];
		if (keys_big.length >= keys_small.length) {
			result = keys_small.every(function(key) {
				if (obj_big.hasOwnProperty(key)) {
					var obj_a = obj_big[key];
					var obj_b = obj_small[key];
					if (obj_a === obj_b) {
						return true;
					} else {
						return obj_has(obj_a, obj_b);
					}
				}
			});
		}
	}
	return result;
};
Object.prototype.setUnEnum("$has", function(obj_small) {
	return Object.has(this, obj_small)
});


Object.prototype.setUnEnum("$multiInherits", multiInherits);
Object.prototype.setUnEnum("$extends", multiInherits);
Object.prototype.setUnEnum("$hasPro", Object.prototype.hasOwnProperty);

Object._cci = {};
Object.setCurrentContextItem = Object.setCci = function(key, value) {
	var old_value = Object._cci[key];
	Object._cci[key] = value;
	setImmediate(function() {
		Object._cci[key] = old_value;
	});
};
Object.getCurrentContextItem = Object.getCci = function(key) {
	return Object._cci[key];
};
Object.hangupCurrentContext = Object.upCc = function() {
	var old_cci = Object._cci;
	Object._cci = {};
	return old_cci;
};
Object.hangdownCurrentContext = Object.downCc = function(old_cci) {
	var current_cci = Object._cci;
	Object._cci = old_cci;
	setImmediate(function() {
		Object._cci = current_cci;
	});
};