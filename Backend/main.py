from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from docker_runner import run_code_docker
from ai_helper import explain_code
from db import save_code, get_history

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/run")
async def run(data: dict):
    code = data["code"]
    language = data.get("language", "python")
    input_data = data.get("input", "")
    user_id = data.get("user_id", "guest")

    result = run_code_docker(code, language, input_data)

    # Save history
    save_code(user_id, code, language, result.get("output", ""))

    return result


@app.post("/explain")
async def explain(data: dict):
    code = data["code"]
    explanation = explain_code(code)
    return {"explanation": explanation}


@app.get("/history/{user_id}")
def history(user_id: str):
    return get_history(user_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)