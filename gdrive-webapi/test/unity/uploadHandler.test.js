import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import UploadHandler from "./../../src/uploadHandler.js";
import TestUtil from "../_utils/testUtil.js";
import fs from "fs";
import { pipeline } from "stream/promises";
import { logger } from "../../src/logger.js";

describe("#UploadHandler test suite", () => {
	const ioObj = {
		to: (id) => ioObj,
		emit: (event, message) => {
			//
		},
	};

	beforeEach(() => {
		jest.spyOn(logger, "info").mockImplementation();
	});

	describe("#registerEvents", () => {
		test("should call onFile and onFinish functions on Busboy instance", () => {
			const uploadHandler = new UploadHandler({
				io: ioObj,
				socketId: "01",
			});

			jest.spyOn(
				uploadHandler,
				uploadHandler.onFile.name
			).mockResolvedValue();

			const headers = {
				"content-type": "multipart/form-data; boundary=",
			};

			const fileStream = TestUtil.generateReadableStream(
				TestUtil.loremIpsumData()
			);
			const onFinish = jest.fn();

			const busboyInstance = uploadHandler.registerEvents(
				headers,
				onFinish
			);

			busboyInstance.emit(
				"file",
				"fieldname",
				fileStream,
				"filename.txt"
			);

			busboyInstance.listeners("finish")[0].call();

			expect(uploadHandler.onFile).toHaveBeenCalled();
			expect(onFinish).toHaveBeenCalled();
		});
	});

	describe("#onFile", () => {
		test("given an stream file it should save it on disk", async () => {
			const chunks = TestUtil.loremIpsumData();
			const uploadFolder = "test";

			const handler = new UploadHandler({
				io: ioObj,
				socketId: "01",
				uploadFolder,
			});

			const onData = jest.fn();

			jest.spyOn(fs, fs.createWriteStream.name).mockImplementation(() =>
				TestUtil.generateWritableStream(onData)
			);

			const onTransform = jest.fn();

			jest.spyOn(
				handler,
				handler.handleFileBuffer.name
			).mockImplementation(() =>
				TestUtil.generateTransformStream(onTransform)
			);

			const params = {
				fieldname: "text",
				file: TestUtil.generateReadableStream(chunks),
				filename: "test.txt",
			};

			const expectedFilename = `${handler.uploadFolder}/${params.filename}`;

			await handler.onFile(...Object.values(params));

			expect(onData.mock.calls.join()).toEqual(chunks.join());
			expect(onTransform.mock.calls.join()).toEqual(chunks.join());
			expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename);
		});
	});

	describe("#handleFileBytes", () => {
		test("should call emit function and it is a transform stream", async () => {
			jest.spyOn(ioObj, ioObj.to.name);
			jest.spyOn(ioObj, ioObj.emit.name);

			const handler = new UploadHandler({
				io: ioObj,
				socketId: "01",
			});

			jest.spyOn(handler, handler.canExecute.name).mockReturnValue(true);

			const source = TestUtil.generateReadableStream(
				TestUtil.loremIpsumData()
			);

			const onWrite = jest.fn();

			const target = TestUtil.generateWritableStream(onWrite);

			await pipeline(
				source,
				handler.handleFileBuffer("test.txt"),
				target
			);

			const messageSize = TestUtil.loremIpsumData().length;

			expect(ioObj.to).toHaveBeenCalledTimes(messageSize);
			expect(ioObj.emit).toHaveBeenCalledTimes(messageSize);
			expect(onWrite).toHaveBeenCalledTimes(messageSize);

			expect(onWrite.mock.calls.join("")).toEqual(
				TestUtil.loremIpsumData().join("")
			);
		});

		test("given message timeDelay as 2 secs it should emit only two message during 3 seconds period", async () => {
			jest.spyOn(ioObj, ioObj.emit.name);

			const day = "2021-07-01 01:01";
			const twoSecondsPeriod = 2000;

			// Date.now do this.lastMessageSent em handleBytes
			const onFirstLastMessageSent = TestUtil.getTimeFromDate(
				`${day}:00`
			);

			// -> hello chegou
			const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`);
			const onSecondUpdateLastMessageSent = onFirstCanExecute;

			// -> segundo hello, está fora da janela de tempo!
			const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`);

			// -> world
			const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`);

			TestUtil.mockDateNow([
				onFirstLastMessageSent,
				onFirstCanExecute,
				onSecondUpdateLastMessageSent,
				onSecondCanExecute,
				onThirdCanExecute,
			]);

			const messages = ["hello", "hello", "world"];
			const filename = "filename.avi";
			const expectedMessageSent = 2;

			const source = TestUtil.generateReadableStream(messages);
			const handler = new UploadHandler({
				messageTimeDelay: twoSecondsPeriod,
				io: ioObj,
				socketId: "01",
			});

			await pipeline(source, handler.handleFileBuffer(filename));

			expect(ioObj.emit).toHaveBeenCalledTimes(expectedMessageSent);

			const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls;

			expect(firstCallResult).toEqual([
				handler.ON_UPLOAD_EVENT,
				{ processedAlready: "hello".length, filename },
			]);
			expect(secondCallResult).toEqual([
				handler.ON_UPLOAD_EVENT,
				{ processedAlready: messages.join("").length, filename },
			]);
		});
	});

	describe("#canExecute", () => {
		test("should return true when time is later than specified daley", () => {
			const lastExecution = TestUtil.getTimeFromDate(
				"2021-07-01 00:00:00"
			);
			const timeNow = TestUtil.getTimeFromDate("2021-07-01 00:00:02");

			const handler = new UploadHandler({
				io: {},
				socketId: "",
				messageTimeDelay: 1000,
			});

			TestUtil.mockDateNow([timeNow]);

			const result = handler.canExecute(lastExecution);

			expect(result).toBeTruthy();
		});
		test("should return false when time isn`t later then specified delay", () => {
			const lastExecution = TestUtil.getTimeFromDate(
				"2021-07-01 00:00:00"
			);
			const timeNow = TestUtil.getTimeFromDate("2021-07-01 00:00:01");

			const handler = new UploadHandler({
				io: {},
				socketId: "",
				messageTimeDelay: 2000,
			});

			TestUtil.mockDateNow([timeNow]);

			const result = handler.canExecute(lastExecution);

			expect(result).toBeFalsy();
		});
	});
});
