FROM node:13.11.0

COPY scripts/deploy.js deployment/
COPY package.json deployment/

COPY deploy/Token.abi deployment/abi/
COPY deploy/Token.bin deployment/bin/

COPY contracts/Token.sol deployment/contracts/

COPY deploy/CrowdsaleToken.abi deployment/abi/
COPY deploy/CrowdsaleToken.bin deployment/bin/

COPY contracts/CrowdsaleToken.sol deployment/contracts/

COPY contracts/ExchangeFactory.abi deployment/abi/
COPY contracts/Exchange.abi deployment/abi/

COPY .env /deployment/

WORKDIR deployment/

RUN npm install

ENTRYPOINT node deploy.js