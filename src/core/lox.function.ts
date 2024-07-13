import { Environment } from "./environment";
import { Return, type Interpreter } from "./interpreter";
import { LoxCallable } from "./lox.callable";
import type { LoxInstance } from "./lox.instance";
import type { Stmt } from "./stmt";

export class LoxFunction extends LoxCallable {
	constructor(
		private declaration: Stmt.Func,
		private closure: Environment,
		private isInitializer: boolean,
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
				if (this.isInitializer) return this.closure.getAt(0, "this");
				return error.value;
			}
			throw error;
		}

		if (this.isInitializer) return this.closure.getAt(0, "this");

		return null;
	}

	bind(instance: LoxInstance): LoxFunction {
		const environment = new Environment(this.closure);
		environment.define("this", instance);
		return new LoxFunction(this.declaration, environment, this.isInitializer);
	}

	toString() {
		return `<fn ${this.declaration.name.lexeme}>`;
	}
}
