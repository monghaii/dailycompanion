import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'coach') {
      return NextResponse.json(
        { error: 'Unauthorized - Coach access only' },
        { status: 403 }
      );
    }

    // Get coach ID
    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach profile not found' },
        { status: 404 }
      );
    }

    // Get or create landing config
    const { data: config, error } = await supabase
      .rpc('get_or_create_landing_config', { p_coach_id: coach.id });

    if (error) {
      console.error('Error fetching landing config:', error);
      return NextResponse.json(
        { error: 'Failed to fetch landing configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Landing config GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch landing configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'coach') {
      return NextResponse.json(
        { error: 'Unauthorized - Coach access only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { error: 'Config is required' },
        { status: 400 }
      );
    }

    // Get coach ID
    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach profile not found' },
        { status: 404 }
      );
    }

    // Update or insert landing config
    const { data: existingConfig } = await supabase
      .from('coach_landing_configs')
      .select('id')
      .eq('coach_id', coach.id)
      .single();

    let result;
    if (existingConfig) {
      // Update existing
      result = await supabase
        .from('coach_landing_configs')
        .update({ config })
        .eq('coach_id', coach.id);
    } else {
      // Insert new
      result = await supabase
        .from('coach_landing_configs')
        .insert({ coach_id: coach.id, config });
    }

    if (result.error) {
      console.error('Error saving landing config:', result.error);
      return NextResponse.json(
        { error: 'Failed to save landing configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Landing config POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save landing configuration' },
      { status: 500 }
    );
  }
}

