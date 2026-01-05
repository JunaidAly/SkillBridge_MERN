from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello"}

@app.post("/test")
async def test():
    return {"message": "Test successful"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
