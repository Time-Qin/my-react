import { Dispatch, Dispatcher } from "react/src/currentDispatcher";
import { FiberNode } from "./fiber";
import internals from "shared/internals";
import { createUpdate, createUpdateQueue, enqueueUpdate, processUpdateQueue, UpdateQueue } from "./updateQueue";
import { Action } from "shared/ReactTypes";
import { scheduleUpdateOnFiber } from "./workLoop";

// 定义 Hook 数据结构
export interface Hook {
    memoizedState: any// 保存 Hook 的数据
    queue: any
    next: Hook | null
}

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

const { currentDispatcher } = internals

// 执行组件中的函数
export default function renderWithHooks(workInProgress: FiberNode) {
    //赋值
    currentlyRenderingFiber = workInProgress;
    workInProgress.memoizedState = null;

    //判断Hooks 被调用的时机
    const current = workInProgress.alternate
    if (current !== null) {
        // 组件的更新阶段(update)
        currentDispatcher.current = HooksDispatcherOnUpdate;
    } else {
        // 首屏渲染阶段(mount)
        currentDispatcher.current = HooksDispatcherOnMount;
    }


    // 函数保存在 type 字段中
    const Component = workInProgress.type;
    const props = workInProgress.pendingProps;
    const child = Component(props);

    // 重置
    currentlyRenderingFiber = null;
    workInProgressHook = null;

    return child;
}

const HooksDispatcherOnMount: Dispatcher = {
    useState: mountState
};

const HooksDispatcherOnUpdate: Dispatcher = {
    useState: updateState
};

function mountState<State>(initialState: (() => State) | State): [State, Dispatch<State>] {
    // 当前正在工作的 useState
    const hook = mountWorkInProgressHook();

    //当前useState对应的hook数据
    let memoizedState;
    if (initialState instanceof Function) {
        memoizedState = initialState();
    } else {
        memoizedState = initialState;
    }
    hook.memoizedState = memoizedState;

    const queue = createUpdateQueue<State>();
    hook.queue = queue;
    // @ts-ignore
    //实现dispatch
    const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber!, queue);
    queue.dispatch = dispatch;

    return [memoizedState, dispatch];
}

function updateState<State>(initialState: (() => State) | State): [State, Dispatch<State>] {
    if (__DEV__) {
        console.log('updateState 开始');
    }
    // 当前正在工作的 useState
    const hook = updateWorkInProgressHook();

    // 计算新 state 的逻辑
    const queue = hook.queue as UpdateQueue<State>;
    const pending = queue.shared.pending

    if (pending !== null) {
        const { memoizedState } = processUpdateQueue(hook.memoizedState, pending)
        hook.memoizedState = memoizedState;
    }
    return [hook.memoizedState, queue.dispatch as Dispatch<State>]
}

function updateWorkInProgressHook(): Hook {
    // TODO render 阶段触发的更新
    // 保存链表中的下一个 Hook
    let nextCurrentHook: Hook | null
    if (currentHook === null) {
        // 这是函数组件 update 时的第一个 hook
        const current = (currentlyRenderingFiber as FiberNode).alternate;
        if (current === null) {
            nextCurrentHook = null;
        } else {
            nextCurrentHook = current.memoizedState;
        }
    } else {
        // 这是函数组件 update 时后续的 hook
        nextCurrentHook = currentHook.next
    }

    if (nextCurrentHook == null) {
        throw new Error(
            `组件 ${currentlyRenderingFiber?.type} 本次执行时的 Hooks 比上次执行多`
        );
    }

    currentHook = nextCurrentHook as Hook
    const newHook: Hook = {
        memoizedState: currentHook.memoizedState,
        queue: currentHook.queue,
        next: null,
    }
    if (workInProgressHook == null) {
        // update 时的第一个hook
        if (currentlyRenderingFiber !== null) {
            workInProgressHook = newHook;
            currentlyRenderingFiber.memoizedState = workInProgressHook
        } else {
            // currentlyRenderingFiber == null 代表 Hook 执行的上下文不是一个函数组件
            throw new Error('Hooks 只能在函数组件中执行');
        }

    } else {
        // update 时的其他 hook
        // 将当前处理的 Hook.next 指向新建的 hook，形成 Hooks 链表
        workInProgressHook.next = newHook
        // 更新当前处理的 Hook
        workInProgressHook = newHook
    }
    return workInProgressHook
}

// 用于触发状态更新的逻辑
function dispatchSetState<State>(fiber: FiberNode, updateQueue: UpdateQueue<State>, queue: Action<State>) {
    const update = createUpdate(queue);
    enqueueUpdate(updateQueue, update);
    // 调度更新
    scheduleUpdateOnFiber(fiber)
}


// 获取当前正在工作的hook
function mountWorkInProgressHook(): Hook {
    const hook: Hook = {
        memoizedState: null,
        queue: null,
        next: null
    }
    if (workInProgressHook == null) {
        //mount 时 第一个hook
        if (currentlyRenderingFiber !== null) {
            workInProgressHook = hook;
            currentlyRenderingFiber.memoizedState = workInProgressHook
        } else {
            // currentlyRenderingFiber == null 代表 Hook 执行的上下文不是一个函数组件
            throw new Error("Hooks 只能在函数组件中执行")
        }
    } else {
        // mount 时的其他 hook
        // 将当前工作的 Hook 的 next 指向新建的 hook，形成 Hooks 链表
        workInProgressHook.next = hook;
        // 更新当前工作的 Hook
        workInProgressHook = hook
    }
    return workInProgressHook
}