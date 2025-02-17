import { Action } from 'shared/ReactTypes';
import { Update } from './fiberFlags';
import { Dispatch } from 'react/src/currentdispatcher';

// 定义Update 数据结构
export interface Update<State> {
    action: Action<State>
}
// 定义UpdateQueue 数据结构
export interface UpdateQueue<State> {
    shared: {
        pending: Update<State> | null
    }
    dispatch: Dispatch<State> | null
}

// 创建Update 实例
export function createUpdate<State>(action: Action<State>): Update<State> {
    return {
        action
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

// 将Update 插入到UpdateQueue 中
export function enqueueUpdate<State>(updateQueue: UpdateQueue<State>, update: Update<State>) {
    updateQueue.shared.pending = update;
}

// 消费UpdateQueue 中的Update
export function processUpdateQueue<State>(baseState: State, pendingUpdate: Update<State> | null): { memoizedState: State } {
    const result: ReturnType<typeof processUpdateQueue<State>> = {
        memoizedState: baseState
    }
    if (pendingUpdate !== null) {
        const action = pendingUpdate.action;
        if (action instanceof Function) {
            // 若 action 是回调函数：
            result.memoizedState = action(baseState);
        } else {
            // 若 action 是状态值：
            result.memoizedState = action;
        }
    }
    return result;

}