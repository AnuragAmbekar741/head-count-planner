from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "revenues" (
    "id" UUID NOT NULL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "category" VARCHAR(100),
    "starts_at" INT NOT NULL,
    "end_at" INT,
    "freq" VARCHAR(20) NOT NULL,
    "is_active" BOOL NOT NULL DEFAULT True,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scenario_id" UUID NOT NULL REFERENCES "scenarios" ("id") ON DELETE CASCADE
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "revenues";"""


MODELS_STATE = (
    "eJztm1tv4jgUgP8KylNH6lbTDO2MVquVuHWHnQKrFnZHMxpFJjHBamJTx2mLKv772ib3OG"
    "xpYbisX1o4PofYn49zLoFnwycO9IKzUQCp8Wvt2cDAh/xFTn5aM8BslkqFgIGxJxVDriEl"
    "YBwwCmzGhRPgBZCLHBjYFM0YIphLceh5Qkhsroiwm4pCjO5DaDHiQjaVE/n+g4sRduATDO"
    "K3sztrgqDn5OaJHHFtKbfYfCZlo1G3fSU1xeXGlk280Mep9mzOpgQn6mGInDNhI8ZciCEF"
    "DDqZZYhZRsuNRcsZcwGjIUym6qQCB05A6AkYxm+TENuCQU1eSfyp/26sgccmWKBFmAkWz4"
    "vlqtI1S6khLtX63Lg5+XD5Tq6SBMylclASMRbSEDCwNJVcU5AzSibIg9YM2SyksEx1CJ+Y"
    "mqrCtICYT/8FcCN0CdtYJYWbOlZMN6a2cZTDztehmLMfBPeeEPT/btxIvr3GVwnYn0cj14"
    "P+H7E64UdgeTD6retBU0JPIbuEuByUymlbU0DVeHNGrwL7Cq99G1fDB0+WB7HLpvyteXGx"
    "AnSMlWu9KxCMhszlWB6l/L8GxVh/MwC375p5hOfv378AIdeqRCjH8gihD5C3DsPEQHthhN"
    "CmUCzYAqzMsc1HGPKhmmXesgDUiUzP4hd76qN8Dc4Ae/No71bdTru9zu2w0fsrd09tN4Yd"
    "MWLm7qex9OSysBXJh9T+6Q4/18Tb2rdBv1MMd4ne8Jsh5gRCRixMHi3gZNwslsZgchsbzp"
    "xXbmzeUm/sTjdWTl4kj5O7TNYjBGNg3z0C6lilEWKSKt3ykG/6RQnAwJW7ItiKWUa59K0N"
    "MaCIGIo8OxlbmWsHkZbOtw8/3/5/5S9bCb7ZmZVIVpcrBTNdqihLFX6IHDGfcvSDNvKBp2"
    "absSpGvqXZWWR+aIzbnVa317g+Ob84NSVSDhQxmPXeeinBpvAB4lBxzFcyzFhphjrDPo5E"
    "TGfYR7qx62bYmZPNLxuU974ZmV19uYEeqIjSUdrc4h+xn/u7iJ02lqb7XIoPb4Rwk8aLA+"
    "KwzUpLuoWiyordpbrCSnxSV1cHXV0xxLy1yqvEQNdXCcQH4K2dvCY2b05dd3ez2lzuylfn"
    "EjpfxxGzNofpi1t5VhEwQFmgTBa7uKLQz9kUWIpItJ8sXXGdX8zz+sf6pw+X9U9cRc4lkX"
    "xcQbfbHxYf8mB1il1JLTV4FbKfX3FumtiEwvt1Tmysf5in1XzJYTWrz6pZOqqIHzmeITwo"
    "QkeTEA8CXJHOZO0KMMfccFs0kxxn0zGjORhc52q2ZrfYeBv1mh1+LyxElLJP6i7IURTLug"
    "typBtbKu3jR3XK7/pUl3QFs03WdjtNn/+jlCv1j8ogyxSvCIXIxV/gXLLs8rkAbKuih+Ih"
    "697SK3VKuJiCx6RZUHQRvky+OLgMHK3GbavR7hiL3TzhjjtRitZLpklV3X3J9sN0A0Y3YI"
    "wDSqN1A0Y3YHZWAev+y952E3T/RfdfdP9F9190mb4HZbruvxzpxur+i+6/6P5LA1JkTw1F"
    "+yUaOV3VfQGpzt70XiqzZOX5VGTI0Q6+reeyD/lxdavlAdJA+RX46pQ5Y3KgWfM22i3iaK"
    "wBMVI/TIBbaRLwKzKIFZnUn7eDfkV6nJoUQI4wX+B3B9nstOahgP3YT6wrKIpV57Kl0u8y"
    "ij/BKERn8QFNVXj+meFl8S/9RDVe"
)
