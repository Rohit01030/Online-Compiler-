import os
import sys
import subprocess
import tempfile
import threading
import time
import select


def get_filename(language):
    """Get the correct filename for each language."""
    filenames = {
        "python": "main.py",
        "cpp": "main.cpp",
        "c": "main.c",
        "java": "Main.java"
    }
    return filenames.get(language, "main.py")


def get_docker_command(language, filename):
    """Get the Docker command to compile and run code for each language."""
    commands = {
        "python": f"python /app/{filename}",
        "cpp": f"g++ /app/{filename} -o /app/a.out && /app/a.out",
        "c": f"gcc /app/{filename} -o /app/a.out && /app/a.out",
        "java": f"javac /app/{filename} && java -cp /app Main"
    }
    return commands.get(language, commands["python"])


def run_code_local(path, language, input_data):
    """Run code locally (fallback when Docker is not available)."""
    tmpdir = os.path.dirname(path)
    
    try:
        if language == "python":
            cmd = [sys.executable, path]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                input=input_data,
                timeout=30,
                cwd=tmpdir,
            )
            return result.stdout or result.stderr
        
        elif language == "cpp":
            output_path = os.path.join(tmpdir, "a.exe" if os.name == "nt" else "a.out")
            compile_cmd = ["g++", path, "-o", output_path]
            
            compile_result = subprocess.run(
                compile_cmd,
                capture_output=True,
                text=True,
                timeout=30,
            )
            
            if compile_result.returncode != 0:
                return f"Compilation Error:\n{compile_result.stderr}"
            
            result = subprocess.run(
                [output_path],
                capture_output=True,
                text=True,
                input=input_data,
                timeout=30,
                cwd=tmpdir,
            )
            return result.stdout or result.stderr
        
        elif language == "c":
            output_path = os.path.join(tmpdir, "a.exe" if os.name == "nt" else "a.out")
            compile_cmd = ["gcc", path, "-o", output_path]
            
            compile_result = subprocess.run(
                compile_cmd,
                capture_output=True,
                text=True,
                timeout=30,
            )
            
            if compile_result.returncode != 0:
                return f"Compilation Error:\n{compile_result.stderr}"
            
            result = subprocess.run(
                [output_path],
                capture_output=True,
                text=True,
                input=input_data,
                timeout=30,
                cwd=tmpdir,
            )
            return result.stdout or result.stderr
        
        elif language == "java":
            # Compile Java
            compile_cmd = ["javac", path]
            compile_result = subprocess.run(
                compile_cmd,
                capture_output=True,
                text=True,
                timeout=30,
                cwd=tmpdir,
            )
            
            if compile_result.returncode != 0:
                return f"Compilation Error:\n{compile_result.stderr}"
            
            # Run Java
            run_cmd = ["java", "-cp", tmpdir, "Main"]
            result = subprocess.run(
                run_cmd,
                capture_output=True,
                text=True,
                input=input_data,
                timeout=30,
                cwd=tmpdir,
            )
            return result.stdout or result.stderr
        
        else:
            return f"Language '{language}' is not supported."
    
    except FileNotFoundError as exc:
        return f"Execution failed - required compiler/interpreter not found: {exc}"
    except subprocess.TimeoutExpired:
        return "Execution timed out (exceeded 30 seconds)"


def run_code_docker(code, language, input_data):
    """Run code using Docker, fallback to local execution if Docker fails."""
    with tempfile.TemporaryDirectory() as tmpdir:
        filename = get_filename(language)
        path = os.path.join(tmpdir, filename)

        with open(path, "w", encoding="utf-8") as f:
            f.write(code)

        docker_cmd = [
            "docker", "run", "--rm",
            "-v", f"{tmpdir}:/app",
            "code-runner",
            "sh", "-c",
            get_docker_command(language, filename)
        ]

        try:
            result = subprocess.run(
                docker_cmd,
                capture_output=True,
                text=True,
                input=input_data,
                timeout=30,
            )
        except FileNotFoundError:
            docker_error = "Docker is not installed or not available in PATH."
        except subprocess.TimeoutExpired:
            return {"output": "", "error": "Docker execution timed out.", "fallback": False}
        else:
            if result.returncode == 0:
                return {"output": result.stdout or "", "error": None, "fallback": False}
            docker_error = result.stderr.strip() or result.stdout.strip() or "Docker execution failed."

        # Fallback to local execution
        local_output = run_code_local(path, language, input_data)
        return {"output": local_output, "error": docker_error, "fallback": True}


def run_code_interactive(code, language, output_handler, input_required_handler, 
                         process_state, session_id, socketio):
    """Run code with interactive I/O support."""
    with tempfile.TemporaryDirectory() as tmpdir:
        filename = get_filename(language)
        path = os.path.join(tmpdir, filename)

        with open(path, "w", encoding="utf-8") as f:
            f.write(code)

        try:
            # First, compile if needed
            if language == "cpp":
                output_path = os.path.join(tmpdir, "a.exe" if os.name == "nt" else "a.out")
                compile_cmd = ["g++", path, "-o", output_path]
                compile_result = subprocess.run(
                    compile_cmd,
                    capture_output=True,
                    text=True,
                    timeout=30,
                    cwd=tmpdir,
                )
                if compile_result.returncode != 0:
                    output_handler(f"Compilation Error:\n{compile_result.stderr}")
                    return
                run_cmd = [output_path]
            
            elif language == "c":
                output_path = os.path.join(tmpdir, "a.exe" if os.name == "nt" else "a.out")
                compile_cmd = ["gcc", path, "-o", output_path]
                compile_result = subprocess.run(
                    compile_cmd,
                    capture_output=True,
                    text=True,
                    timeout=30,
                    cwd=tmpdir,
                )
                if compile_result.returncode != 0:
                    output_handler(f"Compilation Error:\n{compile_result.stderr}")
                    return
                run_cmd = [output_path]
            
            elif language == "java":
                compile_cmd = ["javac", path]
                compile_result = subprocess.run(
                    compile_cmd,
                    capture_output=True,
                    text=True,
                    timeout=30,
                    cwd=tmpdir,
                )
                if compile_result.returncode != 0:
                    output_handler(f"Compilation Error:\n{compile_result.stderr}")
                    return
                run_cmd = ["java", "-cp", tmpdir, "Main"]
            
            else:  # Python
                run_cmd = [sys.executable, path]

            # Run the code with interactive I/O
            process = subprocess.Popen(
                run_cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                cwd=tmpdir,
                bufsize=1,
                universal_newlines=True
            )
            
            process_state["process"] = process
            
            # Thread function to read output
            def read_output():
                try:
                    for line in process.stdout:
                        if line:
                            output_handler(line)
                        
                        # Check if input is waiting and write it
                        while process_state.get("input_queue") is not None:
                            input_data = process_state.get("input_queue")
                            if input_data is not None:
                                process_state["input_queue"] = None
                                try:
                                    process.stdin.write(input_data + "\n")
                                    process.stdin.flush()
                                except (BrokenPipeError, OSError, ValueError):
                                    pass
                                break
                            time.sleep(0.01)
                except Exception as e:
                    pass
            
            # Start output reader thread
            reader_thread = threading.Thread(target=read_output, daemon=True)
            reader_thread.start()
            
            # Wait for process to complete
            process.wait(timeout=30)

        except FileNotFoundError as exc:
            output_handler(f"Execution failed - required compiler/interpreter not found: {exc}")
        except subprocess.TimeoutExpired:
            try:
                process.terminate()
                process.wait(timeout=2)
            except:
                pass
            output_handler("Execution timed out (exceeded 30 seconds)")
        except Exception as e:
            output_handler(f"Unexpected error: {str(e)}")
        
        # Emit completion signal
        socketio.emit("execution_complete", {}, room=session_id, namespace='/')

