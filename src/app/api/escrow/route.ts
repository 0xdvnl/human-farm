import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getContractConfig, taskIdToBytes32 } from '@/lib/contracts';

/**
 * Escrow API Endpoints
 */

// GET: Get escrow configuration and task payment status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('task_id');

  // If no task ID, return contract configuration
  if (!taskId) {
    const config = getContractConfig();
    return NextResponse.json({
      success: true,
      data: {
        contract: config.escrowContract,
        chainId: config.chainId,
        chainName: config.chainName,
        explorerUrl: config.explorerUrl,
        tokens: config.tokens,
      },
    });
  }

  // Get task payment status
  try {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error || !task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        task_id: task.id,
        escrow_contract_address: task.escrow_contract_address || null,
        escrow_task_id: task.escrow_task_id || null,
        payment_token: task.payment_token || null,
        payment_amount_wei: task.payment_amount_wei || null,
        payment_chain_id: task.payment_chain_id || null,
        payment_status: task.payment_status || 'pending_deposit',
        deposit_tx_hash: task.deposit_tx_hash || null,
        release_tx_hash: task.release_tx_hash || null,
        bytes32_task_id: taskIdToBytes32(task.id),
      },
    });
  } catch (error) {
    console.error('Error fetching escrow status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Record escrow transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      task_id,
      action, // 'deposit' | 'release' | 'refund'
      tx_hash,
      payment_token,
      payment_amount_wei,
    } = body;

    if (!task_id || !action || !tx_hash) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const config = getContractConfig();
    let updateData: any = {};

    switch (action) {
      case 'deposit':
        updateData = {
          escrow_contract_address: config.escrowContract,
          escrow_task_id: taskIdToBytes32(task_id),
          payment_token: payment_token || 'USDC',
          payment_amount_wei: payment_amount_wei,
          payment_chain_id: config.chainId,
          payment_status: 'escrowed',
          deposit_tx_hash: tx_hash,
        };
        break;

      case 'release':
        updateData = {
          payment_status: 'released',
          release_tx_hash: tx_hash,
          status: 'completed',
          completed_at: new Date().toISOString(),
        };
        break;

      case 'refund':
        updateData = {
          payment_status: 'refunded',
          release_tx_hash: tx_hash,
          status: 'cancelled',
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', task_id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Task not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        task_id,
        action,
        tx_hash,
        payment_status: task.payment_status,
      },
    });
  } catch (error) {
    console.error('Error recording escrow transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
