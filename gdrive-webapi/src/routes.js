import FileHelper from "./fileHelper.js";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultUploadFolder = resolve(__dirname, "../", "uploads");
export default class Routes {
	io;
	downloadsFolder;

	constructor(downloadsFolder = defaultUploadFolder) {
		this.downloadsFolder = downloadsFolder;
		this.fileHelper = FileHelper;
	}

	setSocketInstance(io) {
		this.io = io;
	}

	async defaultRoute(request, response) {
		response.end("default route");
	}

	async options(request, response) {
		response.writeHead(204);
		response.end();
	}

	async post(request, response) {
		response.end();
	}

	async get(request, response) {
		const result = await this.fileHelper.getFileStatus(
			this.downloadsFolder
		);
		response.writeHead(200);
		response.end(JSON.stringify(result));
	}

	handler(request, response) {
		response.setHeader("Access-Control-Allow-Origin", "*");
		const called = this[request.method.toLowerCase()] || this.defaultRoute;

		return called.apply(this, [request, response]);
	}
}
