export enum TokenType {
	// Single-character tokens.
	LEFT_PAREN = "(",
	RIGHT_PAREN = ")",
	LEFT_BRACE = "{",
	RIGHT_BRACE = "}",
	COMMA = ",",
	DOT = ".",
	MINUS = "-",
	PLUS = "+",
	SEMICOLON = ";",
	SLASH = "/",
	STAR = "*",

	// One or two character tokens.
	BANG = "!",
	BANG_EQUAL = "!=",
	EQUAL = "=",
	EQUAL_EQUAL = "==",
	GREATER = ">",
	GREATER_EQUAL = ">=",
	LESS = "<",
	LESS_EQUAL = "<=",

	// Literals.
	IDENTIFIER = "IDENTIFIER",
	STRING = "STRING",
	NUMBER = "NUMBER",

	// Keywords.
	AND = "and",
	CLASS = "class",
	ELSE = "else",
	FALSE = "false",
	FUN = "FUN",
	FOR = "FOR",
	IF = "IF",
	NIL = "NIL",
	OR = "OR",
	PRINT = "print",
	RETURN = "return",
	SUPER = "super",
	THIS = "this",
	TRUE = "true",
	VAR = "var",
	WHILE = "while",

	EOF = "EOF",
}

export class Token {
	constructor(
		public type: TokenType,
		public lexeme: string,
		public literal: unknown,
		public line: number,
	) {}

	public toString() {
		return `${this.type} ${this.lexeme} ${this.literal}`;
	}
}
