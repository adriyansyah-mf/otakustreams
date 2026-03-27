from fastapi import APIRouter


router = APIRouter()


@router.get("/")
def root():
    return {"name": "Otakunesia API", "ok": True}

