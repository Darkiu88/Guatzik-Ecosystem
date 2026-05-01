from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class LightCmd(BaseModel):
    index: int
    state: bool

@router.post("/lights")
async def toggle_light(cmd: LightCmd):
    print(f"[HARDWARE] Luz {cmd.index} -> {cmd.state}")
    return {"status": "ok", "executed": cmd.state}

@router.post("/projector")
async def toggle_projector(state: bool):
    print(f"[HARDWARE] Proyector -> {state}")
    return {"status": "ok"}

