import { createClient } from '@supabase/supabase-js';
import { testKitConnection } from '@/lib/kit';

export async function POST(request) {
  try {
    const { sessionToken, apiKey } = await request.json();

    if (!sessionToken) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!apiKey) {
      return Response.json({ error: 'API key is required' }, { status: 400 });
    }

    // Create Supabase client inside the handler
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify session
    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('session_token', sessionToken)
      .single();

    if (!session) {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Test the Kit connection
    const result = await testKitConnection(apiKey);

    return Response.json(result);
  } catch (error) {
    console.error('Kit test error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to test Kit connection' },
      { status: 500 }
    );
  }
}
