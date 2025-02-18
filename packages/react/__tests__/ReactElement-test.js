'use strict';

let React;
let ReactDOM;
let ReactTestUtils;

describe('ReactElement', () => {
	let ComponentFC;
	let originalSymbol;

	beforeEach(() => {
		jest.resetModules();

		// Delete the native Symbol if we have one to ensure we test the
		// unpolyfilled environment.
		originalSymbol = global.Symbol;
		global.Symbol = undefined;

		React = require('react');
		ReactDOM = require('react-dom');
		ReactTestUtils = require('react-dom/test-utils');
		debugger
		// NOTE: We're explicitly not using JSX here. This is intended to test
		// classic JS without JSX.
		ComponentFC = () => {
			return React.createElement('div');
		};
	});

	afterEach(() => {
		global.Symbol = originalSymbol;
	});

	it('uses the fallback value when in an environment without Symbol', () => {
		expect((<div />).$$typeof).toBe(0xeac7);
	});

	it('returns a complete element according to spec', () => {
		const element = React.createElement(ComponentFC);
		expect(element.type).toBe(ComponentFC);
		expect(element.key).toBe(null);
		expect(element.ref).toBe(null);

		expect(element.props).toEqual({});
	});

	it('allows a string to be passed as the type', () => {
		const element = React.createElement('div');
		expect(element.type).toBe('div');
		expect(element.key).toBe(null);
		expect(element.ref).toBe(null);
		expect(element.props).toEqual({});
	});
});
