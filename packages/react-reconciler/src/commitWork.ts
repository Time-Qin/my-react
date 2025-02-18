import { Container, appendChildToContainer, appendInitialChild, commitUpdate, removeChild } from 'react-dom/src/hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
    ChildDeletion,
    MutationMask,
    NoFlags,
    Placement,
    Update
} from './fiberFlags';
import { FunctionComponent, HostComponent, HostRoot, HostText } from './workTags';

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
        commitUpdate(finishedWork)
        finishedWork.flags &= ~Update;
    }

    if ((flags & ChildDeletion) !== NoFlags) {
        // TODO ChildDeletion
        const detetions = finishedWork.deletions
        if (detetions !== null) {
            detetions.forEach((childToDelete) => {
                commitDeteion(childToDelete)
            })
        }
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

// 删除节点及其子树
function commitDeteion(childToDelete: FiberNode) {
    if (__DEV__) {
        console.log('执行 Deletion 操作', childToDelete);
    }
    // 子树的根节点
    let rootHostNode: FiberNode | null = null

    commitNestedUnmounts(childToDelete, (unmountFiber) => {
        switch (unmountFiber.flags) {
            case HostComponent:
                if (rootHostNode === null) {
                    rootHostNode = unmountFiber;
                }
                //TODO 解绑ref
                return;
            case HostText:
                if (rootHostNode === null) {
                    rootHostNode = unmountFiber;
                }
                return;
            case FunctionComponent:
                //TODO useEffect unmount
                return;
            default:
                if (__DEV__) {
                    console.warn('未实现的 delete 类型', unmountFiber);
                }
        }
    });

    // 移除rootHostNode 的DOM
    if (rootHostNode !== null) {
        // 找到待删除子树的根节点的 parent DOM
        const hostParent = getHostParent(rootHostNode) as Container
        removeChild((rootHostNode as FiberNode).stateNode, hostParent)
    }
    childToDelete.return = null
    childToDelete.child = null
}

// 深度优先遍历 Fiber 树，执行 onCommitUnmount
const commitNestedUnmounts = (root: FiberNode, onCommitUnmount: (unmountFiber: FiberNode) => void) => {
    let node = root
    while (true) {
        onCommitUnmount(node)

        // 向下遍历，递
        if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
        }
        // 终止条件
        if (node == root) return;
        // 向上遍历，归
        while (node.sibling === null) {
            if (node.return == null || node.return === root) return
            node = node.return;
        }
        node.sibling.child = node.return;
        node = node.sibling;
    }
}
