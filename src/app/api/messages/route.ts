import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { getUserFromToken, getAgentByApiKey } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'task_id required' },
        { status: 400 }
      );
    }

    // Auth check
    const apiKey = request.headers.get('X-API-Key');
    const authHeader = request.headers.get('Authorization');
    let userId: string;

    if (apiKey) {
      const agent = await getAgentByApiKey(apiKey);
      if (!agent) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key' },
          { status: 401 }
        );
      }
      userId = agent.user.id;
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
    } else {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is part of this task
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!task || (task.agent_id !== userId && task.human_id !== userId)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to view these messages' },
        { status: 403 }
      );
    }

    // Get messages with sender info
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Enrich messages with sender info
    const enrichedMessages = await Promise.all(
      (messages || []).map(async (m: any) => {
        const { data: user } = await supabase
          .from('users')
          .select('id, type')
          .eq('id', m.sender_id)
          .single();

        let senderName = 'Unknown';
        let senderType = user?.type || 'unknown';

        if (user?.type === 'agent') {
          const { data: agentProfile } = await supabase
            .from('agent_profiles')
            .select('name')
            .eq('user_id', user.id)
            .single();
          senderName = agentProfile?.name || 'Agent';
        } else if (user?.type === 'human') {
          const { data: humanProfile } = await supabase
            .from('human_profiles')
            .select('display_name')
            .eq('user_id', user.id)
            .single();
          senderName = humanProfile?.display_name || 'Human';
        }

        return {
          ...m,
          sender_name: senderName,
          sender_type: senderType,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedMessages,
    });
  } catch (error) {
    console.error('Messages list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key');
    const authHeader = request.headers.get('Authorization');
    let userId: string;

    if (apiKey) {
      const agent = await getAgentByApiKey(apiKey);
      if (!agent) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key' },
          { status: 401 }
        );
      }
      userId = agent.user.id;
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
    } else {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { task_id, content, attachments } = body;

    if (!task_id || !content) {
      return NextResponse.json(
        { success: false, error: 'task_id and content required' },
        { status: 400 }
      );
    }

    // Verify user is part of this task
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', task_id)
      .single();

    if (!task || (task.agent_id !== userId && task.human_id !== userId)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to message in this task' },
        { status: 403 }
      );
    }

    const messageId = uuidv4();
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        id: messageId,
        task_id,
        sender_id: userId,
        content,
        attachments: attachments || [],
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Message send error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
