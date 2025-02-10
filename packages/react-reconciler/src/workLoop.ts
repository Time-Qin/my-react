import { FiberNode } from './fiber';

let workInProgress:FiberNode | null = null;

function renderRoot(root:FiberNode){
    prepareFreshStack(root);
    do{
        try {
            workLoop();
            break;
        } catch (error) {
            console.warn('workLoop发生错误',error);
            workInProgress = null;
        }
    }while(true)
}

// 初始化 workInProgress 变量
function prepareFreshStack(root:FiberNode){
    workInProgress = root; 
}

//深度优先遍历，向下递归子节点
function workLoop(){
    while(workInProgress!==null){
        performUnitOfWork(workInProgress);
    }
}


function performUnitOfWork(fiber:FiberNode){
    // 比较并返回子fiberNode
    const next = beginWork(fiber);
    fiber.memoizedProps = fiber.pendingProps;
    if(next==null){
        // 没有子节点 则向上返回
        completeUnitOfWork(fiber); 
    }else{
        // 有子节点 则向下深度遍历
        workInProgress = next;
    }
}


// 深度优先遍历，向下递归子节点
function completeUnitOfWork(fiber:FiberNode){
    let node:FiberNode | null = fiber;
    do{
        //生成更新计划
        completeWork(node);
        // 有兄弟节点 则遍历兄弟节点
        const sibling = node.sibling;
        if(sibling!==null){
            workInProgress = sibling;
            return;
        }
        // 否则 向上返回遍历父节点
        node = node.return;
        workInProgress = node;
    }while(node !== null)
}