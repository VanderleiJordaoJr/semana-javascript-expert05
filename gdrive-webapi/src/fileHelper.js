import fs from "fs/promises";
import prettyBytes from "pretty-bytes";

export default class FileHelper {
	static async getFileStatus(folder) {
		const filenames = await fs.readdir(folder);

		const statuses = await Promise.all(
			filenames.map((file) => fs.stat(`${folder}/${file}`))
		);

		return filenames.map((filename, index) => {
			const { birthtime, size } = statuses[index];

			return {
				lastModified: birthtime,
				size: prettyBytes(size),
				owner: "vanderlei",
				filename,
			};
		});
	}
}
