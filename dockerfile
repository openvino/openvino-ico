FROM node:13.11.0
 
COPY package.json deployment/
RUN cd deployment && npm install
 
COPY scripts/deploy.js deployment/
COPY scripts/utils.js deployment/
 
COPY deploy/Token.abi deployment/abi/
COPY deploy/Token.bin deployment/bin/
 
COPY contracts/Token.sol deployment/contracts/
 
COPY deploy/CrowdsaleToken.abi deployment/abi/
COPY deploy/CrowdsaleToken.bin deployment/bin/
 
COPY contracts/CrowdsaleToken.sol deployment/contracts/
 
COPY builds/ExchangeFactory.abi deployment/abi/
COPY builds/Exchange.abi deployment/abi/
 
COPY .env /deployment/
 
WORKDIR deployment/
 
ENTRYPOINT node deploy.js