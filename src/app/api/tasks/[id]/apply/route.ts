import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { getUserFromToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const user = await getUserFromToken(token);

    if (!user || user.type !== 'human') {
      return NextResponse.json(
        { success: false, error: 'Only humans can apply to tasks' },
        { status: 403 }
      );
    }

    // Check if user has verified their email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email_verified')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.email_verified) {
      return NextResponse.json(
        { success: false, error: 'Please verify your email before applying to tasks' },
        { status: 403 }
      );
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', params.id)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    if (task.status !== 'open') {
      return NextResponse.json(
        { success: false, error: 'Task is not open for applications' },
        { status: 400 }
      );
    }

    // Check if already applied
    const { data: existing } = await supabase
      .from('task_applications')
      .select('id')
      .eq('task_id', params.id)
      .eq('human_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already applied to this task' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { message, proposed_rate } = body;

    const applicationId = uuidv4();
    const { data: application, error: insertError } = await supabase
      .from('task_applications')
      .insert({
        id: applicationId,
        task_id: params.id,
        human_id: user.id,
        message: message || null,
        proposed_rate: proposed_rate || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Task application error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to apply to task' },
      { status: 500 }
    );
  }
}
