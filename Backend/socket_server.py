from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from docker_runner import run_code_interactive
import threading

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Dictionary to store running processes
running_processes = {}

@socketio.on("code_change")
def handle_code(data):
    emit("code_update", data, broadcast=True, skip_sid=request.sid)

@socketio.on("run_code")
def handle_run_code(data):
    """Handle interactive code execution."""
    code = data.get("code", "")
    language = data.get("language", "python")
    user_id = data.get("user_id", "guest")
    session_id = request.sid
    
    def output_handler(output):
        """Callback to send output to client."""
        emit("output", {"data": output}, to=session_id)
    
    def input_required_handler():
        """Callback when input is required."""
        emit("input_required", {}, to=session_id)
    
    def input_handler(input_data):
        """Get input from the client."""
        # Store the input in the running process
        if session_id in running_processes:
            running_processes[session_id]["input_queue"] = input_data
    
    # Store input handler for later use
    running_processes[session_id] = {
        "input_queue": None,
        "process": None
    }
    
    # Run code in a separate thread
    thread = threading.Thread(
        target=run_code_interactive,
        args=(code, language, output_handler, input_required_handler, 
              running_processes[session_id], session_id, socketio)
    )
    thread.daemon = True
    thread.start()

@socketio.on("send_input")
def handle_input(data):
    """Handle input submission during code execution."""
    session_id = request.sid
    input_data = data.get("input", "")
    
    if session_id in running_processes:
        running_processes[session_id]["input_queue"] = input_data

@socketio.on("disconnect")
def handle_disconnect():
    """Clean up when client disconnects."""
    session_id = request.sid
    if session_id in running_processes:
        del running_processes[session_id]

if __name__ == "__main__":
    import eventlet
    import eventlet.wsgi

    print("Socket server running on http://localhost:5000")
    eventlet.wsgi.server(eventlet.listen(("0.0.0.0", 5000)), app)