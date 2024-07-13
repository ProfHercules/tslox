import type { Token } from "./token";

export namespace Expr {
	export interface Visitor<R> {
		visitAssignExpr(expr: Assign): R;
		visitBinaryExpr(expr: Binary): R;
		visitCallExpr(expr: Call): R;
		visitGroupingExpr(expr: Grouping): R;
		visitLiteralExpr(expr: Literal): R;
		visitLogicalExpr(expr: Logical): R;
		visitUnaryExpr(expr: Unary): R;
		visitVariableExpr(expr: Variable): R;
	}

	export abstract class Expr {
		abstract accept<R>(visitor: Visitor<R>): R;
	}

	export class Assign extends Expr {
		constructor(
			public name: Token,
			public value: Expr,
		) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitAssignExpr(this);
		}
	}

	export class Binary extends Expr {
		constructor(
			public left: Expr,
			public operator: Token,
			public right: Expr,
		) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitBinaryExpr(this);
		}
	}

	export class Call extends Expr {
		constructor(
			public callee: Expr,
			public paren: Token,
			public args: Expr[],
		) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitCallExpr(this);
		}
	}

	export class Grouping extends Expr {
		constructor(public expression: Expr) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitGroupingExpr(this);
		}
	}

	export class Literal extends Expr {
		constructor(public value: unknown) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitLiteralExpr(this);
		}
	}

	export class Logical extends Expr {
		constructor(
			public left: Expr,
			public operator: Token,
			public right: Expr,
		) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitLogicalExpr(this);
		}
	}

	export class Unary extends Expr {
		constructor(
			public operator: Token,
			public right: Expr,
		) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitUnaryExpr(this);
		}
	}

	export class Variable extends Expr {
		constructor(public name: Token) {
			super();
		}

		override accept<R>(visitor: Visitor<R>): R {
			return visitor.visitVariableExpr(this);
		}
	}
}
