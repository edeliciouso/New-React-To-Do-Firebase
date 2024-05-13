// import React, { useState } from 'react';
// import { TodoForm } from './TodoForm';
// import { v4 as uuidv4 } from 'uuid';
// import { Todo } from './Todo';
// import { EditTodoForm } from './EditTodoForm';
// import '../App.css';

// export const TodoWrapper = () => {
//   const [todos, setTodos] = useState([]);
//   const [filter, setFilter] = useState('all'); // Step 2

//   const addTodo = (todo) => {
//     const newTodos = [...todos, { id: uuidv4(), task: todo, completed: false, isEditing: false }];
//     setTodos(newTodos);
//     localStorage.setItem('todos', JSON.stringify(newTodos));
//   };

//   const toggleComplete = (id) => {
//     const newTodos = todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));
//     setTodos(newTodos);
//     localStorage.setItem('todos', JSON.stringify(newTodos));
//   };

//   const deleteTodo = (id) => {
//     const newTodos = todos.filter((todo) => todo.id !== id);
//     setTodos(newTodos);
//     localStorage.setItem('todos', JSON.stringify(newTodos));
//   };

//   const editTodo = (id) => {
//     setTodos(todos.map((todo) => (todo.id === id ? { ...todo, isEditing: !todo.isEditing } : todo)));
//   };

//   const editTask = (task, id) => {
//     const newTodos = todos.map((todo) => (todo.id === id ? { ...todo, task, isEditing: !todo.isEditing } : todo));
//     setTodos(newTodos);
//     localStorage.setItem('todos', JSON.stringify(newTodos));
//   };

import React, { useState, useEffect } from 'react';
import { TodoForm } from './TodoForm';
import { Todo } from './Todo';
import { EditTodoForm } from './EditTodoForm';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, getDocs, addDoc } from 'firebase/firestore'; // Import Firestore functions

import { auth } from '../firebase/firebase.js'; // Import Auth instance

export const TodoWrapper = () => {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all'); // Step 2

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in, fetch their todos
        const userTodosRef = collection(getFirestore(), 'users', user.uid, 'todos');
        const querySnapshot = await getDocs(userTodosRef);
        const todosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTodos(todosData);
      } else {
        // No user is signed in, clear todos
        setTodos([]);
      }
    });

    return unsubscribe; // Unsubscribe from auth state changes when component unmounts
  }, []);

  // const addTodo = async (todo) => {
  //   const userTodosRef = collection(getFirestore(), 'users', auth.currentUser.uid, 'todos');
  //   const newTodoRef = doc(userTodosRef);
  //   await setDoc(newTodoRef, { task: todo, completed: false, isEditing: false });
  //   setTodos(prevTodos => [...prevTodos, { id: newTodoRef.id, task: todo, completed: false, isEditing: false }]);
  // };

  const addTodo = async (todo) => {
    try {
      const userTodosRef = collection(getFirestore(), 'users', auth.currentUser.uid, 'todos');
      const newTodoRef = doc(userTodosRef);
      await setDoc(newTodoRef, {
        task: todo, // Use the task input by the user
        completed: false,
        isEditing: false
      });
      setTodos(prevTodos => [...prevTodos, { id: newTodoRef.id, task: todo, completed: false, isEditing: false }]);
    } catch (error) {
      console.error('Error adding todo: ', error);
    }
  };
  

  const toggleComplete = async (id) => {
    const todoRef = doc(collection(getFirestore(), 'users', auth.currentUser.uid, 'todos'), id);
    const todoSnapshot = await getDoc(todoRef);
  
    if (todoSnapshot.exists()) {
      const todoData = todoSnapshot.data();
      const newCompletedStatus = !todoData.completed;
  
      await updateDoc(todoRef, { completed: newCompletedStatus });
  
      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === id ? { ...todo, completed: newCompletedStatus } : todo
        )
      );
    } else {
      console.error("Todo not found.");
    }
  };  

  const deleteTodo = async (id) => {
    const todoRef = doc(collection(getFirestore(), 'users', auth.currentUser.uid, 'todos'), id);
    await deleteDoc(todoRef);
    setTodos(prevTodos =>
      prevTodos.filter(todo => todo.id !== id)
    );
  };

  const editTodo = (id) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, isEditing: true } : todo
      )
    );
  };

  const editTask = async (task, id) => {
    const todoRef = doc(collection(getFirestore(), 'users', auth.currentUser.uid, 'todos'), id);
    await updateDoc(todoRef, { task: task, isEditing: false });
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, task: task, isEditing: false } : todo
      )
    );
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'all') return true;
    if (filter === 'inProgress') return !todo.completed;
    if (filter === 'completed') return todo.completed;
  });

  return (
    <div className="TodoWrapper">
      <h1>To Do List !</h1>
      <TodoForm addTodo={addTodo} />
      <div className="filter-options">
        <button
          className={`filter-option ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-option ${filter === 'inProgress' ? 'active' : ''}`}
          onClick={() => setFilter('inProgress')}
        >
          In Progress
        </button>
        <button
          className={`filter-option ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {/* Render todos based on the filteredTodos array */}
      {filteredTodos.map((todo) =>
        todo.isEditing ? (
          <EditTodoForm key={todo.id} editTodo={editTask} task={todo} />
        ) : (
          <Todo
            key={todo.id}
            task={todo}
            deleteTodo={deleteTodo}
            editTodo={editTodo}
            toggleComplete={toggleComplete}
          />
        )
      )}
    </div>
  );
};
