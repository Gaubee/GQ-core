## Extend:Component

### socket.registerComponent(component_name, document_data, component_obj);

component_obj接受Function以及Object类型：

* Class
如果是class对象（特殊的Function）。那么Component接受的参数init_protos将用来执行`new Class(init_protos)`。
`init-component`后，返回的`component-instance`里的protos将遵循以下规范：
方法：如果是下划线开头，则认为是私有方法，不会被暴露到protos表中，除非强制设定方法的`__as_com_proto__`为true。
框架中提供了`Function.prototype.asComProto`方法来简化这个写法：
```js
Function.prototype.asComProto = function(doc) {
	this.__as_com_proto__ = doc || true;
	return this;
};
```
同样的，如果想把一个不是下划线开头的方法的从protos表中移除，可以调用`Function.prototype.noAsComProto`方法。

> __as_com_proto__接受了传入的doc对象，那么这将会作为描述method的doc-params对象：
```js
QAQ.prototype.say = function(word, nick_name) {
	return `${nick_name||"QAQ"}: ${word}`
}.asComProto({
	des: "QAQ-say something",
	params: [{
			type: "String",
			des: "say something word."
		},
		"nick_name|String:Nick Name"
	]
})
```

> 方法会从原型链上取出，直到`Object.prototype`。

另外，关于`__no_as_com_proto__`，也可以直接通过设置属性`__no_as_com_proto_list__`为`Array<key>`的方式来批量设置，特别是值不是Object的属性值，必须通过这种方式来设定：
```js
class QAQ {
	constructor(init_protos) {
		this.name = String.isString(init_protos.name) ? init_protos.name : "";
		this.age = parseInt(init_protos.age, 10) || 0;
	}
}
QAQ.__no_as_com_proto_list__ = ["name"];
```
相反的，如果想强制加属性或者方法，只需要在`methods`或者`prototypes`中进行手动设定即可。

* Function
如果是一般Function对象，那么Component接受的参数init_protos将用来执行`Function(init_protos)`。
这点相对于class，少了一个new关键字，其余和class并无出入，这里不再赘述。

> Function这种内部创建Object的模式就意味着无法自动生成`Methods-Doc`

* Object
Object对象就意味着没有构造函数，所以对于这种对象，框架提供了默认的构造方法，将Object绑定到`init_protos`的原型链上。
关于`__as_com_proto__`和`__no_as_com_proto__`，依旧通用。
注意：Array也属于Object。

* 其它类型：String、Number、RegExp、Boolean...
这几类无法作为Component对象，所以使用这类对象来进行初始化的时候会报错。

#### 调用代码

```js
yield socket.registerComponent("QAQ", {
	des: "测试组件"
}, class QAQ{
	constructor(word){
		this.word = String(word)
	}
	setWord(new_word) {
		return this.word = String(new_word)
	}
	say(){
		return "QAQ: "+this.word;
	}
	_zz(){ // 下划线开头的方法被认为是私有方法，不会暴露到接口中
		console.log("QAQ")
	}
});
```

> 关于异步方法：对于异步，我们统一使用Promise对象来做判断，因为Promise没有序列化成JSON的意义。
意味着，如果返回的对象是一个[co:Yieldables](//github.com/tj/co#yieldables)对象，会等到所有Promise执行完成最终执行返回。
这点也适用于Function类型的构造器。所以如果Class类型的构造器的构造函数也用到了异步，可以用Function进行包裹，然后使用`socket.buildComponentDoc([doc, ]com)`来手动生成文档并传入。


### socket.initComponent([application_name, ]component_name, [...args]);

application_name如果是处于同一个应用中，可省略不写。
args是一个数组，用来初始化组件的参数。

调用后，返回的是一个**组件句柄**，可以用来进一步操作组件的属性和方法：
```js
var com = yield socket.initComponent("QAQ", ["hi."]);
console.log(yield com.say());
console.log(yield com.word);
```

### socket.destroyComponent / socket.deleteComponent(component_instance) / component_instance("delete"/"destroy")

这里提供了三种方法来执行销毁组件对象。前面两种是直观的，二者只是一个重命名的关系。
最后一种是js一个语法糖。在JS中，Function也是一个Object，所以提供了这种**指令化**的方案。

### 关于指令化
> `socket.initComponent`返回的就是一个可运行指令的函数，组件的属性、方法只是绑定在这个函数上的转发函数。
比如设置属性值：`component_instance("set", key, value)`，指令是用户自定义的。组件只是一个运行指令的容器。所以在本质上，开发者可以开发出各种组件，即便是远程运行代码也不是不行。
只是在Nodejs版本的`GQ-core`中，综合了效率、学习代价等因素，给出了这套体系。