
# OpenVino ICO + Crowdsale

Generic code to automatically deploy the OpenVino's ICO & Crowdsale.

## Requirements

 - Docker installed
 - Infura Project ID
 - EtherScan API Key

## Setup
Clone this repository

    git clone https://github.com/jestape/openvino-ico.git
    cd openvino-ico

Set up .env file

    cp .env.example .env

Fill the required parameters in the .env file

    INFURA_PROJECT_ID=
    NETWORK_ID=
    PRIVATE_KEY=
    ETHERSCAN_API_KEY=
    
    TOKEN_NAME=Test 
    TOKEN_SYMBOL=
    TOKEN_DECIMALS=
    TOKEN_CAP=
    TOKEN_PREFUND_ADDRESS=
    TOKEN_PREFUND_AMOUNT=
    
    CROWDSALE_PRICE=
    CROWDSALE_ADMIN_ADDRESS=
    CROWDSALE_OPENNING_TIME=
    CROWDSALE_CLOSING_TIME=
    
    EXCHANGE_FACTORY_ADDRESS=
    EXCHANGE_LIQUIDITY=
    EXCHANGE_ETH_ADDED=
    EXCHANGE_DEADLINE=

Run the deploy script:

    bash scripts/deploy.sh

