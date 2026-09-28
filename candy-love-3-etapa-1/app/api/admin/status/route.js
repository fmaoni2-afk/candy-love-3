import { adminUser } from '../../../../lib/supabase';
export async function GET(request) {
  return Response.json({ admin: !!(await adminUser(request)) });
}
