import { NextResponse } from 'next/server';
import { getCoachBySlug } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const coach = await getCoachBySlug(slug);

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    // Return public coach info only
    return NextResponse.json({
      coach: {
        id: coach.id,
        slug: coach.slug,
        business_name: coach.business_name,
        bio: coach.bio,
        logo_url: coach.logo_url,
        theme_color: coach.theme_color,
        user_monthly_price_cents: coach.user_monthly_price_cents,
        user_yearly_price_cents: coach.user_yearly_price_cents,
        is_active: coach.is_active,
        profile: {
          full_name: coach.profile?.full_name,
          avatar_url: coach.profile?.avatar_url,
        },
      },
    });
  } catch (error) {
    console.error('Get coach error:', error);
    return NextResponse.json(
      { error: 'Failed to get coach info' },
      { status: 500 }
    );
  }
}

