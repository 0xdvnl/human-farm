import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { getUserFromToken, getAgentByApiKey } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Get agent profile
    const { data: agent } = await supabase
      .from('agent_profiles')
      .select('*')
      .eq('user_id', task.agent_id)
      .single();

    // Get human profile if assigned
    let human = null;
    if (task.human_id) {
      const { data: humanData } = await supabase
        .from('human_profiles')
        .select('*')
        .eq('user_id', task.human_id)
        .single();
      human = humanData;
    }

    // Get applications with human profiles
    const { data: applications } = await supabase
      .from('task_applications')
      .select('*, human_profiles!inner(display_name, hourly_rate_usd, avg_rating)')
      .eq('task_id', params.id)
      .order('created_at', { ascending: false });

    const formattedApplications = (applications || []).map((app: any) => ({
      ...app,
      display_name: app.human_profiles?.display_name,
      hourly_rate_usd: app.human_profiles?.hourly_rate_usd,
      avg_rating: app.human_profiles?.avg_rating,
      human_profiles: undefined,
    }));

    // Get messages count
    const { count: messagesCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('task_id', params.id);

    // Get completion if exists
    const { data: completions } = await supabase
      .from('task_completions')
      .select('*')
      .eq('task_id', params.id)
      .order('submitted_at', { ascending: false })
      .limit(1);

    const completion = completions?.[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        ...task,
        agent_name: agent?.name,
        agent_user_id: agent?.user_id,
        human_name: human?.display_name,
        human_user_id: human?.user_id,
        human_rate: human?.hourly_rate_usd,
        human_rating: human?.avg_rating,
        applications: formattedApplications,
        messages_count: messagesCount || 0,
        completion,
      },
    });
  } catch (error) {
    console.error('Task detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const apiKey = request.headers.get('X-API-Key');
    const authHeader = request.headers.get('Authorization');

    let userId: string;
    let userType: 'human' | 'agent';

    if (apiKey) {
      const agent = await getAgentByApiKey(apiKey);
      if (!agent) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key' },
          { status: 401 }
        );
      }
      userId = agent.user.id;
      userType = 'agent';
    } else if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const user = await getUserFromToken(token);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = user.id;
      userType = user.type;
    } else {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
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

    const body = await request.json();
    const { action, human_id, rating, review } = body;

    let updates: any = { updated_at: new Date().toISOString() };

    switch (action) {
      case 'assign':
        if (task.agent_id !== userId) {
          return NextResponse.json(
            { success: false, error: 'Not authorized' },
            { status: 403 }
          );
        }
        if (task.status !== 'open') {
          return NextResponse.json(
            { success: false, error: 'Task is not open' },
            { status: 400 }
          );
        }

        updates.human_id = human_id;
        updates.status = 'assigned';
        updates.assigned_at = new Date().toISOString();

        // Update application statuses
        await supabase
          .from('task_applications')
          .update({ status: 'rejected' })
          .eq('task_id', params.id)
          .neq('human_id', human_id);

        await supabase
          .from('task_applications')
          .update({ status: 'accepted' })
          .eq('task_id', params.id)
          .eq('human_id', human_id);
        break;

      case 'start':
        if (task.human_id !== userId) {
          return NextResponse.json(
            { success: false, error: 'Not authorized' },
            { status: 403 }
          );
        }
        if (task.status !== 'assigned') {
          return NextResponse.json(
            { success: false, error: 'Task is not assigned' },
            { status: 400 }
          );
        }

        updates.status = 'in_progress';
        break;

      case 'complete':
        if (task.agent_id !== userId) {
          return NextResponse.json(
            { success: false, error: 'Not authorized' },
            { status: 403 }
          );
        }
        if (task.status !== 'pending_review') {
          return NextResponse.json(
            { success: false, error: 'Task is not pending review' },
            { status: 400 }
          );
        }

        updates.status = 'completed';
        updates.completed_at = new Date().toISOString();

        // Update task completion status
        await supabase
          .from('task_completions')
          .update({ status: 'approved' })
          .eq('task_id', params.id);

        // Update human stats
        await supabase.rpc('increment_human_tasks', { user_id_param: task.human_id });

        // Create review if provided
        if (rating) {
          await supabase.from('reviews').insert({
            id: uuidv4(),
            task_id: params.id,
            reviewer_id: userId,
            reviewee_id: task.human_id,
            rating,
            content: review || null,
          });
        }
        break;

      case 'cancel':
        if (task.agent_id !== userId) {
          return NextResponse.json(
            { success: false, error: 'Not authorized' },
            { status: 403 }
          );
        }
        if (!['open', 'assigned'].includes(task.status)) {
          return NextResponse.json(
            { success: false, error: 'Task cannot be cancelled' },
            { status: 400 }
          );
        }

        updates.status = 'cancelled';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
