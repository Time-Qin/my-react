import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes';
import { Fragment, FunctionComponent, HostComponent, WorkTag } from './workTags';
import { NoFlags, Flags } from './fiberFlags';
import { Container } from 'hostConfig';
import { Lane, Lanes, NoLane, NoLanes } from './fiberLanes';


export class FiberNode {
    tag: WorkTag;
    key: Key;
    stateNode: any;
    type: any;
    return: FiberNode | null;
    sibling: FiberNode | null;
    child: FiberNode | null;
    index: number;
    ref: Ref;
    pendingProps: Props;
    memoizedProps: Props | null;
    memoizedState: any
    alternate: FiberNode | null;
    flags: Flags;
    subTreeFlags: Flags;
    updateQueue: unknown;
    deletions: FiberNode[] | null;



    constructor(tag: WorkTag, pendingProps: Props, key: Key) {
        // 类型
        this.tag = tag;
        this.key = key;
        this.ref = null;
        this.stateNode = null; // 对应的dom节点或组件实例
        this.type = null; // 节点类型 可以是函数组件 类组件 原生DOM元素

        // 构成树状结构
        this.return = null; // 指向父节点
        this.sibling = null; // 指向节点的下一个兄弟节点
        this.child = null; // 指向节点的第一个子节点
        this.index = 0; // 索引

        // 作为工作单元
        this.pendingProps = pendingProps; // 表示节点的新属性，用于在协调过程中进行更新
        this.memoizedProps = null; // 已经生效的props
        this.memoizedState = null; // 更新完成后已经生效的状态

        this.alternate = null; // 指向节点的备份节点，用于在协调过程中进行比较
        this.flags = NoFlags; // 表示节点的副作用类型，如更新、插入、删除等
        this.subTreeFlags = NoFlags; // 表示子节点的副作用类型，如更新、插入、删除等
        this.updateQueue = null; // 表示节点的更新队列
        this.deletions = null
    }
}

export class FiberRootNode {
    container: Container;
    current: FiberNode;
    finishedWork: FiberNode | null;
    peddingLanes: Lanes;
    finishedLane: Lane;

    constructor(container: Container, hostRootFiber: FiberNode) {
        this.container = container;
        this.current = hostRootFiber;
        // 将根节点的 stateNode 属性指向 FiberRootNode，用于表示整个 React 应用的根节点
        hostRootFiber.stateNode = this;
        // 指向更新完成之后的 hostRootFiber
        this.finishedWork = null;
        this.peddingLanes = NoLanes;
        this.finishedLane = NoLane;
    }
}

// 根据 FiberRootNode.current 创建一个新的 workInProgress 节点
export function createWorkInProgress(current: FiberNode, pendingProps: Props): FiberNode {
    let workInProgress = current.alternate;
    if (workInProgress === null) {
        // mount 首屏渲染时 
        workInProgress = new FiberNode(current.tag, pendingProps, current.key);
        workInProgress.stateNode = current.stateNode

        // 建立双向关联
        workInProgress.alternate = current;
        current.alternate = workInProgress;
    } else {
        // update 更新时
        workInProgress.pendingProps = pendingProps;
        // 将 effect 链表重置为空，以便在更新过程中记录新的副作用
        workInProgress.flags = NoFlags;
        workInProgress.subTreeFlags = NoFlags;
    }
    // 复制当前节点的大部分属性
    workInProgress.type = current.type;
    workInProgress.updateQueue = current.updateQueue;
    workInProgress.child = current.child;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;

    return workInProgress;
}

// 根据 DOM 节点创建新的 Fiber 节点
export function createFiberFromElement(element: ReactElementType): FiberNode {
    const { type, key, props } = element;
    let fiberTag: WorkTag = FunctionComponent;
    if (typeof type === 'string') {
        // 原生DOM节点
        fiberTag = HostComponent;
    } else if (typeof type !== 'function' && __DEV__) {
        console.warn('未定义的type类型', element);
    }
    const fiber = new FiberNode(fiberTag, props, key);
    fiber.type = type;
    return fiber;
}

export function createFiberFromFragment(elements:any[],key:Key):FiberNode {
    const fiber = new FiberNode(Fragment,elements,key);
    return fiber;
}