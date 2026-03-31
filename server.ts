import express from "express";
import path from "path";
import { neon } from "@neondatabase/serverless";

const NEON_DB_URL = process.env.NEON_DB_URL || "";

let sql: any = null;
if (NEON_DB_URL) {
  try {
    let sanitizedUrl = NEON_DB_URL.trim();
    
    // Remove "psql " prefix if present (common copy-paste from Neon dashboard)
    if (sanitizedUrl.startsWith('psql ')) {
      sanitizedUrl = sanitizedUrl.substring(5).trim();
    }
    
    // Remove surrounding single or double quotes if present
    if ((sanitizedUrl.startsWith("'") && sanitizedUrl.endsWith("'")) || 
        (sanitizedUrl.startsWith('"') && sanitizedUrl.endsWith('"'))) {
      sanitizedUrl = sanitizedUrl.substring(1, sanitizedUrl.length - 1).trim();
    }

    // Basic validation
    if (!sanitizedUrl.startsWith('postgresql://') && !sanitizedUrl.startsWith('postgres://')) {
      console.error(`Invalid NEON_DB_URL format. Must start with postgresql:// or postgres://. Found: "${sanitizedUrl.substring(0, 20)}..."`);
    } else {
      sql = neon(sanitizedUrl);
      const host = new URL(sanitizedUrl).hostname;
      console.log(`Neon client initialized for host: ${host}`);
      
      // Log masked URL for debugging
      const maskedUrl = sanitizedUrl.substring(0, 20) + "..." + sanitizedUrl.substring(sanitizedUrl.length - 5);
      console.log(`Using Neon DB URL: ${maskedUrl}`);
    }
  } catch (error) {
    console.error("Failed to initialize Neon client:", error);
  }
} else {
  console.warn("Neon DB URL missing. Database features will be disabled.");
}

async function createServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check for production monitoring
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Route to search for a product by code or EAN using Neon
  app.get("/api/products/:code", async (req, res) => {
    const { code } = req.params;
    
    if (!code || code.trim() === "") {
      return res.status(400).json({ error: "Código inválido." });
    }

    if (!sql) {
      return res.status(503).json({ error: "Serviço de banco de dados Neon indisponível." });
    }

    try {
      const cleanCode = code.trim();
      
      try {
        const neonResults = await sql`
          SELECT ean, codigo, descricao FROM produto WHERE ean = ${cleanCode} OR codigo = ${cleanCode} LIMIT 1
        `;

        if (neonResults && neonResults.length > 0) {
          const product = neonResults[0];
          return res.json({
            ...product,
            preco: (product as any).preco || 0,
            estoque: (product as any).estoque || 0
          });
        }
      } catch (neonErr) {
        console.error("Neon Query Error:", neonErr);
        return res.status(500).json({ error: "Erro na consulta ao banco de dados Neon." });
      }
      
      res.status(404).json({ message: "Produto não encontrado no banco de dados central." });
    } catch (error: any) {
      console.error("Unexpected error during product search:", error);
      res.status(500).json({ 
        error: "Erro interno ao consultar o banco de dados.",
        details: error.message || "Erro desconhecido"
      });
    }
  });

  // API Route to create a new user (Disabled - previously Supabase)
  app.post("/api/users", async (req, res) => {
    res.status(501).json({ error: "Funcionalidade de criação de usuários desativada (Supabase removido)." });
  });

  // API Route to list users (Disabled - previously Supabase)
  app.get("/api/users", async (req, res) => {
    res.json([]);
  });

  // API Route to check database status
  app.get("/api/admin/db-status", async (req, res) => {
    const status = {
      connected: !!sql,
      tables: {
        produto: !!sql,
        users_management: false
      },
      errors: {
        produto: sql ? null : "Neon não configurado",
        users_management: "Supabase removido"
      }
    };
    res.json(status);
  });

  // API Route to bulk upload products (Disabled - previously Supabase)
  app.post("/api/admin/sync-products", async (req, res) => {
    res.status(501).json({ error: "Sincronização com banco de dados central desativada (Supabase removido)." });
  });

  // API Route to fetch notes (Disabled - previously Supabase)
  app.get("/api/notes", async (req, res) => {
    res.json([]);
  });

  // API Route for Login Authentication
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt: ${username}`);

    if (!username || !password) {
      return res.status(400).json({ error: "Usuário e senha são obrigatórios." });
    }

    try {
      // Check hardcoded defaults
      if (username === 'admin' && password === '123') {
        return res.json({ username: 'Administrador', role: 'admin' });
      }
      if (username === 'user' && password === '123') {
        return res.json({ username: 'Usuário Comum', role: 'user' });
      }

      res.status(401).json({ error: "Usuário ou senha inválidos." });
    } catch (error: any) {
      console.error("Unexpected error during login:", error);
      res.status(500).json({ error: "Erro interno no servidor." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve from the 'dist' folder
    const distPath = path.resolve(process.cwd(), "dist");
    console.log(`Serving static files from: ${distPath}`);
    
    app.use(express.static(distPath));
    
    // SPA fallback: serve index.html for any unknown routes
    app.get("*all", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error("Error sending index.html:", err);
          // Fallback if index.html is missing
          res.status(500).send("Erro ao carregar o aplicativo. Verifique se o build foi realizado.");
        }
      });
    });
  }

  return app;
}

// For local development and the current platform
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  createServer().then(app => {
    app.listen(3000, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:3000`);
    });
  }).catch(err => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}

// Export for Vercel serverless functions
let cachedApp: any = null;
export default async (req: any, res: any) => {
  if (!cachedApp) {
    cachedApp = await createServer();
  }
  return cachedApp(req, res);
};
