import express from "express";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { neon } from "@neondatabase/serverless";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://lleyeblqbpkjgabytmyq.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_1MlPWWhnBpjRRJ-IycyT6Q_SKZyEvDV";
const NEON_DB_URL = 'postgresql://neondb_owner:npg_3eSWoBOkXqb1@ep-sparkling-hall-acmrc7fp-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const sql = neon(NEON_DB_URL);

async function createServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check for production monitoring
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Route to search for a product by code or EAN using Supabase
  app.get("/api/products/:code", async (req, res) => {
    const { code } = req.params;
    
    if (!code || code.trim() === "") {
      return res.status(400).json({ error: "Código inválido." });
    }

    try {
      const cleanCode = code.trim();
      
      // Priority 1: Search in Neon Database (as requested)
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
        // Continue to Supabase if Neon fails
      }

      // Priority 2: Search in Supabase (Fallback)
      let response = await supabase
        .from('produto')
        .select('ean, codigo, descricao, preco, estoque')
        .or(`codigo.eq.${cleanCode},ean.eq.${cleanCode}`)
        .limit(1)
        .maybeSingle();

      let data = response.data;
      let error = response.error;

      // If it fails, it might be because 'preco' or 'estoque' columns are missing in Supabase
      if (error && error.message.includes('column') && (error.message.includes('preco') || error.message.includes('estoque'))) {
        console.warn("Columns 'preco' or 'estoque' missing in Supabase, falling back to basic columns.");
        const fallback = await supabase
          .from('produto')
          .select('ean, codigo, descricao')
          .or(`codigo.eq.${cleanCode},ean.eq.${cleanCode}`)
          .limit(1)
          .maybeSingle();
        
        if (fallback.data) {
          data = { 
            ...fallback.data, 
            preco: 0, 
            estoque: 0 
          } as any;
        } else {
          data = null;
        }
        error = fallback.error;
      }

      if (error) {
        console.error("Supabase Query Error:", error);
        if (error.code === 'PGRST116' || error.message.includes('relation "produto" does not exist')) {
          return res.status(404).json({ 
            error: "Base de dados não encontrada ou tabela 'produto' não existe no Supabase.",
            message: "Por favor, crie a tabela 'produto' no seu painel do Supabase."
          });
        }
        return res.status(500).json({ 
          error: "Erro na consulta ao banco de dados.",
          message: error.message,
          code: error.code
        });
      }

      if (data) {
        res.json(data);
      } else {
        res.status(404).json({ message: "Produto não encontrado no banco de dados central." });
      }
    } catch (error: any) {
      console.error("Unexpected error during product search:", error);
      res.status(500).json({ 
        error: "Erro interno ao consultar o banco de dados.",
        details: error.message || "Erro desconhecido"
      });
    }
  });

  // API Route to create a new user in Supabase
  app.post("/api/users", async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    try {
      const { data, error } = await supabase
        .from('users_management')
        .insert([{ username, password, role }])
        .select()
        .single();

      if (error) {
        console.error("Supabase Insert Error:", error);
        return res.status(500).json({ 
          error: "Erro ao criar usuário no banco de dados.",
          message: error.message,
          code: error.code
        });
      }

      res.status(201).json(data);
    } catch (error: any) {
      console.error("Unexpected error during user creation:", error);
      res.status(500).json({ 
        error: "Erro interno ao criar usuário.",
        details: error.message || "Erro desconhecido"
      });
    }
  });

  // API Route to list users (for admin view)
  app.get("/api/users", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('users_management')
        .select('id, username, role, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Fetch Error:", error);
        return res.status(500).json({ 
          error: "Erro ao buscar usuários.",
          message: error.message
        });
      }

      res.json(data);
    } catch (error: any) {
      console.error("Unexpected error during user fetch:", error);
      res.status(500).json({ 
        error: "Erro interno ao buscar usuários."
      });
    }
  });

  // API Route to check Supabase connection and table status
  app.get("/api/admin/db-status", async (req, res) => {
    try {
      const { error: prodError } = await supabase.from('produto').select('count', { count: 'exact', head: true });
      const { error: userError } = await supabase.from('users_management').select('count', { count: 'exact', head: true });
      
      const status = {
        connected: true,
        tables: {
          produto: !prodError || !prodError.message.includes('relation "produto" does not exist'),
          users_management: !userError || !userError.message.includes('relation "users_management" does not exist')
        },
        errors: {
          produto: prodError ? prodError.message : null,
          users_management: userError ? userError.message : null
        }
      };
      
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ connected: false, error: err.message });
    }
  });

  // API Route to bulk upload products to Supabase
  app.post("/api/admin/sync-products", async (req, res) => {
    const { products } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Nenhum produto enviado para sincronização." });
    }

    try {
      // Supabase insert/upsert
      const { data, error } = await supabase
        .from('produto')
        .upsert(products, { onConflict: 'ean' });

      if (error) {
        console.error("Supabase Sync Error:", error);
        return res.status(500).json({ 
          error: "Erro ao sincronizar com Supabase.",
          message: error.message
        });
      }

      res.json({ success: true, count: products.length });
    } catch (err: any) {
      res.status(500).json({ error: "Erro interno na sincronização.", details: err.message });
    }
  });

  // API Route for Login Authentication
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt: ${username}`);

    if (!username || !password) {
      return res.status(400).json({ error: "Usuário e senha são obrigatórios." });
    }

    try {
      // Check hardcoded defaults first for safety
      if (username === 'admin' && password === '123') {
        return res.json({ username: 'Administrador', role: 'admin' });
      }
      if (username === 'user' && password === '123') {
        return res.json({ username: 'Usuário Comum', role: 'user' });
      }

      // Check Supabase
      const { data, error } = await supabase
        .from('users_management')
        .select('username, role, password')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        console.error("Supabase Auth Error:", error);
        return res.status(500).json({ error: "Erro na autenticação." });
      }

      if (data) {
        // Remove password from response
        const { password: _, ...user } = data;
        res.json(user);
      } else {
        res.status(401).json({ error: "Usuário ou senha inválidos." });
      }
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
    app.get("*", (req, res) => {
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
