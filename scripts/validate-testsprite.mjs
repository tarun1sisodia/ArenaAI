import fs from "node:fs";
import path from "node:path";

const root = path.resolve("testsprite");
const files = [
  "standard_prd.json",
  "code_summary.json",
  "customer/frontend_test_plan.json",
  "admin_frontend_test_plan.json",
  "backend/backend_test_plan.json",
  "backend/test_data.json",
];
for (const relative of files) {
  const file = path.join(root, relative);
  const value = JSON.parse(fs.readFileSync(file, "utf8"));
  if (relative.endsWith("test_plan.json") && (!Array.isArray(value.test_cases) || value.test_cases.length < 10)) {
    throw new Error(`${relative} must contain at least 10 test cases`);
  }
  console.log(`valid ${relative}`);
}
