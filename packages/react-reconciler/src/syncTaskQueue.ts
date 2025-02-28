// 同步的任务队列
let syncQueue: ((...args: any[]) => void)[] | null = null;
let isFlushingSyncQueue = false;

// 调度同步任务
export function scheduleSyncCallback(callback: (...args: any) => void) {
    if (syncQueue === null) {
        syncQueue = [callback];
    } else {
        syncQueue.push(callback)
    }
}

//遍历执行同步的回调函数
export function flushSyncCallback() {
    if (!isFlushingSyncQueue && syncQueue) {
        isFlushingSyncQueue = true;
        try {
            syncQueue.forEach((callback) => callback());
        } catch (e) {
            if (__DEV__) {
                console.warn('flushSyncCallback发生错误', e)
            }
        } finally {
            isFlushingSyncQueue = false;
            syncQueue = null;
        }
    }
}
