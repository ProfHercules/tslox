import type { Interpreter } from "./interpreter";
import { LoxCallable } from "./lox.callable";
import type { LoxFunction } from "./lox.function";
import { LoxInstance } from "./lox.instance";

export class LoxClass extends LoxCallable {
	constructor(
		public readonly name: string,
		public readonly superclass: LoxClass | null,
		private methods: Map<string, LoxFunction>,
	) {
		super();
	}

	public toString() {
		return this.name;
	}

	arity(): number {
		const initializer = this.findMethod("init");
		if (!initializer) return 0;
		return initializer.arity();
	}

	call(interpreter: Interpreter, args: unknown[]): unknown {
		const instance = new LoxInstance(this);
		const initializer = this.findMethod("init");
		if (initializer) {
			initializer.bind(instance).call(interpreter, args);
		}

		return instance;
	}

	findMethod(name: string): LoxFunction | undefined {
		const method = this.methods.get(name);

		if (method) return method;

		if (this.superclass) {
			return this.superclass.findMethod(name);
		}
	}
}
