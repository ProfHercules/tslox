import { LoxCallable } from "./lox.callable";

export class ClockFn extends LoxCallable {
	arity() {
		return 0;
	}

	call() {
		return Date.now() / 1000;
	}

	toString() {
		return "<native fn>";
	}
}
