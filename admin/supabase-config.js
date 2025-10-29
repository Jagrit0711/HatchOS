// Supabase configuration
const SUPABASE_URL = 'https://oznuzgelchqutoipmspv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96bnV6Z2VsY2hxdXRvaXBtc3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjE4NTAsImV4cCI6MjA3Njg5Nzg1MH0.83ZBg1MZyaiD2VQWoyeGHJ1lT-wSMMxvA_Ir1nQAo2U';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);