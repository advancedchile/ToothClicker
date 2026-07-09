const { parse } = require("@babel/parser");
const fs = require("fs");

try {
  const code = fs.readFileSync("three-clinic-map.jsx", "utf8");
  parse(code, {
    sourceType: "module",
    plugins: ["jsx", "optionalChaining", "nullishCoalescingOperator"]
  });
  console.log("Syntax is OK!");
} catch (e) {
  console.error("Syntax Error:", e.message);
  process.exit(1);
}
