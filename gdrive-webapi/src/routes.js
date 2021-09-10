import FileHelper from "./fileHelper.js";
import { dirname, resolve } from "path";
import { fileURLToPath, parse } from "url";
import UploadHandler from "./uploadHandler.js";
import { pipeline } from "stream/promises";
import { logger } from "./logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultUploadFolder = resolve(__dirname, "../", "uploads");
export default class Routes {
	io;
	uploadsFolder;

	constructor(uploadsFolder = defaultUploadFolder) {
		this.uploadsFolder = uploadsFolder;
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
		const { headers } = request;
		const {
			query: { socketId },
		} = parse(request.url, true);

		const uploadHandler = new UploadHandler({
			io: this.io,
			socketId,
			uploadFolder: this.uploadsFolder,
		});

		const onFinish = (response) => () => {
			response.writeHead(200);
			response.end(
				JSON.stringify({
					result: "Files uploaded with success!",
				})
			);
		};

		const busboyInstance = uploadHandler.registerEvents(
			headers,
			onFinish(response)
		);
		await pipeline(request, busboyInstance);

		logger.info("Request finished with success!");
	}

	async get(request, response) {
		const result = await this.fileHelper.getFileStatus(this.uploadsFolder);

		response.writeHead(200);
		response.end(JSON.stringify(result));
	}

	handler(request, response) {
		response.setHeader("Access-Control-Allow-Origin", "*");
		const called = this[request.method.toLowerCase()] || this.defaultRoute;

		return called.apply(this, [request, response]);
	}
}
