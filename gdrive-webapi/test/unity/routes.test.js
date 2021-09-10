import { describe, test, expect, jest } from "@jest/globals";
import Routes from "./../../src/routes";

describe("#Routes test suite", () => {
	const defaultParams = {
		request: {
			headers: {
				"Content-Type": "multipart/form-data",
			},
			method: "",
			body: {},
		},
		response: {
			setHeader: jest.fn(),
			writeHead: jest.fn(),
			end: jest.fn(),
		},
		values: () => Object.values(defaultParams),
	};

	describe("#setSocketInstance", () => {
		const routes = new Routes();

		const ioObj = {
			to: (id) => ioObj,
			emit: (event, message) => {
				//
			},
		};

		routes.setSocketInstance(ioObj);
		expect(routes.io).toStrictEqual(ioObj);
	});

	describe("#Handler", () => {
		test("given an inexistent route it should return default route", async () => {
			const routes = new Routes();
			const params = { ...defaultParams };
			params.request.method = "inexistent";

			await routes.handler(...params.values());
			expect(params.response.end).toHaveBeenCalledWith("default route");
		});

		test("it should set any request with cors enabled", async () => {
			const routes = new Routes();
			const params = { ...defaultParams };
			params.request.method = "inexistent";

			await routes.handler(...params.values());
			expect(params.response.setHeader).toHaveBeenCalledWith(
				"Access-Control-Allow-Origin",
				"*"
			);
		});

		test("given method OPTIONS should return options route", async () => {
			const routes = new Routes();
			const params = { ...defaultParams };
			params.request.method = "OPTIONS";

			await routes.handler(...params.values());
			expect(params.response.writeHead).toHaveBeenCalledWith(204);
		});

		test("given method GET should return get route", async () => {
			const routes = new Routes();
			const params = { ...defaultParams };
			params.request.method = "GET";

			jest.spyOn(routes, routes.get.name).mockResolvedValue();

			await routes.handler(...params.values());
			expect(routes.get).toHaveBeenCalled();
		});

		test("given method POST should return post route", async () => {
			const routes = new Routes();
			const params = { ...defaultParams };
			params.request.method = "POST";

			jest.spyOn(routes, routes.post.name).mockResolvedValue();

			await routes.handler(...params.values());
			expect(routes.post).toHaveBeenCalled();
		});
	});

	describe("#get", () => {
		test("giver method GET it should list all files downloaded", async () => {
			const routes = new Routes();
			const params = { ...defaultParams };

			const statusesMock = [
				{
					size: "70.5 kB",
					lastModified: "2021-09-09T17:41:25.469Z",
					owner: "vanderlei",
					filename: "test.txt",
				},
			];

			jest.spyOn(
				routes.fileHelper,
				routes.fileHelper.getFileStatus.name
			).mockResolvedValue(statusesMock);

			params.request.method = "GET";
			await routes.handler(...params.values());

			expect(params.response.writeHead).toBeCalledWith(200);
			expect(params.response.end).toBeCalledWith(
				JSON.stringify(statusesMock)
			);
		});
	});
});
