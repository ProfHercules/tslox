import { RuntimeError } from "./interpreter";
import type { LoxClass } from "./lox.class";
import type { Token } from "./token";

export class LoxInstance {
	private fields = new Map<string, unknown>();

	constructor(public readonly klass: LoxClass) {}

	public toString() {
		return `${this.klass.name} instance`;
	}

	public get(name: Token): unknown {
		if (this.fields.has(name.lexeme)) {
			return this.fields.get(name.lexeme);
		}

		const method = this.klass.findMethod(name.lexeme);
		if (method) return method.bind(this);

		throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`);
	}

	public set(name: Token, value: unknown) {
		this.fields.set(name.lexeme, value);
	}
}
