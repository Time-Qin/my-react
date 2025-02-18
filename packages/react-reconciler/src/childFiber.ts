import { Props, ReactElementType } from 'shared/ReactTypes';
import { FiberNode, createFiberFromElement, createWorkInProgress } from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';

function ChildReconciler(shouldTrackSideEffects: boolean) {
    // 处理单个 Element 节点的情况
    // 对比 currentFiber 与 ReactElement，生成 workInProgress FiberNode
    function reconcilerSingleElement(returnFiber: FiberNode, currentFiber: FiberNode | null, element: ReactElementType) {
        //组件更新阶段
        if (currentFiber !== null) {
            if (currentFiber.key == element.key) {
                if (element.$$typeof === REACT_ELEMENT_TYPE) {
                    if (currentFiber.type === element.type) {
                        // key 和 type 都相同，复用旧的 Fiber 节点
                        const existing = useFiber(currentFiber, element.props)
                        existing.return = currentFiber
                        return existing
                    }
                    // key 相同，但 type 不同，删除旧的 Fiber 节点
                    deleteChild(returnFiber, currentFiber)
                } else {
                    if (__DEV__) {
                        console.warn('还未实现的 React 类型', element);
                    }
                }
            } else {
                // key 相同，但 type 不同，删除旧的 Fiber 节点
                deleteChild(returnFiber, currentFiber)
            }
        }
        // 创建新的 Fiber 节点
        const fiber = createFiberFromElement(element)
        fiber.return = returnFiber
        return fiber
    }


    // 处理文本节点的情况
    // 对比 currentFiber 与 ReactElement，生成 workInProgress FiberNode
    function reconcilerSingleTextNode(returnFiber: FiberNode, currentFiber: FiberNode | null, content: string | number) {
        if (currentFiber !== null) {
            // 组件的更新阶段
            if (currentFiber.tag === HostText) {
                // 复用旧的 Fiber 节点
                const existing = useFiber(currentFiber, { content })
                existing.return = currentFiber
                return existing
            } else {
                // 删除旧的 Fiber 节点
                deleteChild(returnFiber, currentFiber)
            }
        }
        // 创建新的 Fiber 节点
        const fiber = new FiberNode(HostText, { content }, null)
        fiber.return = returnFiber
        return fiber
    }

    // 复用 Fiber 节点
    function useFiber(fiber: FiberNode, pendingProps: Props) {
        const clone = createWorkInProgress(fiber, pendingProps)
        clone.index = 0;
        clone.sibling = null;
        return clone
    }

    // 从父节点中删除指定的子节点
    function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
        if (!shouldTrackSideEffects) {
            return
        }
        const deletions = returnFiber.deletions
        if (deletions == null) {
            returnFiber.deletions = [childToDelete]
            returnFiber.flags |= ChildDeletion
        } else {
            deletions.push(childToDelete)
        }

    }

    // 为 Fiber 节点添加更新 flags
    function placeSingleChild(fiber: FiberNode) {
        if (shouldTrackSideEffects && fiber.alternate === null) {
            fiber.flags |= Placement;
        }
        return fiber;
    }

    // 闭包，根据 shouldTrackSideEffects 返回不同 reconcileChildFibers 的实现
    return function reconcileChildFibers(
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        newChild?: ReactElementType
    ) {
        // 判断当前 fiber 的类型
        // 单个 Element 节点
        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    return placeSingleChild(
                        reconcilerSingleElement(
                            returnFiber,
                            currentFiber,
                            newChild
                        )
                    );
                default:
                    if (__DEV__) {
                        console.warn('未实现的reconcile类型', newChild);
                    };
                    break;
            }
        }

        // 多个 Element 节点
        if (Array.isArray(newChild)) {
            // TODO: 暂时不处理
            if (__DEV__) {
                console.warn('未实现的 reconcile 类型', newChild);
            }
            // return reconcileChildrenArray(
            //     returnFiber,
            //     currentFiber,
            //     newChild
            // );
        }

        // 文本节点
        if (typeof newChild === 'string' || typeof newChild === 'number') {
            return placeSingleChild(reconcilerSingleTextNode(returnFiber, currentFiber, newChild));
        }

        if (__DEV__) {
            console.warn('未实现的 reconcile 类型', newChild);
        }
        return null;
    }
}
// 组件的更新阶段中，追踪副作用
export const reconcileChildFibers = ChildReconciler(true);
// 首屏渲染阶段中不追踪副作用，只对根节点执行一次 DOM 插入操作
export const mountChildFibers = ChildReconciler(false);