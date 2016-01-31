require("./$.Object");
/*
 *拓展数组的功能
 */
Array.slice = function(likeArray, start_index, num) {
	return Array.prototype.slice.call(likeArray, start_index, num);
};
Array.unshift = function(arr, items) {
	arr.unshift.apply(arr, items);
};
Array.push = function(arr, items) {
	arr.push.apply(arr, items);
};

//删除指定项
Array.remove = function(arr, item) {
	return arr.filter(function(other_item) {
		return other_item !== item;
	});
};
Array.prototype.setUnEnum("remove", function(item) {
	return Array.remove(this, item);
});
//不改变数组地删除一项
Array.spliceRemove = function(arr, item) {
	var index = arr.indexOf(item);
	if (index !== -1) {
		arr.splice(index, 1);
		return true;
	}
};
Array.prototype.setUnEnum("spliceRemove", function(item) {
	return Array.spliceRemove(this, item);
});
//清空无用项
Array.clearNull = function(arr) {
	return arr.filter(function(item) {
		if (item === undefined || item === null || item === "") {
			return false
		}
		return true;
	});
};
Array.prototype.setUnEnum("clearNull", function() {
	return Array.clearNull(this);
});
//删除重复项
Array.uniq = function(arr) {
	var a = [],
		o = {},
		i,
		v,
		cv, // corrected value
		len = arr.length;

	if (len < 2) {
		return arr;
	}

	for (i = 0; i < len; i++) {
		v = arr[i];

		/* closurecache 提供的函数中使用的是  cv = v + 0;，
		 * 这样就无法辨别类似[1, 10, "1", "10"]的数组，
		 * 因为运算后 => 1, 10, 10, 100，很明显，出现了重复的标示符。
		 * 加前面就难道没问题吗？
		 * 有的：数组中不能出现类似01 、001，以 0 开头的数字，
		 * 但适用性比原先更广。
		 */
		cv = 0 + v;

		if (!o[cv]) {
			a.push(v);
			o[cv] = true;
		}
	}

	return a;
};

Array.prototype.setUnEnum("uniq", function() {
	return Array.uniq(this);
});

//分页切片
Array.page = function(arr, num, page) {
	arr = Array.prototype.slice.call(arr);
	if (num) {
		page || (page = 0);
		var start_num = num * page;
		// var end_num = start_num+num;
		arr = arr.splice(start_num, num);
	}
	// 无参数或者num==0时直接返回全部
	return arr;
};
Array.prototype.setUnEnum("page", function(num, page) {
	return Array.page(this, num, page);
});

//过滤重组
Array.prototype.setUnEnum("filterMap", function(cb) {
	var result = []
	this.forEach(function() {
		var item = cb.apply(this, arguments);
		item && result.push(item);
	});
	return result;
});

//关键字排序
Array.sortBy = function(arr, key, asc) {
	var _arr_map = {};
	var _arr_keys = [];
	//根据值保存对象到集合和值数组
	arr.forEach(function(item) {
		var value = item[key];
		var _arr_set = _arr_map[value];
		if (!_arr_set) {
			_arr_set = _arr_map[value] = [];
			_arr_keys.push(value)
		}
		_arr_set.push(item);
	});
	//排序值数组
	_arr_keys.sort();
	//倒序
	if (asc) {
		_arr_keys.reverse();
	}
	var result = [];
	//根据值数组排列对象集
	_arr_keys.forEach(function(value) {
		result = result.concat(_arr_map[value]);
	});
	return result;
};

Array.prototype.setUnEnum("sortBy", function(key, asc) {
	return Array.sortBy(this, key, asc);
});
/*test*/
// var arr = [0, 1, 2, 3].filterMap(function(v) {
// 	return v * 2
// });
// console.log(arr);

Array.toMap = function(arr, key) {
	var res = Object.create(null);
	arr.forEach(function(item) {
		res[item[key]] = item
	});
	return res
};
Array.prototype.setUnEnum("toMap", function(key) {
	return Array.toMap(this, key);
});