# Colyseus Docker Startup

## Requirements

- Docker Desktop must be installed and running.
- Run all commands from this directory:

```powershell
cd colyseus
```

## Start the services

Build the Colyseus image and start Colyseus, Redis, and PostgreSQL:

```powershell
docker compose up --build -d
```

The services are available at:

- Colyseus: `http://localhost:2567`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

PostgreSQL automatically runs `src/db/schema.sql` when its data volume is created for the first time.

## Check status and logs

```powershell
docker compose ps
docker compose logs -f colyseus
```

The Colyseus service should remain in the `running` state after PostgreSQL and Redis become healthy.

## Stop the services

Stop the containers while preserving the database volume:

```powershell
docker compose down
```

## Reset the database

To delete the local PostgreSQL data and run `schema.sql` again from an empty database:

```powershell
docker compose down -v
docker compose up --build -d
```

The `-v` option deletes the local database volume, so do not use it if you need to preserve local data.
