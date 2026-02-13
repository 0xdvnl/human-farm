import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

function generateApiKey(): string {
  return `hf_${uuidv4().replace(/-/g, '')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agent name is required' },
        { status: 400 }
      );
    }

    const agentId = uuidv4();
    const apiKey = generateApiKey();

    // Create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: agentId,
        type: 'agent',
        email: null,
        password_hash: null,
      });

    if (userError) throw userError;

    // Create agent profile
    const { data: profile, error: profileError } = await supabase
      .from('agent_profiles')
      .insert({
        user_id: agentId,
        name: name.trim(),
        description: description?.trim() || '',
        api_key: apiKey,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return NextResponse.json({
      success: true,
      data: {
        agentId,
        apiKey,
        name: profile.name,
      },
    });
  } catch (error) {
    console.error('Agent registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register agent' },
      { status: 500 }
    );
  }
}
