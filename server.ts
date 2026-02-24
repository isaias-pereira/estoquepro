import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_3eSWoBOkXqb1@ep-sparkling-hall-acmrc7fp-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to search for a product by code or EAN
  app.get("/api/products/:code", async (req, res) => {
    const { code } = req.params;
    try {
      // Searching by both 'codigo' and 'ean' columns as per the app's logic
      const query = "SELECT * FROM produto WHERE codigo = $1 OR ean = $1 LIMIT 1";
      const result = await pool.query(query, [code]);

      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ message: "Produto não encontrado no banco de dados." });
      }
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Erro ao consultar o banco de dados." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
