import { Lox } from "../lox";
import type { Expr } from "./expr";
import type { Interpreter } from "./interpreter";
import type { Stmt } from "./stmt";
import type { Token } from "./token";

export enum FunctionType {
	None = "NONE",
	Function = "FUNCTION",
	Initializer = "INITIALIZER",
	Method = "METHOD",
}

export enum ClassType {
	None = "NONE",
	Class = "CLASS",
	Subclass = "SUBCLASS",
}

export class Resolver implements Expr.Visitor<void>, Stmt.Visitor<void> {
	private scopes: Map<string, boolean>[] = [];
	private currentFunction = FunctionType.None;
	private currentClass = ClassType.None;

	constructor(private readonly interpreter: Interpreter) {}

	resolve(value: Stmt.Stmt | Expr.Expr | Stmt.Stmt[] | Expr.Expr[]) {
		if (Array.isArray(value)) {
			for (const v of value) {
				v.accept(this);
			}
		} else {
			value.accept(this);
		}
	}

	private beginScope() {
		this.scopes.push(new Map());
	}

	private endScope() {
		this.scopes.pop();
	}

	private declare(name: Token) {
		const scope = this.scopes.at(-1);
		if (!scope) return;

		if (scope.has(name.lexeme)) {
			Lox.error(name, "Already a variable with this name in this scope.");
		}

		scope.set(name.lexeme, false);
	}

	private define(name: Token) {
		const scope = this.scopes.at(-1);
		if (!scope) return;
		scope.set(name.lexeme, true);
	}

	private resolveLocal(expr: Expr.Expr, name: Token) {
		for (let i = this.scopes.length - 1; i >= 0; i--) {
			if (this.scopes[i].has(name.lexeme)) {
				this.interpreter.resolve(expr, this.scopes.length - 1 - i);
				return;
			}
		}
	}

	private resolveFunc(
		func: Stmt.Func,
		type: FunctionType,
		enclosingFunction = this.currentFunction,
	) {
		this.currentFunction = type;

		this.beginScope();
		for (const param of func.params) {
			this.declare(param);
			this.define(param);
		}
		this.resolve(func.body);
		this.endScope();
		this.currentFunction = enclosingFunction;
	}

	visitSuperExpr(expr: Expr.Super): void {
		if (this.currentClass === ClassType.None) {
			Lox.error(expr.keyword, "Can't use 'super' outside of a class.");
		} else if (this.currentClass !== ClassType.Subclass) {
			Lox.error(
				expr.keyword,
				"Can't use 'super' in a class with no superclass.",
			);
		}

		this.resolveLocal(expr, expr.keyword);
	}

	visitThisExpr(expr: Expr.This): void {
		if (this.currentClass === ClassType.None) {
			Lox.error(expr.keyword, "Can't use 'this' outside of a class.");
			return;
		}

		this.resolveLocal(expr, expr.keyword);
	}

	visitSetExpr(expr: Expr.Set): void {
		this.resolve(expr.value);
		this.resolve(expr.object);
	}

	visitGetExpr(expr: Expr.Get): void {
		this.resolve(expr.object);
	}

	visitClassStmt(stmt: Stmt.Class): void {
		const enclosingClass = this.currentClass;
		this.currentClass = ClassType.Class;

		this.declare(stmt.name);

		if (stmt.superclass !== null) {
			this.currentClass = ClassType.Subclass;
			if (stmt.name.lexeme === stmt.superclass.name.lexeme) {
				Lox.error(stmt.superclass.name, "A class can't inherit from itself.");
			}

			this.resolve(stmt.superclass);
		}

		if (stmt.superclass !== null) {
			this.beginScope();
			this.scopes.at(-1)?.set("super", true);
		}

		this.beginScope();
		this.scopes.at(-1)?.set("this", true);

		for (const method of stmt.methods) {
			let type = FunctionType.Method;
			if (method.name.lexeme === "init") {
				type = FunctionType.Initializer;
			}

			this.resolveFunc(method, type);
		}

		this.endScope();

		if (stmt.superclass !== null) this.endScope();

		this.define(stmt.name);

		this.currentClass = enclosingClass;
	}

	visitBlockStmt(stmt: Stmt.Block): void {
		this.beginScope();
		this.resolve(stmt.statements);
		this.endScope();
	}

	visitVarStmt(stmt: Stmt.Var): void {
		this.declare(stmt.name);
		if (stmt.initializer !== null) {
			this.resolve(stmt.initializer);
		}
		this.define(stmt.name);
	}

	visitVariableExpr(expr: Expr.Variable): void {
		const scope = this.scopes.at(-1);
		if (scope && scope.get(expr.name.lexeme) === false) {
			Lox.error(
				expr.name,
				"Cannot read local variable in its own initializer.",
			);
		}

		this.resolveLocal(expr, expr.name);
	}

	visitAssignExpr(expr: Expr.Assign): void {
		this.resolve(expr.value);
		this.resolveLocal(expr, expr.name);
	}

	visitFuncStmt(stmt: Stmt.Func): void {
		this.declare(stmt.name);
		this.define(stmt.name);

		this.resolveFunc(stmt, FunctionType.Function);
	}

	visitExpressionStmt(stmt: Stmt.Expression): void {
		this.resolve(stmt.expression);
	}

	visitIfStmt(stmt: Stmt.If): void {
		this.resolve(stmt.condition);
		this.resolve(stmt.thenBranch);
		if (stmt.elseBranch !== null) this.resolve(stmt.elseBranch);
	}

	visitPrintStmt(stmt: Stmt.Print): void {
		this.resolve(stmt.expression);
	}

	visitReturnStmt(stmt: Stmt.Return): void {
		if (this.currentFunction === FunctionType.None) {
			Lox.error(stmt.keyword, "Can't return from top-level code.");
		}

		if (stmt.value !== null) {
			if (this.currentFunction === FunctionType.Initializer) {
				Lox.error(stmt.keyword, "Can't return a value from an initializer.");
			}

			this.resolve(stmt.value);
		}
	}

	visitWhileStmt(stmt: Stmt.While): void {
		this.resolve(stmt.condition);
		this.resolve(stmt.body);
	}

	visitBinaryExpr(expr: Expr.Binary): void {
		this.resolve(expr.left);
		this.resolve(expr.right);
	}

	visitCallExpr(expr: Expr.Call): void {
		this.resolve(expr.callee);

		for (const arg of expr.args) {
			this.resolve(arg);
		}
	}

	visitGroupingExpr(expr: Expr.Grouping): void {
		this.resolve(expr.expression);
	}

	visitLiteralExpr(expr: Expr.Literal): void {}

	visitLogicalExpr(expr: Expr.Logical): void {
		this.resolve(expr.left);
		this.resolve(expr.right);
	}

	visitUnaryExpr(expr: Expr.Unary): void {
		this.resolve(expr.right);
	}
}
