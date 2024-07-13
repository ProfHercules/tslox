import { Interpreter, type RuntimeError } from "./core/interpreter";
import { Parser } from "./core/parser";
import { Resolver } from "./core/resolver";
import { Scanner } from "./core/scanner";
import { TokenType, type Token } from "./core/token";

export class Lox {
	private interpreter = new Interpreter();

	private hasError = false;

	private constructor() {}

	private static _instance: Lox;

	private static get instance() {
		if (!Lox._instance) {
			Lox._instance = new Lox();
		}

		return Lox._instance;
	}

	static run(source: string) {
		const scanner = new Scanner(source);
		const tokens = scanner.scanTokens();

		const parser = new Parser(tokens);
		const statements = parser.parse();

		if (!statements || Lox.instance.hasError) return;

		const resolver = new Resolver(Lox.instance.interpreter);
		resolver.resolve(statements);

		if (Lox.instance.hasError) return;

		Lox.instance.interpreter.interpret(statements);
	}

	static error(lineOrToken: number | Token, message: string) {
		Lox.instance.hasError = true;
		if (typeof lineOrToken === "number") {
			Lox.report(lineOrToken, "", message);
		} else {
			if (lineOrToken.type === TokenType.EOF) {
				Lox.report(lineOrToken.line, " at end", message);
			} else {
				Lox.report(lineOrToken.line, ` at '${lineOrToken.lexeme}'`, message);
			}
		}
	}

	static runtimeError(error: RuntimeError) {
		console.log(`${error.message}\n[line ${error.token?.line}]`);
	}

	private static report(line: number, where: string, message: string) {
		console.log(`[line ${line}] Error${where}: ${message}`);
	}
}
