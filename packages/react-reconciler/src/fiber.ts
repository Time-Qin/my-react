import { Props, Key, Ref } from 'shared/ReactTypes';
import { WorkTag } from './workTags';
import { NoFlags, Flags } from './fiberFlags';

export class FiberNode {
    tag:WorkTag;
    key:Key;
    stateNode:any;
    type:any;
    return: FiberNode | null;
    sibling: FiberNode | null;
    child: FiberNode | null;
    index:number;
    ref:Ref;
    pendingProps:Props;
    memoizedProps:Props | null;
    memoizedState:any
    alternate:FiberNode | null;
    flags:Flags;
    subTreeFlags:Flags;
    updateQueue:unknown;
    


    constructor(tag:WorkTag,pendingProps:Props,key:Key){
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

    }
}