import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
const { Pool } = pg;

const DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_3eSWoBOkXqb1@ep-sparkling-hall-acmrc7fp-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Use environment variable if available, otherwise fallback to the provided Neon URL
const DATABASE_URL = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon/AWS RDS in many environments
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check for production monitoring
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Route to search for a product by code or EAN
  app.get("/api/products/:code", async (req, res) => {
    const { code } = req.params;
    
    if (!code || code.trim() === "") {
      return res.status(400).json({ error: "Código inválido." });
    }

    try {
      // Searching by both 'codigo' and 'ean' columns
      // Using parameterized query to prevent SQL Injection
      const query = "SELECT ean, codigo, descricao FROM produto WHERE codigo = $1 OR ean = $1 LIMIT 1";
      const result = await pool.query(query, [code.trim()]);

      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ message: "Produto não encontrado no banco de dados central." });
      }
    } catch (error) {
      console.error("Database error during product search:", error);
      res.status(500).json({ error: "Erro interno ao consultar o banco de dados." });
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
