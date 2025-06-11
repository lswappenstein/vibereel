import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();

  try {
    // Test authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Auth error: ' + authError.message 
      }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active session' 
      }, { status: 401 });
    }

    // Test collections table access
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('*')
      .limit(1);

    if (collectionsError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Collections error: ' + collectionsError.message,
        code: collectionsError.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: session.user,
      collections: collections || []
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 