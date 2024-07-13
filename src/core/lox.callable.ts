import type { Interpreter } from "./interpreter";

export abstract class LoxCallable {
	abstract arity(): number;
	abstract call(interpreter: Interpreter, args: unknown[]): unknown;
}
