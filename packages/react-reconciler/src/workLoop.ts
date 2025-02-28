import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import { MutationMask, NoFlags } from './fiberFlags';
import { commitMutationEffects } from './commitWork';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { getHighestPriorityLane, Lane, mergeLanes, NoLane, SynLane } from './fiberLanes';
import { flushSyncCallback, scheduleSyncCallback } from './syncTaskQueue';
import { scheduleMicroTask } from 'hostConfig';

let workInProgress: FiberNode | null = null;
let workInProgressRenderLane: Lane;

function renderRoot(root: FiberRootNode,lane:Lane) {
    const nextLane = getHighestPriorityLane(root.peddingLanes);
    if(nextLane !== SynLane){
        // 其他比 SyncLane 低的优先级或 NoLane，重新调度
        ensureRootIsScheduled(root);
        return;
    }
    // 初始化 workInProgress 变量
    prepareFreshStack(root,lane);
    do {
        try {
            // 深度优先遍历
            workLoop();
            break;
        } catch (error) {
            console.warn('workLoop发生错误', error);
            workInProgress = null;
        }
    } while (true)
    // 创建根 Fiber 树的 Root Fiber
    const finishedWork = root.current.alternate;
    root.finishedWork = finishedWork;
    root.finishedLane = lane;
    workInProgressRenderLane = NoLane;
    // 提交更新
    commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
   const finishedWork = root.finishedWork;
   if (finishedWork === null) {
       return;
   } 
   if (__DEV__) {
       console.warn('开始提交阶段', finishedWork); 
   }
   const lane = root.finishedLane;
   markRootUpdated(root,lane);
   // 重置
   root.finishedWork = null;
   	// 判断是否存在 3 个子阶段需要执行的操作
    const subtreeHasEffect = (finishedWork.subTreeFlags & MutationMask)!== NoFlags;
    const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;
    if(subtreeHasEffect ||rootHasEffect){
        // TODO beforeMutation
        commitMutationEffects(finishedWork);
        // Fiber 树切换，workInProgress 变成 current
        root.current = finishedWork;
        // TODO layout
    }else{
        root.current = finishedWork;
    }

}

// 初始化 workInProgress 变量
function prepareFreshStack(root:FiberRootNode,lane:Lane) {
    workInProgress = createWorkInProgress(root.current,{}); 
    workInProgressRenderLane = lane;
}

//深度优先遍历，向下递归子节点
function workLoop() {
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress);
    }
}


function performUnitOfWork(fiber: FiberNode) {
    // 比较并返回子fiberNode
    const next = beginWork(fiber,workInProgressRenderLane);
    fiber.memoizedProps = fiber.pendingProps;
    if (next == null) {
        // 没有子节点 则向上返回
        completeUnitOfWork(fiber);
    } else {
        // 有子节点 则向下深度遍历
        workInProgress = next;
    }
}


// 深度优先遍历，向下递归子节点
function completeUnitOfWork(fiber: FiberNode) {
    let node: FiberNode | null = fiber;
    do {
        //生成更新计划
        completeWork(node);
        // 有兄弟节点 则遍历兄弟节点
        const sibling = node.sibling;
        if (sibling !== null) {
            workInProgress = sibling;
            return;
        }
        // 否则 向上返回遍历父节点
        node = node.return;
        workInProgress = node;
    } while (node !== null)
}

//调度功能
export function scheduleUpdateOnFiber(fiber: FiberNode,lane:Lane) {
    const root = markUpdateFromFiberToRoot(fiber);
    markRootUpdated(root,lane);
    ensureRootIsScheduled(root);
}

// 从触发更新的节点向上遍历到 FiberRootNode
export function markUpdateFromFiberToRoot(fiber: FiberNode) {
    let node = fiber;
    while (node.return !== null) {
        node = node.return;
    }
    if (node.tag == HostRoot) {
        return node.stateNode;
    }
    return null;
}

// 将更新的优先级(lane)记录到根节点上
export function markRootUpdated(root:FiberRootNode,lane:Lane){
    root.peddingLanes = mergeLanes(root.peddingLanes,lane);
}

// Scheduler 调度功能
function ensureRootIsScheduled(root:FiberRootNode) {
  const updateLane = getHighestPriorityLane(root.peddingLanes);
  if(updateLane == NoLane) return;
  if(updateLane == SynLane){
    // 同步优先级 用微任务调用
    scheduleSyncCallback(renderRoot.bind(null,root,updateLane));
    scheduleMicroTask(flushSyncCallback);
  } else{
    // 其他优先级 用宏任务调用
  }
}