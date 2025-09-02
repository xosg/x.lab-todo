const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'todos.json');

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

class TodoServer {
    constructor() {
        this.todos = [];
        this.init();
    }

    async init() {
        await this.loadTodos();
        this.createServer();
    }

    async loadTodos() {
        try {
            const data = await fs.readFile(DATA_FILE, 'utf8');
            this.todos = JSON.parse(data);
        } catch (error) {
            // File doesn't exist or is empty, start with empty array
            this.todos = [];
            await this.saveTodos();
        }
    }

    async saveTodos() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(DATA_FILE);
            await fs.mkdir(dataDir, { recursive: true });
            
            await fs.writeFile(DATA_FILE, JSON.stringify(this.todos, null, 2));
        } catch (error) {
            console.error('Error saving todos:', error);
        }
    }

    createServer() {
        const server = http.createServer(async (req, res) => {
            // Handle CORS preflight requests
            if (req.method === 'OPTIONS') {
                res.writeHead(200, corsHeaders);
                res.end();
                return;
            }

            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;

            // Set CORS headers for all responses
            Object.keys(corsHeaders).forEach(key => {
                res.setHeader(key, corsHeaders[key]);
            });

            try {
                // API routes
                if (pathname.startsWith('/api/todos')) {
                    await this.handleTodoRoutes(req, res, pathname);
                } else {
                    // Serve static files
                    await this.serveStaticFiles(req, res, pathname);
                }
            } catch (error) {
                console.error('Server error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });

        server.listen(PORT, () => {
            console.log(`Todo server running on http://localhost:${PORT}`);
            console.log(`Frontend available at http://localhost:${PORT}`);
        });
    }

    async serveStaticFiles(req, res, pathname) {
        // Default to index.html for root path
        let filePath = pathname === '/' ? '/index.html' : pathname;
        
        // Map file extensions to MIME types
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };

        // Construct the full file path
        const fullPath = path.join(__dirname, '..', 'frontend', filePath);
        
        try {
            // Check if file exists
            await fs.access(fullPath);
            
            // Read the file
            const data = await fs.readFile(fullPath);
            
            // Get file extension and MIME type
            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            
            // Set appropriate headers
            res.setHeader('Content-Type', contentType);
            res.writeHead(200);
            res.end(data);
            
        } catch (error) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <html>
                    <head><title>404 Not Found</title></head>
                    <body>
                        <h1>404 - Page Not Found</h1>
                        <p>The requested page could not be found.</p>
                        <a href="/">Go to Todo App</a>
                    </body>
                </html>
            `);
        }
    }

    async handleTodoRoutes(req, res, pathname) {
        const method = req.method;

        // GET /api/todos - Get all todos
        if (method === 'GET' && pathname === '/api/todos') {
            res.writeHead(200);
            res.end(JSON.stringify(this.todos));
            return;
        }

        // POST /api/todos - Add new todo
        if (method === 'POST' && pathname === '/api/todos') {
            const body = await this.getRequestBody(req);
            const { text } = body;

            if (!text || typeof text !== 'string' || text.trim() === '') {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Text is required' }));
                return;
            }

            const newTodo = {
                id: Date.now().toString(),
                text: text.trim(),
                completed: false,
                createdAt: new Date().toISOString()
            };

            this.todos.push(newTodo);
            await this.saveTodos();

            res.writeHead(201);
            res.end(JSON.stringify(newTodo));
            return;
        }

        // DELETE /api/todos/completed - Clear completed todos
        if (method === 'DELETE' && pathname === '/api/todos/completed') {
            const completedCount = this.todos.filter(todo => todo.completed).length;
            this.todos = this.todos.filter(todo => !todo.completed);
            await this.saveTodos();

            res.writeHead(200);
            res.end(JSON.stringify({ 
                message: `Deleted ${completedCount} completed todos` 
            }));
            return;
        }

        // DELETE /api/todos/all - Clear all todos
        if (method === 'DELETE' && pathname === '/api/todos/all') {
            const totalCount = this.todos.length;
            this.todos = [];
            await this.saveTodos();

            res.writeHead(200);
            res.end(JSON.stringify({ 
                message: `Deleted all ${totalCount} todos` 
            }));
            return;
        }

        // PUT /api/todos/:id - Update todo
        if (method === 'PUT' && pathname.match(/^\/api\/todos\/[^\/]+$/)) {
            const id = pathname.split('/').pop();
            const body = await this.getRequestBody(req);
            const { completed } = body;

            const todoIndex = this.todos.findIndex(todo => todo.id === id);
            if (todoIndex === -1) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Todo not found' }));
                return;
            }

            this.todos[todoIndex].completed = completed;
            await this.saveTodos();

            res.writeHead(200);
            res.end(JSON.stringify(this.todos[todoIndex]));
            return;
        }

        // DELETE /api/todos/:id - Delete specific todo
        if (method === 'DELETE' && pathname.match(/^\/api\/todos\/[^\/]+$/)) {
            const id = pathname.split('/').pop();
            const todoIndex = this.todos.findIndex(todo => todo.id === id);
            
            if (todoIndex === -1) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Todo not found' }));
                return;
            }

            this.todos.splice(todoIndex, 1);
            await this.saveTodos();

            res.writeHead(200);
            res.end(JSON.stringify({ message: 'Todo deleted' }));
            return;
        }

        // If no route matches
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Route not found' }));
    }

    async getRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    resolve({});
                }
            });
            req.on('error', reject);
        });
    }
}

// Start the server
new TodoServer(); 