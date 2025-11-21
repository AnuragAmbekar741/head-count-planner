from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "scenarios" ADD "revenue" DECIMAL(15,2);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "scenarios" DROP COLUMN "revenue";"""


MODELS_STATE = (
    "eJztmm1v2joUx78KyqtO6qo1o910dTWJp25sBa5a2J02TZFJTLDq2NRx2qKK735tk+c43N"
    "LBgC5vWjg+Jzn+2Y7/x+HR8KgDsX8y8iEz/qo9GgR4UHzI2I9rBpjNEqs0cDDGyjEQHsoC"
    "xj5nwObCOAHYh8LkQN9maMYRJcJKAoylkdrCERE3MQUE3QbQ4tSFfKoS+fFTmBFx4AP0o6"
    "+zG2uCIHYyeSJH3lvZLT6fKdto1G1fKE95u7FlUxx4JPGezfmUktg9CJBzImNkmwsJZIBD"
    "J9UNmWXY3ci0zFgYOAtgnKqTGBw4AQGWMIy/JwGxJYOaupP8U/9grIHHpkSiRYRLFo+LZa"
    "+SPiurIW/V+tS4Onp7/kr1kvrcZapRETEWKhBwsAxVXBOQM0YnCENrhmweMFikOoQPXE9V"
    "E5pDLNJ/AtwQXcw2ckngJhMrohtR2zjKYefbUObs+f4tlob+18aV4ttrfFOAvXnYcjnof4"
    "zcqVgCy4XRb10Omgp6Atml1BWgdJO2NQVMjzcT9Cywz5i1v8bV8MCDhSFx+VR8Nc/OVoCO"
    "sAqvVzmCYZO5bMuiVP/XoBj5bwbg9qdmFuHpmzdPQCi8ShGqtixC6AGE12EYB1SzMERoMy"
    "g7bAFe5NgWLRx5UM8yG5kD6oShJ9GHPZ2jog/OgOB5OHarHqfdXud62Oj9k3mmthvDjmwx"
    "M8/TyHp0nhuK+CK1f7vDTzX5tfZ90O/kt7vYb/jdkDmBgFOL0HsLOKlpFlkjMJmBDWbOMw"
    "c2G1kN7E4HViUvxePkJqV6pGEM7Jt7wByr0EJNWuZbbPJML28BBLhqVCRbmWWopa9tSABD"
    "1NDo7Lhtpdb2Q69Kbx++3v6z9MtWNt90ZgWS5eVKLqwqVbSlilhEjsynuPtBG3kA69mmov"
    "I73zLsJAw/NMbtTqvba1wenZ4dmwqpAIo4TM/eekFgM3gHSaBZ5isZpqIqhpXCfhlCrFLY"
    "L3Rg11XYqZUtbusXx74Zhl18uYIYlOzSoWxuiUvs5/guokkbWdOotlVhKBya6iLCVF5ZxG"
    "NRVRUHXVVwxPFaZUUcUNUVMcQ7gNcWbXHML0u23T2sNqfZRO9cyubrTMR0zGHOxa2c0fsc"
    "MO5rRVKXlBS4mZgcS7kT7SdLV97ntXlaf1d///a8/l64qFxiy7sVdLv9Yf7lBtFLy1JqSc"
    "CzkP3+SmvTxCYM3q6zYiP/w1yt5lMWq1m+Vs3CUkViyQmFcKfZOpqUYghIiZxJx+VgjkXg"
    "tmjGGmfTe0ZzMLjM1CrNbv7AadRrdsSzMLejFOdkVf2/iCKxqv5f6MCGyaf0SviKSvsbl/"
    "KSLhe2ydpup/L5f0q5wrlJEWSR4gVlELnkC5wrll2RCyC2bvfQvFzcW3qFkxJhZuA+PizI"
    "TxHRTdE5uNw4Wo3rVqPdMRa7ebPbgAzZU0Nz8hK2HK86ewGJz94cvpSqZO361CjkcAR3+v"
    "Ofjejj8rOWO8h87avHcsmcCjlQ1byN8xa5NNaAGLofJsCtHBKIO3JINErq8/WgXyKPk5Ac"
    "yBERHfzhIJsf1zDy+c/9xLqCouz16vfh+Vffud1ZXqCp255/5/ay+A8kAkBa"
)
