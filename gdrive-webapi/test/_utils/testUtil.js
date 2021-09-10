import { Readable, Writable, Transform } from "stream";
import { jest } from "@jest/globals";

export default class TestUtil {
	static generateReadableStream(data) {
		return new Readable({
			objectMode: true,
			read() {
				for (const item of data) {
					this.push(item);
				}

				this.push(null);
			},
		});
	}

	static generateWritableStream(onData) {
		return new Writable({
			objectMode: true,
			write(chunk, encoding, cb) {
				onData(chunk);

				cb(null, chunk);
			},
		});
	}

	static generateTransformStream(onData) {
		return new Transform({
			objectMode: true,
			transform(chunk, encoding, cb) {
				onData(chunk);

				cb(null, chunk);
			},
		});
	}

	static getTimeFromDate(dateString) {
		return new Date(dateString).getTime();
	}

	static mockDateNow(mockImplPeriods) {
		const mocker = jest.spyOn(global.Date, global.Date.now.name);

		mockImplPeriods.forEach((time) => {
			mocker.mockReturnValueOnce(time);
		});
	}

	static loremIpsumData() {
		const loremIpsum =
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Morbi tristique senectus et netus et malesuada fames ac turpis. Vel elit scelerisque mauris pellentesque pulvinar pellentesque habitant. Sociis natoque penatibus et magnis dis parturient montes nascetur ridiculus. Id diam vel quam elementum pulvinar. Id interdum velit laoreet id donec. Nisl vel pretium lectus quam id leo in vitae. Ac feugiat sed lectus vestibulum mattis ullamcorper velit. Nec feugiat in fermentum posuere urna nec tincidunt praesent semper. Lorem mollis aliquam ut porttitor. Ipsum dolor sit amet consectetur adipiscing elit. Elit scelerisque mauris pellentesque pulvinar pellentesque habitant morbi. Nunc sed augue lacus viverra vitae congue. Mattis vulputate enim nulla aliquet porttitor.";
		return loremIpsum.split(" ").map((val) => `${val} `);
	}
}
