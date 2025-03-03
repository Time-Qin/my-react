import { Action } from 'shared/ReactTypes';
import { Update } from './fiberFlags';
import { Dispatch } from 'react/src/currentDispatcher';
import { Lane } from './fiberLanes';
import { Effect, FCUpdateQueue } from './fiberHooks';

// 定义Update 数据结构
export interface Update<State> {
    action: Action<State>
    next: Update<any> | null
    lane:Lane
}
// 定义UpdateQueue 数据结构
export interface UpdateQueue<State> {
    shared: {
        pending: Update<State> | null
    }
    dispatch: Dispatch<State> | null
}

// 创建Update 实例
export function createUpdate<State>(action: Action<State>,lane:Lane): Update<State> {
    return {
        action,
        next:null,
        lane
    }
}

// 创建UpdateQueue 实例
export function createUpdateQueue<State>(): UpdateQueue<State> {
    return {
        shared: {
            pending: null
        },
        dispatch: null
    }
}

export function createFCUpdateQueue<State>(): FCUpdateQueue<State> {
    const updateQueue = createUpdateQueue<State>() as FCUpdateQueue<State>;
    updateQueue.lastEffect = null;
    return updateQueue;
}

// 将Update 添加到 UpdateQueue 中
export function enqueueUpdate<State>(updateQueue: UpdateQueue<State>, update: Update<State>) {
    const pending = updateQueue.shared.pending;
    if(pending===null){
        update.next = update;
    }else{
        update.next = pending.next;
        pending.next = update;
    }
    // pending 指向 update 环状链表的最后一个节点
    updateQueue.shared.pending = update;
}

// 消费UpdateQueue 中的Update
export function processUpdateQueue<State>(baseState: State, pendingUpdate: Update<State> | null,renderLane:Lane): { memoizedState: State } {
    const result: ReturnType<typeof processUpdateQueue<State>> = {
        memoizedState: baseState
    }
    if (pendingUpdate !== null) {
        // 第一个 update
        let first = pendingUpdate.next;
        let pending = first as Update<any>;
        do{
            const updateLane = pending.lane;
            if(updateLane === renderLane){
                const action = pending.action;
                if (action instanceof Function) {
                    // 若 action 是回调函数：
                    baseState = action(baseState);
                } else {
                    // 若 action 是状态值：
                    baseState = action;
                }

            }else{
                if (__DEV__) {
					console.error('不应该进入 updateLane !== renderLane 逻辑');
				}
            }
            pending = pending.next as Update<any>;
        }while(pending!==first)
    }
    result.memoizedState = baseState;
    return result;

}