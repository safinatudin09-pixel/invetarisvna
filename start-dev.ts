import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { spawn } from "child_process";
import path from "path";

async function startApp() {
  const dataDir = path.join(process.cwd(), ".pgdata");
  console.log("📦 Menghubungkan ke database PostgreSQL lokal (.pgdata)...");

  const db = await PGlite.create(dataDir);
  const pgServer = new PGLiteSocketServer({
    db,
    port: 5432,
    host: "127.0.0.1",
    maxConnections: 30,
  });

  await pgServer.start();
  console.log("✅ PostgreSQL Server aktif pada 127.0.0.1:5432");
  console.log("🚀 Menjalankan Next.js Server pada http://localhost:3000 ...");

  const nextProc = spawn("npx", ["next", "dev", "-p", "3000"], {
    stdio: "inherit",
    shell: true,
  });

  const cleanup = async () => {
    console.log("\n🛑 Menutup server...");
    nextProc.kill();
    await pgServer.stop();
    await db.close();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

startApp().catch((err) => {
  console.error("❌ Gagal menjalankan aplikasi:", err);
  process.exit(1);
});
