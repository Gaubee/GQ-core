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