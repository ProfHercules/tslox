import { Command, Argument } from "@commander-js/extra-typings";
import { readFile } from "node:fs/promises";
import { Lox } from "./lox";

function isFileNotFoundError(error: unknown): boolean {
	return error instanceof Error && "code" in error && error.code === "ENOENT";
}

const cli = new Command("run")
	.addArgument(new Argument("<file>", "The path to the *.lox file to run."))
	.action(async (file) => {
		try {
			const source = await readFile(file, "utf-8");
			Lox.run(source);
		} catch (error) {
			if (isFileNotFoundError(error)) {
				console.error(`File not found: ${file}`);
				process.exit(1);
			}
			console.error(error);
			console.error(`Could not run file: ${file}`);
			process.exit(1);
		}
	});

cli.parse();
