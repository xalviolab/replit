import { createClient } from '@supabase/supabase-js';
import { type UserProgress, type UserStats, type Tables } from '@/types';

// Get Supabase URL and API key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || "";

// Create Supabase client with database typing
export const supabase = createClient<Tables>(supabaseUrl, supabaseKey);

// User authentication helpers
export async function signUp(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });
  
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  
  if (error) throw error;
  return data?.user;
}

// User progress helpers
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data || [];
}

export async function updateUserProgress(progress: Partial<UserProgress>) {
  const { data, error } = await supabase
    .from('user_progress')
    .upsert(progress)
    .select();
  
  if (error) throw error;
  return data;
}

export async function getUserStats(userId: string) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned" which is fine
  return data;
}

export async function updateUserStats(userId: string, stats: Record<string, any>) {
  const { data, error } = await supabase
    .from('user_stats')
    .upsert({ user_id: userId, ...stats })
    .select();
  
  if (error) throw error;
  return data;
}
