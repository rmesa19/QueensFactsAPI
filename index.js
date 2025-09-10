import express from "express";
import rateLimit from "express-rate-limit"
import helmet from "helmet";
import dotenv from "dotenv";
import { query, param, validationResult } from "express-validator";
import { createClient } from "@supabase/supabase-js";
import * as fuzz from "fuzzball";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 100 requests per `windowMs`
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());

app.use("/api", limiter);

// app.use((req, res, next) => {
//   const logLine = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} from ${req.ip}\n`;
//   fs.appendFile("requests.txt", logLine, (err) => {
//     if (err) console.error("Error writing request log:", err);
//   });
//   next();
// });
app.use(async (req, res, next) => {
  try {
    const { method, originalUrl, ip } = req;

    const { error } = await supabase.from("endpoint_audit").insert([
      {
        request_type: method,
        endpoint_request: originalUrl,
        ip_address: ip,
        // 'created_at' will auto-fill if the column has DEFAULT now()
      },
    ]);

    if (error) {
      console.error("Error inserting into endpoint_audit:", error);
    }
  } catch (err) {
    console.error("Middleware logging error:", err);
  }

  next();
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_LVL_KEY
);

// Utility: fuzzy match
function fuzzyMatch(query, choices, cutoff = 60) {
  const result = fuzz.extract(query, choices, { scorer: fuzz.token_sort_ratio, limit: 1 });
  if (result.length > 0 && result[0][1] >= cutoff) {
    return result[0][0];
  }
  return null;
}

// Get fact by ID
app.get(
  "/api/facts/:id",
  [param("id").isInt().withMessage("ID must be an integer")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;

    const { data, error } = await supabase
      .from("neighborhood_fun_facts")
      .select("*")
      .eq("fact_id", id);

    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Not found" });

    res.json(data);
  }
);

// Get facts with filters + fuzzy matching
// http://localhost:5000/api/facts?random=true
app.get("/api/facts", [
  // Validate and sanitize query inputs
  query("zipcode").optional().isPostalCode("US"),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("random").optional().isIn(["true", "false"]),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { neighborhood, category, zipcode, random, limit } = req.query;
  let queryBuilder = supabase.from("neighborhood_fun_facts").select("*");

  // Neighborhood fuzzy match
  if (neighborhood) {
    const { data: allNeighs } = await supabase.from("neighborhood_fun_facts").select("neighborhood");
    const distinct = [...new Set(allNeighs.map(n => n.neighborhood))];
    const match = fuzzyMatch(neighborhood, distinct);
    if (!match) return res.status(404).json({ error: "No close neighborhood match found" });
    queryBuilder = queryBuilder.eq("neighborhood", match);
  }

  // Category fuzzy match
  if (category) {
    const { data: allCats } = await supabase.from("neighborhood_fun_facts").select("category");
    const distinct = [...new Set(allCats.map(c => c.category))];
    const match = fuzzyMatch(category, distinct);
    if (!match) return res.status(404).json({ error: "No close category match found" });
    queryBuilder = queryBuilder.eq("category", match);
  }

  if (zipcode) queryBuilder = queryBuilder.eq("zipcode", zipcode);
  if (limit) queryBuilder = queryBuilder.limit(parseInt(limit));

  const { data, error } = await queryBuilder;
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.json([]);

  if (random === "true") {
    if (limit) {
      const n = Math.min(parseInt(limit), data.length);
      const shuffled = [...data].sort(() => 0.5 - Math.random());
      return res.json(shuffled.slice(0, n));
    } else {
      return res.json(data[Math.floor(Math.random() * data.length)]);
    }
  }

  res.json(data);
});

app.get("/api/all", async (req, res) => {
    
    let { data: neighborhood_fun_facts, error } = await supabase
    .from('neighborhood_fun_facts')
    .select('*');
    
    res.json(neighborhood_fun_facts);
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
