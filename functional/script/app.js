import '../style.scss'
import MyReact from './my-react'

/** @jsx MyReact.createElement */
function TodoList() {
    const [todos, setTodos] = MyReact.useState([
        { id: 1, text: 'Buy milk', completed: false },
        { id: 2, text: 'Walk the dog', completed: true },
        { id: 3, text: 'Learn React', completed: false }
    ])
    const [newTodo, setNewTodo] = MyReact.useState('')
    const [nextId, setNextId] = MyReact.useState(4)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (newTodo.trim() !== '') {
            setTodos((prevTodos) => [...prevTodos, { id: nextId, text: newTodo, completed: false }])
            setNewTodo('')
            setNextId(nextId + 1)
        }
    }

    const handleToggleCompleted = (id) => {
        setTodos((prevTodos) =>
            prevTodos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
        )
    }

    const handleDeleteTodo = (id) => {
        setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id))
    }

    return (
        <section>
            <h1 className='title'>Todo List</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type='text'
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder='Add new todo'
                />
                <button type='submit'>Add</button>
            </form>
            <ul className='list'>
                {todos.map((todo) => (
                    <li key={todo.id} className='todo-item'>
                        <input
                            type='checkbox'
                            checked={todo.completed}
                            onChange={() => handleToggleCompleted(todo.id)}
                        />
                        <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                            {todo.text}
                        </span>
                        <button className='delete-button' onClick={() => handleDeleteTodo(todo.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </section>
    )
}

MyReact.render(<TodoList />, document.getElementById('app'))