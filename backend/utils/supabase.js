import { createClient } from "@supabase/supabase-js";
import AppError from "./appError.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new AppError("Supabase URL and Key are required.", 500);
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
