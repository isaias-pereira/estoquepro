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
