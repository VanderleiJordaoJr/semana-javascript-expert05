import {
	describe,
	test,
	expect,
	jest,
	beforeEach,
	beforeAll,
	afterAll,
} from "@jest/globals";
import Routes from "./../../src/routes.js";
import FormData from "form-data";
import fs from "fs";
import { tmpdir } from "os";
import { join } from "path";

import TestUtil from "../_utils/testUtil.js";
import { logger } from "./../../src/logger.js";

describe("#Routes integration test", () => {
	beforeEach(() => {
		jest.spyOn(logger, "info").mockImplementation();
	});

	let defaultUploadFolder = "";

	beforeAll(async () => {
		defaultUploadFolder = await fs.promises.mkdtemp(join(tmpdir(), "test"));
	});

	afterAll(async () => {
		await fs.promises.rm(defaultUploadFolder, { recursive: true });
	});

	test("should upload file to the folder", async () => {
		const filename = "image.png";

		const fileStream = fs.createReadStream(
			`./test/integration/res/${filename}`
		);

		const response = TestUtil.generateWritableStream(jest.fn());

		const formData = new FormData();
		formData.append("photo", fileStream);

		const ioObj = {
			to: (id) => ioObj,
			emit: (event, message) => {
				//
			},
		};

		const defaultParams = {
			request: Object.assign(formData, {
				headers: formData.getHeaders(),
				method: "POST",
				url: "?socketId=10",
			}),
			response: Object.assign(response, {
				setHeader: jest.fn(),
				writeHead: jest.fn(),
				end: jest.fn(),
			}),
			values: () => Object.values(defaultParams),
		};

		const routes = new Routes(defaultUploadFolder);

		routes.setSocketInstance(ioObj);

		const readDirBefore = await fs.promises.readdir(defaultUploadFolder);

		await routes.handler(...defaultParams.values());

		const readdirAfter = await fs.promises.readdir(defaultUploadFolder);

		expect(readDirBefore).toEqual([]);
		expect(readdirAfter).toEqual([filename]);

		expect(defaultParams.response.writeHead).toBeCalledWith(200);
		expect(defaultParams.response.end).toBeCalledWith(
			JSON.stringify({
				result: "Files uploaded with success!",
			})
		);
	});
});
