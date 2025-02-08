// packages/react/src/jsx.ts
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import {
	Type,
	Ref,
	Key,
	Props,
	ReactElementType,
	ElementType
} from 'shared/ReactTypes';

const ReactElement = function (type: Type, key: Key, ref: Ref, props: Props) {
	const element = {
		$$typeof: REACT_ELEMENT_TYPE,
		key,
		props,
		ref,
		type,
		__mark: 'erxiao'
	};
	return element;
};

export const jsx = (type: ElementType, config: any, ...children: any) => {
	let key: Key = null;
	let ref: Ref = null;
	const props: Props = {};
	for (const prop in config) {
		const val = config[prop];
		if (prop === 'key') {
			if (val !== undefined) {
				key = '' + val;
			}
			continue;
		}

		if (prop === 'ref') {
			if (val !== undefined) {
				ref = val;
			}
			continue;
		}

		if (Object.prototype.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}
	const maybeChildrenLength = children.length;
	if (maybeChildrenLength) {
		if (maybeChildrenLength === 1) {
			props.children = children[0];
		} else {
			props.children = children;
		}
	}

	return ReactElement(type, key, ref, props);
}

export const jsxDEV = (type: ElementType, config: any) => {
	let key: Key = null;
	let ref: Ref = null;
	const props: Props = {};
	for (const prop in config) {
		const val = config[prop];
		if (prop === 'key') {
			if (val !== undefined) {
				key = '' + val;
			}
			continue;
		}
		if (prop === 'ref') {
			if (val !== undefined) {
				ref = val;
			}
			continue;
		}
		if (Object.prototype.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}
	return ReactElement(type, key, ref, props);
}