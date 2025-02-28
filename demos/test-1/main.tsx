import React, { useState } from 'react'
import ReactDOM from 'react-dom/client';
// import './index.css'
// import App from '../src/App.jsx'

const jsx = (
	<div>
		<span>hello my-react</span>
	</div>
);

function App() {
	const [count, setCount] = useState(1210);
	return (
		<div onClick={() => {
			setCount(count => count + 1)
			setCount(count => count + 1)
			setCount(count => count + 1)
		}}>
			{count}
		</div>
	);
}


const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
// root.render(jsx);
root.render(<App />);
// window.root = root;