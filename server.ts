import express from "express";
import path from "path";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const NEON_DB_URL = process.env.NEON_DB_URL || "";
const JWT_SECRET = process.env.JWT_SECRET || "estoque-pro-secret-key-2026";

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

  // API Route to create a new user
  app.post("/api/users", async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    if (!sql) {
      return res.status(503).json({ error: "Neon não configurado." });
    }

    try {
      const lowerUsername = username.toLowerCase().trim();
      const hash = await bcrypt.hash(password, 10);
      const nome = username.split('.')[0] || username; // Simple name generation

      console.log(`Creating user: "${lowerUsername}" (role: ${role})`);
      console.log(`Hash generated: ${hash.substring(0, 10)}...`);

      await sql`
        INSERT INTO usuarios (username, password_hash, nome, role)
        VALUES (${lowerUsername}, ${hash}, ${nome}, ${role})
      `;

      console.log("User created successfully in database.");
      res.status(201).json({ message: "Usuário criado com sucesso." });
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.message?.includes("unique constraint")) {
        return res.status(409).json({ error: "Este nome de usuário já existe." });
      }
      res.status(500).json({ error: "Erro ao criar usuário." });
    }
  });

  // API Route to list users
  app.get("/api/users", async (req, res) => {
    if (!sql) {
      return res.json([]);
    }

    try {
      const results = await sql`
        SELECT id, username, role, created_at FROM usuarios ORDER BY id DESC
      `;
      res.json(results);
    } catch (error: any) {
      console.error("Error listing users:", error);
      res.status(500).json({ error: "Erro ao listar usuários." });
    }
  });

  // API Route to check database status
  app.get("/api/admin/db-status", async (req, res) => {
    let usersTableExists = false;
    let productsTableExists = false;

    if (sql) {
      try {
        const usersCheck = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios')`;
        usersTableExists = usersCheck[0].exists;
        
        const productsCheck = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'produto')`;
        productsTableExists = productsCheck[0].exists;
      } catch (err) {
        console.error("DB Status check error:", err);
      }
    }

    const status = {
      connected: !!sql,
      tables: {
        produto: productsTableExists,
        usuarios: usersTableExists
      },
      errors: {
        db: sql ? null : "Neon não configurado",
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

  // API Route to setup the database tables
  app.get("/api/admin/setup", async (req, res) => {
    if (!sql) {
      return res.status(503).json({ error: "Neon não configurado." });
    }

    try {
      console.log("Starting database setup...");
      // Create usuarios table
      await sql`
        CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          nome TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log("Table 'usuarios' checked/created.");

      // Check if admin exists
      const adminResults = await sql`SELECT id FROM usuarios WHERE username = 'admin' LIMIT 1`;
      
      if (adminResults.length === 0) {
        console.log("Admin user not found. Creating default admin...");
        const hash = await bcrypt.hash("123", 10);
        await sql`
          INSERT INTO usuarios (username, password_hash, nome, role)
          VALUES ('admin', ${hash}, 'Administrador', 'admin')
        `;
        return res.json({ message: "Banco de dados configurado com sucesso! Usuário 'admin' criado com senha '123'." });
      } else {
        // If admin exists, let's ensure the password is '123' if requested via query param
        if (req.query.reset === 'true') {
          console.log("Resetting admin password to '123'...");
          const hash = await bcrypt.hash("123", 10);
          await sql`
            UPDATE usuarios SET password_hash = ${hash} WHERE username = 'admin'
          `;
          return res.json({ message: "Senha do usuário 'admin' resetada para '123'." });
        }
      }

      console.log("Admin user already exists.");
      res.json({ message: "Banco de dados já estava configurado. O usuário 'admin' já existe." });
    } catch (error: any) {
      console.error("Setup error:", error);
      res.status(500).json({ error: "Erro ao configurar banco de dados.", details: error.message });
    }
  });

  // API Route for Login Authentication
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const cleanUsername = username ? username.trim() : "";
    console.log(`Login attempt for username: "${cleanUsername}"`);

    if (!cleanUsername || !password) {
      return res.status(400).json({ error: "Usuário e senha são obrigatórios." });
    }

    // Fallback logic if SQL is not available
    if (!sql) {
      console.log("Neon SQL client not initialized. Falling back to hardcoded credentials.");
      if (cleanUsername.toLowerCase() === 'admin' && password === '123') {
        const token = jwt.sign({ username: 'admin', role: 'admin', nome: 'Administrador' }, JWT_SECRET, { expiresIn: '4h' });
        return res.json({ user: { username: 'Administrador', role: 'admin' }, token });
      }
      return res.status(503).json({ error: "Banco de dados não configurado." });
    }

    try {
      console.log("Checking if 'usuarios' table exists...");
      const tableCheck = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios')`;
      
      if (!tableCheck[0].exists) {
        console.log("Table 'usuarios' does not exist. Please run setup.");
        return res.status(503).json({ error: "Tabela de usuários não encontrada. Por favor, execute a configuração inicial na aba Base de Dados." });
      }

      console.log(`Querying database for user: "${cleanUsername.toLowerCase()}"`);
      const results = await sql`
        SELECT username, password_hash, nome, role FROM usuarios WHERE LOWER(username) = LOWER(${cleanUsername}) LIMIT 1
      `;

      console.log(`Query results length: ${results ? results.length : 0}`);

      if (results && results.length > 0) {
        const user = results[0];
        console.log(`User found in DB: "${user.username}". Comparing passwords...`);
        
        try {
          const isValid = await bcrypt.compare(password, user.password_hash);
          console.log(`Password valid: ${isValid}`);
          
          if (isValid) {
            const token = jwt.sign({ username: user.username, role: user.role, nome: user.nome }, JWT_SECRET, { expiresIn: '4h' });
            return res.json({ 
              user: { username: user.nome, role: user.role },
              token
            });
          } else {
            console.log("Password mismatch.");
          }
        } catch (bcryptErr) {
          console.error("Bcrypt comparison error:", bcryptErr);
          return res.status(500).json({ error: "Erro ao verificar senha." });
        }
      } else {
        console.log("User not found in database.");
        
        // Special case: if table exists but is empty, maybe setup didn't run correctly?
        const countResult = await sql`SELECT COUNT(*) FROM usuarios`;
        if (parseInt(countResult[0].count) === 0) {
          console.log("Table 'usuarios' is empty.");
          return res.status(401).json({ error: "Nenhum usuário cadastrado. Por favor, execute a configuração inicial na aba Base de Dados." });
        }
      }

      res.status(401).json({ error: "Usuário ou senha inválidos." });
    } catch (error: any) {
      console.error("Unexpected error during login:", error);
      res.status(500).json({ error: "Erro interno no servidor.", details: error.message });
    }
  });

  // API Route to verify token and get current user
  app.get("/api/auth/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Não autorizado." });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      res.json({ username: decoded.nome, role: decoded.role });
    } catch (err) {
      res.status(401).json({ error: "Sessão expirada ou inválida." });
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
