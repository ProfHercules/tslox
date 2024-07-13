import { Lox } from "../lox";
import { Environment } from "./environment";
import type { Expr } from "./expr";
import { LoxCallable } from "./lox.callable";
import { LoxFunction } from "./lox.function";
import type { Stmt } from "./stmt";
import { type Token, TokenType } from "./token";

export class RuntimeError extends Error {
	constructor(
		public token: Token | null,
		message: string,
	) {
		super(message);
	}
}

export class Return extends RuntimeError {
	constructor(public value: unknown) {
		super(null, "");
	}
}

export class Interpreter implements Expr.Visitor<unknown>, Stmt.Visitor<void> {
	private environment = new Environment();
	readonly globals = this.environment;
	private readonly locals = new Map<Expr.Expr, number>();

	constructor() {
		this.environment.define(
			"clock",
			class implements LoxCallable {
				arity() {
					return 0;
				}

				call() {
					return Date.now() / 1000;
				}

				toString() {
					return "<native fn>";
				}
			},
		);
	}

	public interpret(statements: Stmt.Stmt[]) {
		try {
			for (const statement of statements) {
				this.execute(statement);
			}
		} catch (error) {
			if (error instanceof RuntimeError) {
				Lox.runtimeError(error);
			} else {
				throw error;
			}
		}
	}

	private execute(stmt: Stmt.Stmt) {
		stmt.accept(this);
	}

	resolve(expr: Expr.Expr, depth: number) {
		this.locals.set(expr, depth);
	}

	private stringify(object: unknown) {
		if (object == null) return "nil";

		if (typeof object === "number") {
			let text = object.toString();
			if (text.endsWith(".0")) {
				text = text.substring(0, text.length - 2);
			}
			return text;
		}

		return object.toString();
	}

	visitReturnStmt(stmt: Stmt.Return): void {
		let value = null;
		if (stmt.value !== null) {
			value = this.evaluate(stmt.value);
		}

		throw new Return(value);
	}

	visitFuncStmt(stmt: Stmt.Func): void {
		const func = new LoxFunction(stmt, this.environment);
		this.environment.define(stmt.name.lexeme, func);
	}

	visitCallExpr(expr: Expr.Call): unknown {
		const callee = this.evaluate(expr.callee);

		const args = [];
		for (const argument of expr.args) {
			args.push(this.evaluate(argument));
		}

		if (!(callee instanceof LoxCallable)) {
			throw new RuntimeError(
				expr.paren,
				"Can only call functions and classes.",
			);
		}

		if (args.length !== callee.arity()) {
			throw new RuntimeError(
				expr.paren,
				`Expected ${callee.arity()} arguments but got ${args.length}.`,
			);
		}

		return callee.call(this, args);
	}

	visitWhileStmt(stmt: Stmt.While): void {
		while (this.isTruthy(this.evaluate(stmt.condition))) {
			this.execute(stmt.body);
		}
	}

	visitIfStmt(stmt: Stmt.If): void {
		if (this.isTruthy(this.evaluate(stmt.condition))) {
			this.execute(stmt.thenBranch);
		} else if (stmt.elseBranch !== null) {
			this.execute(stmt.elseBranch);
		}
	}

	visitBlockStmt(stmt: Stmt.Block): void {
		this.executeBlock(stmt.statements, new Environment(this.environment));
	}

	executeBlock(statements: Stmt.Stmt[], environment: Environment) {
		const previous = this.environment;
		try {
			this.environment = environment;

			for (const statement of statements) {
				this.execute(statement);
			}
		} finally {
			this.environment = previous;
		}
	}

	visitExpressionStmt(stmt: Stmt.Expression): void {
		this.evaluate(stmt.expression);
	}

	visitPrintStmt(stmt: Stmt.Print): void {
		const value = this.evaluate(stmt.expression);
		console.log(this.stringify(value));
	}

	visitVarStmt(stmt: Stmt.Var): void {
		let value = null;

		if (stmt.initializer != null) {
			value = this.evaluate(stmt.initializer);
		}

		this.environment.define(stmt.name.lexeme, value);
	}

	visitLogicalExpr(expr: Expr.Logical): unknown {
		const left = this.evaluate(expr.left);

		if (expr.operator.type === TokenType.OR) {
			if (this.isTruthy(left)) return left;
		} else {
			if (!this.isTruthy(left)) return left;
		}

		return this.evaluate(expr.right);
	}

	visitAssignExpr(expr: Expr.Assign): unknown {
		const value = this.evaluate(expr.value);

		const distance = this.locals.get(expr);
		if (distance) {
			this.environment.assignAt(distance, expr.name, value);
		} else {
			this.globals.assign(expr.name, value);
		}

		return value;
	}

	visitVariableExpr(expr: Expr.Variable): unknown {
		return this.lookUpVariable(expr.name, expr);
	}

	private lookUpVariable(name: Token, expr: Expr.Expr) {
		const distance = this.locals.get(expr);

		if (distance !== undefined) {
			return this.environment.getAt(distance, name.lexeme);
		}

		return this.globals.get(name);
	}

	visitBinaryExpr(expr: Expr.Binary): unknown {
		const left = this.evaluate(expr.left);
		const right = this.evaluate(expr.right);

		switch (expr.operator.type) {
			case TokenType.BANG_EQUAL:
				return !this.isEqual(left, right);
			case TokenType.EQUAL_EQUAL:
				return this.isEqual(left, right);
			case TokenType.GREATER:
				this.checkNumberOperands(expr.operator, left, right);
				return (left as number) > (right as number);
			case TokenType.GREATER_EQUAL:
				this.checkNumberOperands(expr.operator, left, right);
				return (left as number) >= (right as number);
			case TokenType.LESS:
				this.checkNumberOperands(expr.operator, left, right);
				return (left as number) < (right as number);
			case TokenType.LESS_EQUAL:
				this.checkNumberOperands(expr.operator, left, right);
				return (left as number) <= (right as number);
			case TokenType.MINUS:
				this.checkNumberOperands(expr.operator, left, right);
				return (left as number) - (right as number);
			case TokenType.PLUS:
				if (typeof left === "number" && typeof right === "number") {
					return (left as number) + (right as number);
				}
				if (typeof left === "string" && typeof right === "string") {
					return (left as string) + (right as string);
				}
				throw new RuntimeError(
					expr.operator,
					"Operands must be two numbers or two strings.",
				);
			case TokenType.SLASH:
				this.checkNumberOperands(expr.operator, left, right);
				return (left as number) / (right as number);
			case TokenType.STAR:
				this.checkNumberOperands(expr.operator, left, right);
				return (left as number) * (right as number);
		}

		// Unreachable.
		return null;
	}

	visitGroupingExpr(expr: Expr.Grouping): unknown {
		return this.evaluate(expr.expression);
	}

	visitLiteralExpr(expr: Expr.Literal): unknown {
		return expr.value;
	}

	visitUnaryExpr(expr: Expr.Unary): unknown {
		const right = this.evaluate(expr.right);

		switch (expr.operator.type) {
			case TokenType.MINUS:
				this.checkNumberOperands(expr.operator, right);
				return -(right as number);
			case TokenType.BANG:
				return !this.isTruthy(right);
		}

		// Unreachable.
		return null;
	}

	private checkNumberOperands(operator: Token, ...operands: unknown[]) {
		if (operands.every((o) => typeof o === "number")) return;
		if (operands.length === 1) {
			throw new RuntimeError(operator, "Operand must be a number.");
		}
		throw new RuntimeError(operator, "Operands must be numbers.");
	}

	private evaluate(expr: Expr.Expr) {
		return expr.accept(this);
	}

	private isTruthy(object: unknown) {
		if (object == null) return false;
		if (object instanceof Boolean || typeof object === "boolean")
			return Boolean(object);
		return true;
	}

	private isEqual(a: unknown, b: unknown) {
		if (a == null && b == null) return true;
		if (a == null) return false;

		return a === b;
	}
}
