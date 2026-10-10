// A message (lib/i18n/message.ts) is an object, and TypeScript lets an object
// into a template literal, a string concatenation, String(), an array's
// join() or JSX (as a child, or an attribute of an HTML element) without a word:
// the review once read "[object Object]: [object Object]". This reads every
// file with the type checker and fails where a message is turned into a string
// any way but through say(). A legacy message's own text is the one exception.
import assert from "node:assert/strict";
import { test } from "node:test";
import ts from "typescript";

test("no message becomes a string except through say()", () => {
  const root = new URL("..", import.meta.url).pathname;
  const config = ts.parseJsonConfigFileContent(ts.readConfigFile(`${root}tsconfig.json`, ts.sys.readFile).config, ts.sys, root);
  const program = ts.createProgram(config.fileNames.filter(name => !name.includes("/tests/")), config.options);
  const checker = program.getTypeChecker();
  const isMessage = (type: ts.Type): boolean => type.isUnion() ? type.types.some(isMessage) : ["key", "ref"].some(name => type.getProperty(name)) && !!type.getProperty("params");
  const found: string[] = [];
  for (const file of program.getSourceFiles()) {
    if (file.isDeclarationFile || file.fileName.includes("node_modules")) continue;
    const flag = (expression: ts.Expression) => {
      if (/params\?\.text/.test(expression.getText())) return;
      if (isMessage(checker.getTypeAtLocation(expression))) found.push(`${file.fileName.slice(root.length)}:${file.getLineAndCharacterOfPosition(expression.getStart()).line + 1}: ${expression.getText().slice(0, 60)}`);
    };
    const visit = (node: ts.Node) => {
      if (ts.isTemplateSpan(node)) flag(node.expression);
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) { flag(node.left); flag(node.right); }
      if (ts.isCallExpression(node) && node.expression.getText() === "String" && node.arguments[0]) flag(node.arguments[0]);
      if (ts.isJsxExpression(node) && node.expression) {
        const parent = node.parent;
        const child = ts.isJsxElement(parent) || ts.isJsxFragment(parent);
        const htmlAttribute = ts.isJsxAttribute(parent) && /^[a-z]/.test(parent.parent.parent.tagName.getText());
        if (child || htmlAttribute) flag(node.expression);
      }
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "join") {
        const element = checker.getIndexTypeOfType(checker.getTypeAtLocation(node.expression.expression), ts.IndexKind.Number);
        if (element && isMessage(element)) found.push(`${file.fileName.slice(root.length)}:${file.getLineAndCharacterOfPosition(node.getStart()).line + 1}: ${node.getText().slice(0, 60)}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }
  assert.deepEqual(found, []);
});
