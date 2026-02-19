import { NextResponse } from 'next/server';
import { signOut, getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { trackServerEvent } from '@/lib/posthog';

export async function POST() {
  try {
    const user = await getCurrentUser();

    await signOut();

    const cookieStore = await cookies();
    cookieStore.delete('auth_token');

    if (user) {
      trackServerEvent(user.id, 'user_logged_out', {
        role: user.role,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}

