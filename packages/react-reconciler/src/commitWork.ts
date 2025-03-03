import { Container, Instance, appendChildToContainer, appendInitialChild, commitUpdate, insertChildToContainer, removeChild } from 'react-dom/src/hostConfig';
import { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber';
import {
    ChildDeletion,
    MutationMask,
    NoFlags,
    PassiveEffect,
    Placement,
    Update
} from './fiberFlags';
import { FunctionComponent, HostComponent, HostRoot, HostText } from './workTags';
import { UpdateQueue } from './updateQueue';
import { Effect, FCUpdateQueue } from './fiberHooks';
import { EffectTag } from './hookEffectTag';

let nextEffect: FiberNode | null = null;

export function commitMutationEffects(finishedWork: FiberNode, root: FiberRootNode) {
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
                commitMutationEffectsOnFiber(nextEffect, root);
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

function commitMutationEffectsOnFiber(finishedWork: FiberNode, root: FiberRootNode) {
    const flags = finishedWork.flags;
    if ((flags & Placement) !== NoFlags) {
        commitPlacement(finishedWork);
        finishedWork.flags &= ~Placement;
    }
    if ((flags & PassiveEffect) !== NoFlags) {
        // TODO PassiveEffect
        commitPassiveEffect(finishedWork, root, 'update')
        finishedWork.flags &= ~PassiveEffect;
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
                commitDeteion(childToDelete, root)
            })
        }
        finishedWork.flags &= ~ChildDeletion;
    }
}

// 执行 DOM 插入操作，将 FiberNode 对应的 DOM 插入 parent DOM 中 或移动 FiberNode 对应的 DOM
function commitPlacement(finishedWork: FiberNode) {
    if (__DEV__) {
        console.warn('执行Placement操作', finishedWork);
    }
    // parent DOM
    const hostParent = getHostParent(finishedWork) as Container;
    // Host sibling
    const sibling = getHostSibling(finishedWork);
    appendPlacementNodeIntoContainer(finishedWork, hostParent, sibling);
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

function appendPlacementNodeIntoContainer(finishedWork: FiberNode, hostParent: Container, before?: Instance) {
    if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
        if (before) {
            // 执行移动操作
            insertChildToContainer(finishedWork.stateNode, hostParent, before);
        } else {
            //  执行插入操作
            appendChildToContainer(finishedWork.stateNode, hostParent);
        }
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
function commitDeteion(childToDelete: FiberNode, root: FiberRootNode) {
    if (__DEV__) {
        console.log('执行 Deletion 操作', childToDelete);
    }
    // 子树的根节点
    let rootChildrenToDelete: FiberNode[] = []

    commitNestedUnmounts(childToDelete, (unmountFiber) => {
        switch (unmountFiber.flags) {
            case HostComponent:
                recordChildrenToDelete(rootChildrenToDelete, unmountFiber);
                //TODO 解绑ref
                return;
            case HostText:
                recordChildrenToDelete(rootChildrenToDelete, unmountFiber);
                return;
            case FunctionComponent:
                commitPassiveEffect(unmountFiber, root, 'unmount');
                return;
            default:
                if (__DEV__) {
                    console.warn('未实现的 delete 类型', unmountFiber);
                }
        }
    });

    // 移除rootHostNode 的DOM
    if (rootChildrenToDelete.length !== 0) {
        // 找到待删除子树的根节点的 parent DOM
        const hostParent = getHostParent(childToDelete) as Container
        rootChildrenToDelete.forEach((node) => {
            removeChild(node.stateNode, hostParent)
        });
    }
    childToDelete.return = null
    childToDelete.child = null
}

function commitPassiveEffect(fiber: FiberNode, root: FiberRootNode, type: keyof PendingPassiveEffects) {
    if (fiber.tag !== FunctionComponent || (type === 'update' && fiber.flags === NoFlags)) {
        return;
    }
    const updateQueue = fiber.updateQueue as FCUpdateQueue<Effect>
    if (updateQueue !== null) {
        if (updateQueue.lastEffect === null && __DEV__) {
            console.error('当FunctionComponent存在PassiveEffect flags时，不应该不存在updateQueue')
        } else {
            root.pendingPassiveEffects[type].push(updateQueue.lastEffect as Effect)
        }
    }
}

function recordChildrenToDelete(childrenToDelete: FiberNode[], unmountFiber: FiberNode) {
    const lastOne = childrenToDelete[childrenToDelete.length - 1];
    if (!lastOne) {
        childrenToDelete.push(unmountFiber)
    } else {
        let node = lastOne.sibling;
        while (node !== null) {
            if (unmountFiber == node) {
                childrenToDelete.push(unmountFiber)
            }
            node = node.sibling;
        }
    }
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

// 获取兄弟 Host 节点
function getHostSibling(fiber: FiberNode) {
    let node: FiberNode = fiber;
    findSibling: while (true) {
        // 没有兄弟节点时，向上遍历
        while (node.sibling == null) {
            const parent = node.return;
            if (parent == null || parent.tag === HostComponent || parent.tag === HostRoot) {
                return null;
            }
            node = parent;
        }

        // 向下遍历
        node.sibling.return = node.return;
        node = node.sibling;
        while (node.tag !== HostText && node.tag !== HostComponent) {
            // 不稳定的 Host 节点不能作为目标兄弟 Host 节点
            if ((node.flags & Placement) !== NoFlags) {
                continue findSibling;
            }
            if (node.child === null) {
                continue findSibling;
            } else {
                node.child.return = node;
                node = node.child;
            }
        }

        if ((node.flags & Placement) == NoFlags) {
            return node.stateNode;
        }
    }
}

const commitHookEffectList = (tags: EffectTag, lastEffect: Effect, callback: (effect: Effect) => void) => {
    let effect = lastEffect.next as Effect;

    do {
        if ((effect.tag & tags) === tags) {
            callback(effect)
        }
        effect = effect.next as Effect;
    } while (effect !== lastEffect.next)
}

// 组件卸载时，触发所有 unmount destroy
export const commitHookEffectListUnmount = (tags: EffectTag, lastEffect: Effect) => {
    commitHookEffectList(tags, lastEffect, (effect) => {
        const destroy = effect.destroy;
        if (typeof destroy === 'function') {
            destroy();
        }
        effect.tag &= ~tags;
    })
}

// 组件卸载时，触发所有上次更新的 destroy
export const commitHookEffectListDestroy = (tags:EffectTag,lastEffect:Effect)=>{
    commitHookEffectList(tags,lastEffect,(effect)=>{
        const destroy = effect.destroy;
        if(typeof destroy === 'function'){
            destroy();
        }
    })
}

// 组件卸载时，触发所有这次更新的 create
export const commitHookEffectListCreate = (tags:EffectTag,lastEffect:Effect)=>{
    commitHookEffectList(tags,lastEffect,(effect)=>{
        const create = effect.create;
        if(typeof create === 'function'){
            effect.destroy = create();
        }
    })
}