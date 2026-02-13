import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { getUserFromToken, getAgentByApiKey } from '@/lib/auth';

const PLATFORM_FEE_RATE = 0.05; // 5%

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const agentId = searchParams.get('agent_id');
    const humanId = searchParams.get('human_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase.from('tasks').select('*');

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }
    if (humanId) {
      query = query.eq('human_id', humanId);
    }

    // Get total count
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    // Get tasks with pagination
    const { data: tasks, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get related agent and human data
    const tasksWithDetails = await Promise.all(
      (tasks || []).map(async (task: any) => {
        const { data: agent } = await supabase
          .from('agent_profiles')
          .select('name')
          .eq('user_id', task.agent_id)
          .single();

        let human = null;
        if (task.human_id) {
          const { data: humanData } = await supabase
            .from('human_profiles')
            .select('display_name')
            .eq('user_id', task.human_id)
            .single();
          human = humanData;
        }

        const { count: applicationsCount } = await supabase
          .from('task_applications')
          .select('*', { count: 'exact', head: true })
          .eq('task_id', task.id);

        return {
          ...task,
          agent_name: agent?.name,
          human_name: human?.display_name,
          applications_count: applicationsCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: { tasks: tasksWithDetails, total: count || 0, limit, offset },
    });
  } catch (error) {
    console.error('Tasks list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key (agent) or JWT token (web)
    const apiKey = request.headers.get('X-API-Key');
    const authHeader = request.headers.get('Authorization');

    let agentId: string;

    if (apiKey) {
      const agent = await getAgentByApiKey(apiKey);
      if (!agent) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key' },
          { status: 401 }
        );
      }
      agentId = agent.user.id;
    } else if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const user = await getUserFromToken(token);
      if (!user || user.type !== 'agent') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      agentId = user.id;
    } else {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      budget_usd,
      deadline,
      location_required,
      location_lat,
      location_lng,
      location_address,
      proof_requirements,
    } = body;

    if (!title || !description || !category || !budget_usd || !deadline) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const taskId = uuidv4();
    const platformFee = budget_usd * PLATFORM_FEE_RATE;

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        id: taskId,
        agent_id: agentId,
        title,
        description,
        category,
        status: 'open',
        budget_usd,
        platform_fee_usd: platformFee,
        deadline,
        location_required: location_required || false,
        location_lat: location_lat || null,
        location_lng: location_lng || null,
        location_address: location_address || null,
        proof_requirements: proof_requirements || [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
