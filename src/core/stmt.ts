import type { Expr } from "./expr";
import type { Token } from "./token";

export namespace Stmt {
	export interface Visitor<R> {
		visitBlockStmt(stmt: Block): R;
		visitExpressionStmt(stmt: Expression): R;
		visitFuncStmt(stmt: Func): R;
		visitIfStmt(stmt: If): R;
		visitPrintStmt(stmt: Print): R;
		visitReturnStmt(stmt: Return): R;
		visitVarStmt(stmt: Var): R;
		visitWhileStmt(stmt: While): R;
	}

	export abstract class Stmt {
		abstract accept<R>(visitor: Visitor<R>): R;
	}

	export class Block extends Stmt {
		constructor(public statements: Stmt[]) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitBlockStmt(this);
		}
	}

	export class Expression extends Stmt {
		constructor(public expression: Expr.Expr) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitExpressionStmt(this);
		}
	}

	export class Func extends Stmt {
		constructor(
			public name: Token,
			public params: Token[],
			public body: Stmt[],
		) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitFuncStmt(this);
		}
	}

	export class If extends Stmt {
		constructor(
			public condition: Expr.Expr,
			public thenBranch: Stmt,
			public elseBranch: Stmt | null,
		) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitIfStmt(this);
		}
	}

	export class Print extends Stmt {
		constructor(public expression: Expr.Expr) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitPrintStmt(this);
		}
	}

	export class Return extends Stmt {
		constructor(
			public keyword: Token,
			public value: Expr.Expr | null,
		) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitReturnStmt(this);
		}
	}

	export class Var extends Stmt {
		constructor(
			public name: Token,
			public initializer: Expr.Expr | null,
		) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitVarStmt(this);
		}
	}

	export class While extends Stmt {
		constructor(
			public condition: Expr.Expr,
			public body: Stmt,
		) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitWhileStmt(this);
		}
	}
}
