// Todo Application Frontend JavaScript

class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.init();
    }

    async init() {
        await this.loadTodos();
        this.setupEventListeners();
        this.renderTodos();
    }

    setupEventListeners() {
        // Form submission for adding new todos
        const todoForm = document.getElementById('todo-form');
        todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Clear buttons
        document.getElementById('clear-completed').addEventListener('click', () => {
            this.clearCompleted();
        });

        document.getElementById('clear-all').addEventListener('click', () => {
            this.clearAll();
        });
    }

    async addTodo() {
        const input = document.getElementById('todo-input');
        const text = input.value.trim();
        
        if (text === '') return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/todos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });

            if (response.ok) {
                const newTodo = await response.json();
                this.todos.push(newTodo);
                this.renderTodos();
                
                // Clear input
                input.value = '';
                input.focus();
            } else {
                console.error('Failed to add todo');
            }
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    }

    async toggleTodo(id) {
        try {
            const todo = this.todos.find(todo => todo.id === id);
            if (!todo) return;

            const response = await fetch(`${this.apiBaseUrl}/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed: !todo.completed })
            });

            if (response.ok) {
                const updatedTodo = await response.json();
                const index = this.todos.findIndex(todo => todo.id === id);
                if (index !== -1) {
                    this.todos[index] = updatedTodo;
                    this.renderTodos();
                }
            } else {
                console.error('Failed to update todo');
            }
        } catch (error) {
            console.error('Error updating todo:', error);
        }
    }

    async deleteTodo(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/todos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.todos = this.todos.filter(todo => todo.id !== id);
                this.renderTodos();
            } else {
                console.error('Failed to delete todo');
            }
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTodos();
    }

    async clearCompleted() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/todos/completed`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.todos = this.todos.filter(todo => !todo.completed);
                this.renderTodos();
            } else {
                console.error('Failed to clear completed todos');
            }
        } catch (error) {
            console.error('Error clearing completed todos:', error);
        }
    }

    async clearAll() {
        if (confirm('Are you sure you want to delete all tasks?')) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/todos/all`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    this.todos = [];
                    this.renderTodos();
                } else {
                    console.error('Failed to clear all todos');
                }
            } catch (error) {
                console.error('Error clearing all todos:', error);
            }
        }
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            case 'incomplete':
                return this.todos.filter(todo => !todo.completed);
            default:
                return this.todos;
        }
    }

    renderTodos() {
        const todoList = document.getElementById('todo-list');
        const filteredTodos = this.getFilteredTodos();
        
        todoList.innerHTML = '';
        
        filteredTodos.forEach(todo => {
            const li = this.createTodoElement(todo);
            todoList.appendChild(li);
        });
    }

    createTodoElement(todo) {
        const li = document.createElement('li');
        if (todo.completed) {
            li.classList.add('completed');
        }

        li.innerHTML = `
            <span class="todo-text">${this.escapeHtml(todo.text)}</span>
            <div class="todo-actions">
                <button class="btn complete-btn" data-id="${todo.id}">
                    ${todo.completed ? 'Undo' : 'Complete'}
                </button>
                <button class="btn delete-btn" data-id="${todo.id}">Delete</button>
            </div>
        `;

        // Add event listeners to buttons
        const completeBtn = li.querySelector('.complete-btn');
        const deleteBtn = li.querySelector('.delete-btn');

        completeBtn.addEventListener('click', () => {
            this.toggleTodo(todo.id);
        });

        deleteBtn.addEventListener('click', () => {
            this.deleteTodo(todo.id);
        });

        return li;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async loadTodos() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/todos`);
            if (response.ok) {
                this.todos = await response.json();
            } else {
                console.error('Failed to load todos');
                this.todos = [];
            }
        } catch (error) {
            console.error('Error loading todos:', error);
            this.todos = [];
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
}); 