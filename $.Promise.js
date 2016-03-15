function PromiseWithCatch(fun) {
	return new Promise((resolve, reject) => {
		try {
			fun.call(this, resolve, reject);
		} catch (e) {
			reject(e)
		}
	});
};

Promise.try = PromiseWithCatch;

function PromiseReadStream(stream) {
	return Promise.try((resolve, reject) => {
		const bufs = [];
		stream.on("error", reject);
		stream.on("data", bufs.push.bind(bufs));
		stream.on("end", () => {
			resolve(Buffer.concat(bufs));
		});
	});
};
Promise.readStream = PromiseReadStream;