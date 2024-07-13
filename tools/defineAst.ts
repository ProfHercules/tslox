import { writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";

type ClassDef = {
	name: string;
	fields: {
		visibility?: string;
		name: string;
		type: string;
	}[];
};

async function defineAst({
	outDir,
	imports,
	baseName,
	types,
}: {
	outDir: string;
	imports: string[];
	baseName: string;
	types: ClassDef[];
}) {
	let content = "";

	for (const imp of imports) {
		content += `${imp}\n`;
	}

	if (imports.length > 0) {
		content += "\n";
	}

	content += `export namespace ${baseName} {\n`;

	// define visitor interface
	content += "export interface Visitor<R> {\n";
	for (const { name } of types) {
		content += `  visit${name}${baseName}(${baseName.toLowerCase()}: ${name}): R;\n`;
	}
	content += "}\n\n";

	// define base class
	content += `export abstract class ${baseName} {\n`;
	content += "  abstract accept<R>(visitor: Visitor<R>): R;\n";
	content += "}\n\n";

	for (const { name, fields } of types) {
		content += `\nexport class ${name} extends ${baseName} {\n`;
		content += "  constructor(\n";
		for (const field of fields) {
			content += `    ${field.visibility ?? "public"} ${field.name}: ${field.type},\n`;
		}
		content += "  ) {\n";
		content += "    super();\n";
		content += "  }\n\n";

		content += "  override accept<R>(visitor: Visitor<R>): R {\n";
		content += `    return visitor.visit${name}${baseName}(this);\n`;
		content += "  }\n";
		content += "}\n";
	}

	content += "}\n";

	const outFile = `${outDir}/${baseName.toLowerCase()}.ts`;

	await writeFile(outFile, content);
	execSync(`npx @biomejs/biome format --write ${outFile}`);
}

defineAst({
	outDir: "src/core",
	imports: ["import type { Token } from './token';"],
	baseName: "Expr",
	types: [
		{
			name: "Assign",
			fields: [
				{ name: "name", type: "Token" },
				{ name: "value", type: "Expr" },
			],
		},
		{
			name: "Binary",
			fields: [
				{ name: "left", type: "Expr" },
				{ name: "operator", type: "Token" },
				{ name: "right", type: "Expr" },
			],
		},
		{
			name: "Call",
			fields: [
				{ name: "callee", type: "Expr" },
				{ name: "paren", type: "Token" },
				{ name: "args", type: "Expr[]" },
			],
		},
		{
			name: "Grouping",
			fields: [{ name: "expression", type: "Expr" }],
		},
		{
			name: "Literal",
			fields: [{ name: "value", type: "unknown" }],
		},
		{
			name: "Logical",
			fields: [
				{ name: "left", type: "Expr" },
				{ name: "operator", type: "Token" },
				{ name: "right", type: "Expr" },
			],
		},
		{
			name: "Unary",
			fields: [
				{ name: "operator", type: "Token" },
				{ name: "right", type: "Expr" },
			],
		},
		{
			name: "Variable",
			fields: [{ name: "name", type: "Token" }],
		},
	],
});

defineAst({
	outDir: "src/core",
	imports: [
		"import type { Expr } from './expr';", //
		"import type { Token } from './token';",
	],
	baseName: "Stmt",
	types: [
		{
			name: "Block",
			fields: [{ name: "statements", type: "Stmt[]" }],
		},
		{
			name: "Expression",
			fields: [{ name: "expression", type: "Expr.Expr" }],
		},
		{
			name: "Func",
			fields: [
				{ name: "name", type: "Token" },
				{ name: "params", type: "Token[]" },
				{ name: "body", type: "Stmt[]" },
			],
		},
		{
			name: "If",
			fields: [
				{ name: "condition", type: "Expr.Expr" },
				{ name: "thenBranch", type: "Stmt" },
				{ name: "elseBranch", type: "Stmt | null" },
			],
		},
		{
			name: "Print",
			fields: [{ name: "expression", type: "Expr.Expr" }],
		},
		{
			name: "Return",
			fields: [
				{ name: "keyword", type: "Token" },
				{ name: "value", type: "Expr.Expr | null" },
			],
		},
		{
			name: "Var",
			fields: [
				{ name: "name", type: "Token" },
				{ name: "initializer", type: "Expr.Expr | null" },
			],
		},
		{
			name: "While",
			fields: [
				{ name: "condition", type: "Expr.Expr" },
				{ name: "body", type: "Stmt" },
			],
		},
	],
});
