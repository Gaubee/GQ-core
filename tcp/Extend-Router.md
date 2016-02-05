## Extend:Router

### socket.registerRouter(method, path, router_info, handle)

注册一个路由：
```js
var router_info = yield socket.registerRouter("get", "/test", {doc:{des:"测试"}}, handle)

### socket.routerInstaller

路由对象安装器，接受一个`router-object`，以下是对应格式：
```js
{
	prefix:"/url_prefix_string",
	get:{
		"/path_1":[
			router_info,
			function * () {}
		],
		"/path_2":[
			router_info,
			function () {}
		],
		"/path_3":[
			function () {}
		],
		"/path_4":function*() {},
		"/path_5":function () {},
	},
	post:{},
	put:{},
	del:{}
}
```

### socket.multiRegisterRouter(dir, extname = ".r.js")

安装dir目录下所有以extname后缀结尾的文件模块。
模块必须返回`router-object`，或者返回`.install`函数，执行后返回`router-object`