import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://lleyeblqbpkjgabytmyq.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_1MlPWWhnBpjRRJ-IycyT6Q_SKZyEvDV";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function startServer() {
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
      
      // Attempt to fetch with all columns first
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

  // API Route for Login Authentication
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

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
