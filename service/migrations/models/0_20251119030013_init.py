from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL PRIMARY KEY,
    "profile_picture" TEXT,
    "google_id" VARCHAR(255) NOT NULL UNIQUE,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """


MODELS_STATE = (
    "eJztl21P2zAQx79KlFcgMQSlPGiaJnW0G52gnSDdEAhFbuymFo4dEhtaVXz3+dw8NGna0Q"
    "4ESLxpk//dxeefL/F5YgcCExZv92IS2Z+tic1RQPRFQd+ybBSGuQqCRH1mHJX2MArqxzJC"
    "ntTiALGYaAmT2ItoKKngWuWKMRCFpx0p93NJcXqniCuFT+TQJHJ9o2XKMRmROL0Nb90BJQ"
    "wX8qQYxja6K8eh0Xq9dvO78YTh+q4nmAp47h2O5VDwzF0pirchBmw+4SRCkuCZaUCWyXRT"
    "aZqxFmSkSJYqzgVMBkgxgGF/GSjuAQPLjAQ/9a/2Cng8wQEt5RJYTB6ns8rnbFQbhjo+aZ"
    "xv7B1smlmKWPqRMRoi9qMJRBJNQw3XHGQYiQFlxA2pJ1VE5qk6ZCSrqVaElhDr9J8AN0GX"
    "sU1dcrh5YaV0U2rPjtJpXTqQcxDHdwyEzu/GueF71rg0gINxYjntdn6k7kK/AtMXo3N82v"
    "1moOeQfSF8DaqqaI+HKKrGWwhaC+waVft/XO0AjVxGuC+H+ra2v78EdIpVe22WCCam2tRW"
    "RGn+V6CY+j8PwJcvzSLC3Z2dJyDUXgsRGlsRIQkQZaswzAI+qjBB6EUEJuwiOc+xqS2SBq"
    "SaZTGyBBQnodvpxRutUT0H3OVsnKzdss9p+6x14TTOfhW+qc2G0wJLrfA9TdWNg9JSZA+x"
    "/rSdEwturatup1Xe7jI/58qGnJCSwuXiwUV4psxSNQVTWFgV4jUXthj5sbCvurAmeWgeB7"
    "czXQ8IfeTdPqAIu3MWUROLfOdNQS0oK4gj36wKsIUsk166QSLqDe2KLjuxLO2zUe7zZhrt"
    "Nl/QEVb2Krq4ytWeLNirbhI+jPKptls/rB/tHdSPtIvJJFMOl1R/u+P8o6++18cjSGmFbX"
    "Ym5H12Ky+y1cKrsQLExP19AnyRdk+PKAmv2M9+XnQ7C5qUPKQEssf1BK+xPvFtWYzG8uZt"
    "Yl1CEWa9/IBXPsuVNiN4ABzwXnV7efwLaFmreQ=="
)
