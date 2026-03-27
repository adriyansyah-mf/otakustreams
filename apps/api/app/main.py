from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.routers import admin, anime, auth, bookmarks, community, health, history, manga, notifications, recommendations, reports, root
from app.routers.ads import admin_router as ads_admin_router, router as ads_router
from app.routers.analytics_admin import router as analytics_router
from app.routers.seo import admin_router as seo_admin_router, router as seo_router


def create_app() -> FastAPI:
    app = FastAPI(title="OtakuStream API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(root.router)
    app.include_router(auth.router)
    app.include_router(anime.router)
    app.include_router(manga.router)
    app.include_router(bookmarks.router)
    app.include_router(history.router)
    app.include_router(community.router)
    app.include_router(notifications.router)
    app.include_router(recommendations.router)
    app.include_router(reports.router)
    app.include_router(reports.admin_router)
    app.include_router(admin.router)
    app.include_router(ads_router)
    app.include_router(ads_admin_router)
    app.include_router(seo_router)
    app.include_router(seo_admin_router)
    app.include_router(analytics_router)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # Server-side log to debug 422 quickly.
        print(
            "REQUEST_VALIDATION_ERROR",
            str(request.url),
            exc.errors(),
            "body=",
            getattr(exc, "body", None),
        )
        return JSONResponse(status_code=422, content={"detail": exc.errors()})
    return app


app = create_app()

