# 🚀 Online Compiler - CodeForge IDE

A feature-rich, multi-language online compiler and IDE with AI-powered code assistance, real-time execution, and code history tracking. Execute code in multiple programming languages directly from your browser with instant feedback.

![Next.js](https://img.shields.io/badge/Next.js-Latest-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?style=flat-square&logo=fastapi)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=flat-square&logo=docker)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

## ✨ Features

- **🎯 Multi-Language Support**: Execute code in Python, JavaScript, Java, C++, and more
- **⚡ Real-Time Code Execution**: Instant code compilation and execution with output feedback
- **🤖 AI Code Explanation**: Get AI-powered explanations for any code snippet
- **📝 Code History**: Track and access your past code executions
- **🎨 Monaco Editor**: Professional-grade code editor with syntax highlighting
- **🔗 Real-Time Communication**: WebSocket support for live collaboration features
- **🐳 Dockerized Execution**: Secure, isolated code execution using Docker containers
- **🔐 User Authentication**: Supabase integration for secure user management

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## 🛠️ Tech Stack

### Frontend
- **Next.js** - React framework for production
- **Monaco Editor** - Advanced code editor component
- **Socket.io** - Real-time, bidirectional communication
- **Supabase** - Backend-as-a-service for authentication and database

### Backend
- **FastAPI** - Modern, fast Python web framework
- **Docker** - Container technology for code execution
- **OpenAI** - AI-powered code explanation
- **Flask-SocketIO** - WebSocket support for real-time features
- **Supabase** - Database and authentication

## 📁 Project Structure

```
Online-Compiler/
├── Backend/                    # FastAPI backend service
│   ├── main.py                # Main FastAPI application
│   ├── docker_runner.py        # Docker code execution handler
│   ├── ai_helper.py           # AI code explanation logic
│   ├── db.py                  # Database operations
│   ├── socket_server.py       # WebSocket server
│   └── requirements.txt       # Python dependencies
├── Frontend/                  # Next.js frontend application
│   ├── pages/                 # Next.js pages
│   │   ├── _app.js           # App component
│   │   ├── index.js          # Home page
│   │   ├── login.js          # Login page
│   │   └── signup.js         # Signup page
│   ├── lib/                  # Utility functions
│   │   ├── socket.js         # Socket.io client setup
│   │   └── supabaseClient.js # Supabase configuration
│   ├── hooks/                # Custom React hooks
│   │   └── useTheme.js       # Theme management hook
│   ├── styles/               # Global styles
│   └── package.json          # Node dependencies
├── Docker/                   # Docker configuration
│   └── Dockerfile           # Docker image definition
└── README.md                # This file
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://www.python.org/)
- **Docker** (latest) - [Download](https://www.docker.com/)
- **Git** - [Download](https://git-scm.com/)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Rohit01030/Online-Compiler.git
cd Online-Compiler
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../Frontend

# Install dependencies
npm install
```

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the `Frontend` directory:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

Create a `.env` file in the `Backend` directory:

```
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
DATABASE_URL=your_database_url
```

### Docker Configuration

Ensure Docker is running on your system. The application uses Docker to safely execute user code in isolated containers.

## 🏃 Running the Application

### Start Backend Server

```bash
# From the Backend directory (with venv activated)
python main.py

# Or using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at `http://localhost:8000`

### Start Frontend Development Server

```bash
# From the Frontend directory (in a new terminal)
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Production Build

**Frontend:**
```bash
npm run build
npm start
```

**Backend:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 📚 API Documentation

### POST /run
Execute code in a specified language

**Request:**
```json
{
  "code": "print('Hello World')",
  "language": "python",
  "input": "",
  "user_id": "user123"
}
```

**Response:**
```json
{
  "output": "Hello World",
  "error": null,
  "execution_time": 0.234
}
```

### POST /explain
Get AI explanation for code

**Request:**
```json
{
  "code": "def factorial(n):\n    return 1 if n <= 1 else n * factorial(n-1)"
}
```

**Response:**
```json
{
  "explanation": "This function calculates the factorial of a number using recursion..."
}
```

### GET /history/{user_id}
Retrieve code execution history

**Response:**
```json
{
  "history": [
    {
      "id": 1,
      "code": "print('Hello')",
      "language": "python",
      "output": "Hello",
      "timestamp": "2024-04-17T10:30:00Z"
    }
  ]
}
```

## 💻 Usage

1. **Open the Application**: Navigate to `http://localhost:3000`
2. **Sign Up/Login**: Create an account or login with existing credentials
3. **Write Code**: Use the Monaco editor to write code
4. **Select Language**: Choose your programming language from the dropdown
5. **Execute**: Click "Run" to execute your code
6. **View Output**: See the output and any errors below the editor
7. **Explain Code**: Click "Explain with AI" for code insights
8. **View History**: Access your previous code executions

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

**Docker not found**: Ensure Docker is installed and running on your system
**Port already in use**: Change the port in configuration if 8000 or 3000 are already in use
**API connection errors**: Verify backend is running at the correct URL in `.env.local`
**Module not found errors**: Make sure all dependencies are installed with `pip install -r requirements.txt`

## 📧 Support

For issues and questions, please open an issue on [GitHub](https://github.com/Rohit01030/Online-Compiler/issues)

---

**Made with ❤️ by CodeForge Team**