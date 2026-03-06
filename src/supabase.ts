import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://obqcfybxtjyzvofvltfj.supabase.co';
const supabaseKey = 'sb_publishable_ppcTFNvhTvAvT6qx205VEA_1kLh0Sf7';

export const supabase = createClient(supabaseUrl, supabaseKey);
