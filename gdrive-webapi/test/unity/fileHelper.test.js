import { describe, test, expect, jest } from "@jest/globals";
import fs from "fs";
import FileHelper from "./../../src/fileHelper.js";

describe("#File Helper", () => {
	describe("#getFileStatus", () => {
		test("it should return file statuses in correct format", async () => {
			const statMock = {
				dev: 40,
				mode: 33188,
				nlink: 1,
				uid: 1000,
				gid: 1000,
				rdev: 0,
				blksize: 4096,
				ino: 396344,
				size: 70500,
				blocks: 144,
				atimeMs: 1631209285469.462,
				mtimeMs: 1631210700717.5789,
				ctimeMs: 1631210700717.5789,
				birthtimeMs: 1631209285469.462,
				atime: "2021-09-09T17:41:25.469Z",
				mtime: "2021-09-09T18:05:00.718Z",
				ctime: "2021-09-09T18:05:00.718Z",
				birthtime: "2021-09-09T17:41:25.469Z",
			};

			const readdirMock = ["test.txt"];

			jest.spyOn(fs.promises, fs.promises.readdir.name).mockResolvedValue(
				readdirMock
			);

			jest.spyOn(fs.promises, fs.promises.stat.name).mockResolvedValue(
				statMock
			);

			const mockOwner = "vanderlei";
			const mockFilename = "test.txt";

			const result = await FileHelper.getFileStatus("/test");

			const expectedResult = [
				{
					size: "70.5 kB",
					lastModified: statMock.birthtime,
					owner: mockOwner,
					filename: mockFilename,
				},
			];

			expect(fs.promises.stat).toBeCalledWith(`/test/${mockFilename}`);
			expect(result).toMatchObject(expectedResult);
		});
	});
});
