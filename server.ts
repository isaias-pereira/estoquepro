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
      
      // Searching by both 'codigo' and 'ean' columns using Supabase client
      const { data, error } = await supabase
        .from('produto')
        .select('ean, codigo, descricao')
        .or(`codigo.eq.${cleanCode},ean.eq.${cleanCode}`)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return res.status(404).json({ message: "Produto não encontrado no banco de dados central." });
        }
        throw error;
      }

      if (data) {
        res.json(data);
      } else {
        res.status(404).json({ message: "Produto não encontrado no banco de dados central." });
      }
    } catch (error) {
      console.error("Supabase error during product search:", error);
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
