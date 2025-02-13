import { Container, appendChildToContainer, appendInitialChild } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
    ChildDeletion,
    MutationMask,
    NoFlags,
    Placement,
    Update
} from './fiberFlags';
import { HostComponent, HostRoot, HostText } from './workTags';

let nextEffect: FiberNode | null = null;

export function commitMutationEffects(finishedWork: FiberNode) {
    nextEffect = finishedWork;
    //深度优先遍历fiber树 寻找新的flags
    while (nextEffect !== null) {
        const child: FiberNode | null = nextEffect.child;
        if ((nextEffect.subTreeFlags & MutationMask) !== NoFlags && child !== null) {
            // 子节点存在 mutation阶段执行的flags
            nextEffect = child;
        } else {
            // 子节点不存在 mutation 阶段需要执行的 flags 或没有子节点
            // 向上遍历
            up: while (nextEffect !== null) {
                // 处理当前节点的 flags
                commitMutationEffectsOnFiber(nextEffect);
                const sibling: FiberNode | null = nextEffect.sibling;
                if (sibling !== null) {
                    // 有兄弟节点 则遍历兄弟节点
                    nextEffect = sibling;
                    break up;
                }
                // 否则 向上返回遍历父节点
                nextEffect = nextEffect.return;
            }
        }
    }
}

function commitMutationEffectsOnFiber(finishedWork: FiberNode) {
    const flags = finishedWork.flags;
    if ((flags & Placement) !== NoFlags) {
        commitPlacement(finishedWork);
        finishedWork.flags &= ~Placement;
    }

    if ((flags & Update) !== NoFlags) {
        // TODO Update
        finishedWork.flags &= ~Update;
    }

    if ((flags & ChildDeletion) !== NoFlags) {
        // TODO ChildDeletion
        finishedWork.flags &= ~ChildDeletion;
    }
}

// 执行 DOM 插入操作，将 FiberNode 对应的 DOM 插入 parent DOM 中
function commitPlacement(finishedWork: FiberNode) {
    if (__DEV__) {
        console.warn('执行Placement操作', finishedWork);
    }
    const hostParent = getHostParent(finishedWork);
    if (hostParent !== null) {
        appendPlacementNodeIntoContainer(finishedWork, hostParent);
    }
}

function getHostParent(fiber: FiberNode): Container | null {
    let parent = fiber.return;
    while (parent) {
        const parentTag = parent.tag;
        if (parentTag === HostRoot) {
            return (parent.stateNode as FiberRootNode).container;
        }

        if (parentTag === HostComponent) {
            return parent.stateNode as Container;
        } else {
            parent = parent.return;
        }
    }
    if (__DEV__) {
        console.warn('未找到hostParent');
    }
    return null;
}

function appendPlacementNodeIntoContainer(finishedWork: FiberNode, hostParent: Container) {
    if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
        appendChildToContainer(finishedWork.stateNode, hostParent);
    } else {
        const child = finishedWork.child;
        if (child !== null) {
            appendPlacementNodeIntoContainer(child, hostParent);
            let sibling = child.sibling;
            while (sibling !== null) {
                appendPlacementNodeIntoContainer(sibling, hostParent);
                sibling = sibling.sibling;
            }
        }
    }
}