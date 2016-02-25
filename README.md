# GQ-core

对原生库的拓展以及常用库的引入，一下是和拓展出来的函数以及简单介绍。

## 安装
```
npm install gq-core --save
```

## 1. Console

### console.flag(flagHead<String>, ...args)

带彩色的头部日志打印

### console.group / console.groupEnd(...args)

带包裹的日志打印

### console.time / console.timeEnd(...args)

在`group`基础上增加了时间的计算


## 2. Math

### Math.range(min<Number>, value<Number>, max<Number>)

如果value在min~max范围中，返回value，否则返回最接近value的值。

## 3. Object

### Object.clone(obj) / obj.$clone()

克隆一个对象

### obj.$mix(obj2)

将obj2的属性添加到obj上

### Object.deepClone(obj) / obj.$deepClone()

深度克隆对象。
> 注意，这里使用JSON.stringify和JSON.parse，所以function、NaN、Infinity等对象无法正常克隆

~~### Object.extend(obj) / obj.$extend~~

### Object.eql(obj, obj2) / obj.$eql(obj2);

判断obj与obj2的属性结构与值是否一样

### Object.has(obj, small_obj) / obj.$has(small_obj)

判断obj的属性结构和值中是否包含了small_obj的属性结构与值

### obj.$hasPro / obj.HOP(key)

hasOwnProperty方法的简写

## 4. Array

### Array.slice(likeArray[, start_index, num])

数组拷贝，同`arr.slice(start_index, num)`

### Array.unshift | Array.push (arr, items)

同`arr.unshift, arr.push` 方法

### Array.remove(arr ,item) / arr.remove(item)

克隆出一个不包含item的数组

### Array.spliceRemove(arr ,item) / arr.spliceRemove(item)

直接操作源数组，变成一个不包含item的数组

### Array.clearNull(arr) | arr.clearNull()

删除`undefined null ""`这三种对象，返回一个新数组

### Array.uniq(arr) | arr.uniq()

删除重复项。仅仅适用于数组元素类型是Number、String

### Array.page(arr, num, page) | arr.page(num, page)

分页的方法切割数组

### arr.filterMap(handle)

filter与map的结合，进行filter判定时，如果返回的值为**真**，就加入到结果数组中返回。

### Array.sortBy(arr, key, asc) | arr.sortBy(key, asc)

obj-item数组根据obj[key]来进行排序

### Array.toMap(arr, key) | arr.toMap(key)

将数组obj-item转化为`obj[obj_item[key]] = obj_item`：
```js
[{
	name: "Gaubee",
	age: 29
}, {
	name: "Bangeel",
	age: 9
}].toMap("name");
// ===>
{
	"Gaubee": {
		name: "Gaubee",
		age: 29
	},
	"Bangeel": {
		name: "Bangeel",
		age: 9
	}
}
```

## 5. Date

### date.format(fotmat_template_string<String>)

* YYYY 年
* Q 季度
* MM 月份
* DD 日期
* hh 小时
* mm 分钟
* ss 秒
* SSS 毫秒

## 6. String

### text.parseJSON(reviver)

同`JSON.parse(text, reviver)`

### str.startWith | str.endWith(small_str)

判断字符串是否以small_str开头或者结尾

### String.isString(obj)

判断对象是否为字符串

### str.camelize

驼峰化字符串：
```js
"a-bb.cd_dd".camelize(); // aBbCcDd
```

### str.underlize()

下划线化字符串：
```js
"aBbCcDd".underlize(); // a_bb_cc_dd
```

### str.toInt | str.toFloat(radix)

转数字

### String.replaceAll | str.replaceAll(find, replace)

批量替换

### str.colorsHead(to_color)

将字符串转为控制台中带色彩的字符串，颜色表对照：
```
# String.colors.styles
reset bold dim italic underline inverse hidden strikethrough black
red green yellow blue magenta cyan white gray grey bgBlack bgRed
bgGreen bgYellow bgBlue bgMagenta bgCyan bgWhite blackBG redBG
greenBG yellowBG blueBG magentaBG cyanBG whiteBG
```

### String.toRegExp

字符串转为正则中使用的字符串，将正则表达式的特殊字符做了转义处理。

## 6. Function

### Function.noop

空函数

### Function.Permission(matchFun, succFun, errFun) / succFun.permission(matchFun, errFun)

校验函数，先执行matchFun，如果返回值是真，接着执行succFun，否则执行errFun。用于AOP校验权限时使用

### Function.isFunction(obj)

判断对象是否为函数

## 7. fs

### fs.copydir(src, dst)

复制目录。
* src 需要复制的目录
* dst 复制到指定的目录

### fs.smartMkdirSync(url, mode)

递归创建目录

### fs.smartRmdirSync(url, mode)

递归删除目录

### fs.smartMkfileSync(dir, cb)

创建不存在的文件

### fs.lsAll(root) 

活取指定目录下的所有文件，包括子目录的文件

## 8. Map | Set

### map.map | set.map

循环map、set的元素，并返回数组对象，这个方法方便和co库配合：
```js
yield set.map(co.wrap(function*(value, index) {
	yield ...
}));
```

## 9. Tools / $$

### $$.name(str)

通用的纯英文用户名命名校验

### $$.folder_name(str)

校验是否符合文件夹命名

### $$.id_card(str)

身份证校验

### $$.phone(str)

手机、电话号码校验

### $$.bank_card(str)

银行卡校验

### $$.isEmail(str)

邮箱校验

### $$.boolean_parse(str)

字符串转Boolean：
```js
"false","" ==> false
```

### $$.isUrl(str)

校验是否是网址

### $$.md5(str)

字符串转MD5，32位

### $$.md5_2(str)

二次MD5化，64位

### $$.uuid(perfix)

获取一个绝对随机的字符串，带prefix前缀

### $$.isMobile(userAgent)

根据`http-userAgent`判断是否是手机

### $$.isWeiXin(userAgent)

根据`http-userAgent`判断是否是微信

### $$.Task(task_core, max_concurrent)

并发运行的任务限制：
```js
var t = Task(function(v, i) {
	setTimeout(function() {
		console.log(i);
		t.end();
	}, 1000);
}, 2);//现在最多同时运行2个任务
Array.from({
	length: 10
}).forEach(t.run);
```
在批量下载数据、批量操作文件的时候经常使用。如果不加以限制，会导致系统级的错误

### $$.When(task_num, complete_cb)

多任务执行完成后的回调：
```js
// 注册一个10个任务的回调
w = When(10, function() {
	console.log("all task run completed!");
	w.then(function() {
		console.log("all ok1")
	});
});
w.then(function() {
	console.log("all ok2")
});

// 执行10个任务，最多同时运行两个任务
var t = Task(function(v, i) {
	setTimeout(function() {
		console.log(i, "is ok");
		w.ok(i)
		t.end();
	}, 200);
}, 2);
Array.from({
	length: 10
}).forEach(t.run);
```

### $$.F繁体_to_J简体

繁体中文转简体中文

### $$.F简体_to_F繁体

简体中文转繁体中文

### $$.sleep(ms)

暂停ms毫秒，**配合co使用**

### $$.curl(url)

请求url网址的数据，**配合co使用**

## fileDB

简单的内存+文件数据库：
```js
/*
 * 初始化
 */
// 初始化、重置索引对象
fileDB.refreshIndex()
// 可选启用自动备份，以及应急备份
fileDB.autoBackup()
/*
 * 使用方法
 */
fileDB.insert(db_name, obj, _id)
fileDB.update(db_name, _id, obj, _is_cover)
fileDB.remove(db_name, obj_index)
remove_list(db_name, obj)
remove_all(db_name)

fileDB.find_by_id(db_name, _id)
fileDB.find_one(db_name, obj)
fileDB.find_list(db_name, obj, num, page)
fileDB.find_all(db_name)
```

## tcp

详见[TCP README](./tcp/README.md);