export type Container = Element| Document | DocumentFragment;;
export type Instance = Element;

// 模拟实现构建 DOM 的函数
// 真实函数要在不同的宿主环境中实现
export const createInstance = (type: string, props: any): Instance => {
	// TODO 处理props
	const element = document.createElement(type);
	return element
};

export const appendInitialChild = (parent: Container | Instance, child: Instance) => {
	parent.appendChild(child);
};

export const createTextInstance = (content: string) => {
	const element = document.createTextNode(content);
	return element;
};

export const appendChildToContainer = (child: Instance, parent: Container | Instance) => {
	parent.appendChild(child);
};