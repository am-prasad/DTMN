from app.core.database import Base


def run_migrations_offline() -> None:
    from alembic import context
    from app.core.config import get_settings
    settings = get_settings()
    # Strip async driver prefix for offline/sync mode
    sync_url = settings.DATABASE_URL.replace("+aiomysql", "+pymysql")
    context.configure(
        url=sync_url,
        target_metadata=Base.metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    from alembic import context
    from sqlalchemy import create_engine
    from app.core.config import get_settings
    import app.models  # noqa: F401 — ensure all models are loaded

    settings = get_settings()
    # Use sync pymysql driver for Alembic
    sync_url = settings.DATABASE_URL.replace("+aiomysql", "+pymysql")
    connectable = create_engine(sync_url)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=Base.metadata)
        with context.begin_transaction():
            context.run_migrations()


from alembic import context

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
