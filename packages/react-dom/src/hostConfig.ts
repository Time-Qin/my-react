import { FiberNode } from "react-reconciler/src/fiber";
import { HostComponent, HostText } from "react-reconciler/src/workTags";
import { DOMElement, updateFiberProps } from "./SyntheticEvent";

export type Container = Element | Document | DocumentFragment;;
export type Instance = Element;
export type TextInstance = Text;

// 模拟实现构建 DOM 的函数
// 真实函数要在不同的宿主环境中实现
export const createInstance = (type: string, props: any): Instance => {
	// TODO 处理props
	const element = document.createElement(type) as unknown;
	updateFiberProps(element as DOMElement,props)
	return element as DOMElement
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

export const commitUpdate = (fiber: FiberNode) => {
	switch (fiber.flags) {
		case HostComponent:
			updateFiberProps(fiber.stateNode,fiber.memoizedProps);
			break;
		case HostText:
			const text = fiber.memoizedProps.content
			commitTextUpdate(fiber.stateNode, text)
			break;
		default:
			if (__DEV__) {
				console.warn('未实现的 commitUpdate 类型', fiber);
			}
	}
}
export const commitTextUpdate = (textInstance: TextInstance, content: string) => {
	textInstance.textContent = content
}

export const removeChild = (child: Instance | TextInstance, container: Container) => {
	container.removeChild(child)
}