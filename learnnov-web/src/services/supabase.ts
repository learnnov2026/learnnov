import { createClient } from '@supabase/supabase-js';

// Supabase Free Lifetime Cloud Database Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cloud Database Tables Operations Helper
export const CloudDBService = {
  async fetchUsers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) console.error('Supabase users fetch error:', error);
    return data || [];
  },

  async fetchCourses() {
    const { data, error } = await supabase.from('courses').select('*');
    if (error) console.error('Supabase courses fetch error:', error);
    return data || [];
  },

  async fetchEnrollments() {
    const { data, error } = await supabase.from('enrollments').select('*');
    if (error) console.error('Supabase enrollments fetch error:', error);
    return data || [];
  },

  async createEnrollment(userId: number, courseId: number) {
    const { data, error } = await supabase.from('enrollments').insert([
      { user_id: userId, course_id: courseId, status: 'pending', payment_status: 'unpaid' }
    ]);
    if (error) console.error('Supabase enrollment insert error:', error);
    return data;
  }
};
