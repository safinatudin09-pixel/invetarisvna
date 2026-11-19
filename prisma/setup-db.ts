import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { spawn } from "child_process";
import path from "path";

function runCommandAsync(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command "${command} ${args.join(" ")}" exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

async function runSetup() {
  const dataDir = path.join(process.cwd(), ".pgdata");
  console.log("📦 Menginisialisasi engine PostgreSQL (PGlite) pada:", dataDir);

  const db = await PGlite.create(dataDir);
  const server = new PGLiteSocketServer({
    db,
    port: 5432,
    host: "127.0.0.1",
    maxConnections: 25,
  });

  await server.start();
  console.log("🚀 Server PostgreSQL aktif pada 127.0.0.1:5432");

  try {
    console.log("🔄 Menjalankan 'prisma db push'...");
    await runCommandAsync("npx", ["prisma", "db", "push", "--accept-data-loss", "--skip-generate"]);

    console.log("🌱 Menjalankan 'prisma/seed.ts'...");
    await runCommandAsync("npx", ["tsx", "prisma/seed.ts"]);

    console.log("🎉 Database PostgreSQL berhasil dimigrasi dan di-seed!");
  } finally {
    await server.stop();
    await db.close();
  }
}

runSetup().catch((err) => {
  console.error("❌ Gagal melakukan setup database:", err);
  process.exit(1);
});
