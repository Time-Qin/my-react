import React from 'react'
import ReactDOM from 'react-dom'
// import './index.css'
// import App from '../src/App.jsx'

const jsx = (
	<div>
		<span>hello my-react</span>
	</div>
);

function App() {
	// const [num, update] = useState(100)
	// return (<ul onClick={() => update(50)}>
	// 	{new Array(num).fill(0).map((_, i) => {
	// 		return <Child key={i}>{i}</Child>
	// 	})}
	// </ul>
	// );
  return (
<div>app</div>
  )
}


const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(jsx);
// root.render(<App />);
// window.root = root;