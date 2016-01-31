function ChunkHandle(socket) {

	var _content_length = 0;
	var _buffer_cache = [];
	var chuck_handle = {
		get_content_length: function(chunk) {
			// content_length \0 content
			// 可能会因为\0而导致数据包分开来导入
			// 如果是，那么就要有一步进行拼接
			// 如果拼接过还有问题的话，就要报错了
			if (_buffer_cache.length) {
				_buffer_cache.push(chunk);
				chunk = Buffer.concat(_buffer_cache);
				var _is_use_concat = true
				_buffer_cache = [];
			}
			// [0, 1, \0, a, b] 5 - 2 - 1
			var _split_index = chunk.indexOf("\0");
			if (_split_index > 0) {
				var _content_length_buffer = chunk.slice(0, _split_index);
				_content_length = parseInt(_content_length_buffer);
			}
			if (!_content_length) {
				if (_is_use_concat) {
					console.error("错误的数据块", chunk.toString(), (new Error).stack);
				} else {
					// 可能是数据块不完整
					// 先存入缓存中
					_buffer_cache.push(chunk);
				}
				return
			}

			chuck_handle.run = chuck_handle.concat_content;
			var _remain_buffer = chunk.slice(_split_index + 1); //排除掉\0字符

			// 考虑到content-length \0 后面就没东西了，就没必要解析了
			_remain_buffer.length && chuck_handle.run(_remain_buffer);
		},
		concat_content: function(chunk) {
			var _chunk_length = chunk.length;
			if (_chunk_length <= _content_length) { //还没到终点，直接放入缓存中
				_buffer_cache.push(chunk);
				_content_length -= _chunk_length;
				if (_content_length === 0) {
					chuck_handle.parse_content();
				}
			} else { //遇到粘包的情况，分开来搞
				var _current_buffer = chunk.slice(0, _content_length);
				var _remain_buffer = chunk.slice(_content_length);

				//当下的所需的数据块切出，进入解析器
				_buffer_cache.push(_current_buffer);
				_content_length = 0;
				chuck_handle.parse_content();

				//剩余的包重新进入下一轮的解析
				chuck_handle.get_content_length(_remain_buffer);
			}
		},
		parse_content: function() {
			chuck_handle.run = chuck_handle.get_content_length;
			try {
				var _result_str = Buffer.concat(_buffer_cache);
				var result = JSON.parse(_result_str, (key, value) => {
					return value && value.type === 'Buffer' && (Array.isArray(value.data) || typeof value.data === "string") ? new Buffer(value.data) : value;
				});
				_buffer_cache = [];
			} catch (e) {
				console.error("数据解析出错", e.stack, _buffer_cache, _result_str.toString());
				_buffer_cache = [];
				return;
			}
			socket.emit("msg", result);
		}
	};
	return chuck_handle;
}

module.exports = ChunkHandle;