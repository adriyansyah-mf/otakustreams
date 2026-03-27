from fastapi import APIRouter


router = APIRouter()


@router.get("/")
def root():
    return {"name": "OtakuStream API", "ok": True}

