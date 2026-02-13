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
        { success: false, error: 'Only humans can submit completions' },
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

    if (task.human_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Not assigned to this task' },
        { status: 403 }
      );
    }

    if (!['assigned', 'in_progress'].includes(task.status)) {
      return NextResponse.json(
        { success: false, error: 'Task cannot be completed in current state' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { proof_data } = body;

    if (!proof_data) {
      return NextResponse.json(
        { success: false, error: 'Proof data required' },
        { status: 400 }
      );
    }

    const completionId = uuidv4();
    const now = new Date().toISOString();

    // Create completion record
    const { data: completion, error: completionError } = await supabase
      .from('task_completions')
      .insert({
        id: completionId,
        task_id: params.id,
        human_id: user.id,
        proof_data,
        status: 'pending',
        submitted_at: now,
      })
      .select()
      .single();

    if (completionError) {
      throw completionError;
    }

    // Update task status
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'pending_review',
        updated_at: now,
      })
      .eq('id', params.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: completion,
    });
  } catch (error) {
    console.error('Task completion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit completion' },
      { status: 500 }
    );
  }
}
