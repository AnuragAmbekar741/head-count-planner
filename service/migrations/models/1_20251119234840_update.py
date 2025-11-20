from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "scenarios" (
    "id" UUID NOT NULL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
        CREATE TABLE IF NOT EXISTS "costs" (
    "id" UUID NOT NULL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "starts_at" INT NOT NULL,
    "end_at" INT,
    "freq" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scenario_id" UUID NOT NULL REFERENCES "scenarios" ("id") ON DELETE CASCADE
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "costs";
        DROP TABLE IF EXISTS "scenarios";"""


MODELS_STATE = (
    "eJztmm1P2zAQx79KlVdMYmhkhU3TNCm0ZesG7QRlmzZNkUnc1MKxg+MMKtTvPtvNc5yOsn"
    "a0LG+Anu/q8892/D+HO8OnLsTh3kUImfGmdWcQ4EPxR8G+2zJAEGRWaeDgEivHSHgoC7gM"
    "OQMOF8YxwCEUJheGDkMBR5QIK4kwlkbqCEdEvMwUEXQdQZtTD/KJSuTHT2FGxIW3MEw+Bl"
    "f2GEHsFvJEruxb2W0+DZTt4qLfPVaesrtL26E48knmHUz5hJLUPYqQuydjZJsHCWSAQzc3"
    "DJllPNzENM9YGDiLYJqqmxlcOAYRljCMt+OIOJJBS/Ukf7TfGUvgcSiRaBHhksXdbD6qbM"
    "zKasiuOh+ss52Xh8/UKGnIPaYaFRFjpgIBB/NQxTUDGTA6RhjaAXJ4xGCV6gjecj1VTWgJ"
    "sUj/HnBjdCnbxCWDmy2shG5CbeUoR71vI5mzH4bXWBoGX6wzxffU+qYA+9O45WQ4eJ+4U7"
    "EF5htj0DkZHinoGWSPUk+A0i3azgQwPd5C0IPAPmDV/h1Xwwe3NobE4xPx0Tw4WAA6wSq8"
    "npUIxk3mvK2IUv1egmLivxqA61+aRYT7L17cA6HwqkWo2ooIoQ8QXoZhGtCswhihw6AcsA"
    "14lWNXtHDkQz3LYmQJqBuH7iV/bOgaFWNwhwRP47lb9Djtn/bOR9bp58IztWuNerLFLDxP"
    "E+vOYWkq0i9pfe2PPrTkx9b34aBXPu5Sv9F3Q+YEIk5tQm9s4OaWWWJNwBQmNgrcB05sMb"
    "KZ2EedWJW8FI/jq5zqkYZL4FzdAObalRZq0jrfapNv+mULIMBTsyLZyixjLX3uQAIYooZG"
    "Z6dtC7V2GHs1env79fb/pV/WcvjmM6uQrC9XSmFNqaItVRpl8yQOwEbZPNGJXVbZ5Ha26D"
    "aszv1RHHb86QxiUPN0jOVKR3zFZs7vLFm0iTWPal3KTuHQqLoEU72iS+eiUXNbreY44ngp"
    "OZcGNHouhfgL4EgDsQsd5AOs55jGlI+jedBeHLyZTBcg7PY6/VPrZGf/YNdUDMVBgzjM02"
    "1XLvQcMTqPsukyCzEfs51rcS13oyEHjIdakdQnNYVFIabEUp5Em8nSk/08N/fbr9qvXx62"
    "XwsXlUtqebWAbn8wKl8qE720rKWWBTwI2b+vxFZNbMzg9TI7NvHfzt1q3mezmvV71aw+9Z"
    "pK9SkUNE2l+kQnNk4+d7bG19ja9+D15UcpbJV1yKNKvT+UHZUavwqySvGYMog88glOFcu+"
    "yAUQRyeUNS8gNpZepaoXZgZu0sK2vETEMMXg4Fw2d6zzjtXtGbPHeftjQYaciaG5JYhbdh"
    "fdE4DMZ2MuCmoVnXZ/atRcPIOP+i8CK9Fy9fcCvyALta8n6uVdLmRLFd467gbk1lgCYuy+"
    "nQDXUtCKHjkkGiX18Xw4qJHHWUgJ5AURA/zhIofvtjAK+c/NxLqAohz14ndm5ddjpdNZfs"
    "GR7nj+l8fL7DdHrgQR"
)
