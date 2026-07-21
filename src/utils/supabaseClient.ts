import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hrwsvcgkmynjatbqshej.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_o-l6p2njFNZzRkMHNyK_8Q_dJuOI9qJ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);