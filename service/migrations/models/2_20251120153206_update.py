from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "scenarios" ADD "funding" DECIMAL(15,2);
        ALTER TABLE "costs" ADD "is_active" BOOL NOT NULL DEFAULT True;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "costs" DROP COLUMN "is_active";
        ALTER TABLE "scenarios" DROP COLUMN "funding";"""


MODELS_STATE = (
    "eJztmm1v2joUx78KyqtO6qo1o910dTWJp25sBa5a2J02TZFJTLDq2NRx2qKK735tk+c43N"
    "LBgC5vWjg+Jzn+2c752+HR8KgDsX8y8iEz/qo9GgR4UHzI2I9rBpjNEqs0cDDGyjEQHsoC"
    "xj5nwObCOAHYh8LkQN9maMYRJcJKAoylkdrCERE3MQUE3QbQ4tSFfKoS+fFTmBFx4AP0o6"
    "+zG2uCIHYyeSJH3lvZLT6fKdto1G1fKE95u7FlUxx4JPGezfmUktg9CJBzImNkmwsJZIBD"
    "J9UNmWXY3ci0zFgYOAtgnKqTGBw4AQGWMIy/JwGxJYOaupP8U/9grIHHpkSiRYRLFo+LZa"
    "+SPiurIW/V+tS4Onp7/kr1kvrcZapRETEWKhBwsAxVXBOQM0YnCENrhmweMFikOoQPXE9V"
    "E5pDLNJ/AtwQXcw2ckngJhMrohtR2zjKYefbUObs+f4tlob+18aV4ttrfFOAvXnYcjnof4"
    "zcqVgCy4XRb10Omgp6Atml1BWgdJO2NQVMjzcT9Cywz5i1v8bV8MCDhSFx+VR8Nc/OVoCO"
    "sAqvVzmCYZO5bMuiVP/XoBj5bwbg9qdmFuHpmzdPQCi8ShGqtixC6AGE12EYB1SzMERoMy"
    "g7bAFe5NgWLRx5UM8yG5kD6oShJ9GHPZ2jog/OgOB5OHarHqfdXud62Oj9k3mmthvDjmwx"
    "M8/TyHp0nhuK+CK1f7vDTzX5tfZ90O/ky13sN/xuyJxAwKlF6L0FnNQ0i6wRmMzABjPnmQ"
    "ObjawGdqcDq5KX4nFyk1I90jAG9s09YI5VaKEmLfMtNnmml7cAAlw1KpKtzDLU0tc2JIAh"
    "amh0dty2Umv7oVeltw9fb/9Z+mUrxTedWYFk+XYlF1ZtVbRbFbGIHJlPsfpBG3kA69mmov"
    "KVbxl2EoYfGuN2p9XtNS6PTs+OTYVUAEUcpmdvvSCwK3X4IkREpQ5f6MCuqw5TK1vc1i+O"
    "fTMMu/hyBTEoqTCh5GuJS+zn+C6iSRtZ06i2pY4VDo0yjjCVq+J4LCpFfNCKmCOO15LEcU"
    "CliWOIdwAHGogrRVsc88uSbXcPq81pNtE7l7L5OhMxHXOYc3Er58s+B4z7WpHUJSWbs0xM"
    "jqWsRPvJ0pX3eW2e1t/V3789r78XLiqX2PJuBd1uf5g/mCd6aVlKLQl4FrLfv9PaNLEJg7"
    "frrNjI/zBXq/mUxWqWr1WzsFSRWHJCIdxpSkeTUgwBKZEz6bgczLEI3BbNWONsumY0B4PL"
    "zF6l2c0flox6zY54FuYqSnFOVrv/F7FJrHb/L3Rgw+RTeiV8vaL9fUb5li4Xtsm93U7l8/"
    "9s5QrnJkWQRYoXlEHkki9wrlh2RS6A2LrqoXkxtrf0CiclwszAfXxYkJ8iopuic3BZOFqN"
    "61aj3TEWu3kr2YAM2VNDc/ISthyvOnsBic/eHL6UqmTt+tQo5HAEd/rTlY3o4/KzljvIfO"
    "1rs3LJnAo5UNW8jfMWuTTWgBi6HybArRwSiDtySDRK6vP1oF8ij5OQHMgRER384SCbH9cw"
    "8vnP/cS6gqLs9ep3ufnXtrnqLC/Q1JXn31leFv8BTXvYTQ=="
)
