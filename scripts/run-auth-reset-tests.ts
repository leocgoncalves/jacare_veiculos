import { execSync } from "child_process";

const testDatabaseUrl = "file:./test.db";
const testEnv: NodeJS.ProcessEnv = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
  NODE_ENV: "test",
};

function runCommand(command: string) {
  execSync(command, {
    stdio: "inherit",
    env: testEnv,
  });
}

try {
  runCommand("npx prisma db push --skip-generate");
  runCommand("npx tsx --test tests/auth-password-reset.test.ts");
} catch (error) {
  process.exitCode = 1;
  throw error;
}
