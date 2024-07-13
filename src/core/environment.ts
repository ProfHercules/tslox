import { RuntimeError } from "./interpreter";
import type { Token } from "./token";

export class Environment {
	private values = new Map<string, unknown>();

	constructor(public enclosing?: Environment) {}

	define(name: string, value: unknown) {
		this.values.set(name, value);
	}

	get(name: Token): unknown {
		if (this.values.has(name.lexeme)) {
			return this.values.get(name.lexeme);
		}

		if (this.enclosing) {
			return this.enclosing.get(name);
		}

		throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
	}

	private ancestor(distance: number) {
		let environment: Environment = this;
		for (let i = 0; i < distance; i++) {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			environment = environment.enclosing!;
		}

		return environment;
	}

	getAt(distance: number, name: string): unknown {
		return this.ancestor(distance).values.get(name);
	}

	assign(name: Token, value: unknown): unknown {
		if (this.values.has(name.lexeme)) {
			this.values.set(name.lexeme, value);
			return;
		}

		if (this.enclosing) {
			this.enclosing.assign(name, value);
			return;
		}

		throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
	}

	assignAt(distance: number, name: Token, value: unknown) {
		this.ancestor(distance).values.set(name.lexeme, value);
	}
}
