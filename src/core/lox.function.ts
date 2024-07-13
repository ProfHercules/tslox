import { Environment } from "./environment";
import { Return, type Interpreter } from "./interpreter";
import { LoxCallable } from "./lox.callable";
import type { Stmt } from "./stmt";

export class LoxFunction extends LoxCallable {
	constructor(
		private declaration: Stmt.Func,
		private closure: Environment,
	) {
		super();
	}

	arity(): number {
		return this.declaration.params.length;
	}

	call(interpreter: Interpreter, args: unknown[]): unknown {
		const environment = new Environment(this.closure);

		for (let i = 0; i < this.declaration.params.length; i++) {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			environment.define(this.declaration.params.at(i)!.lexeme, args.at(i));
		}

		try {
			interpreter.executeBlock(this.declaration.body, environment);
		} catch (error) {
			if (error instanceof Return) {
				return error.value;
			}
			throw error;
		}

		return null;
	}

	toString() {
		return `<fn ${this.declaration.name.lexeme}>`;
	}
}
