const axios = require('axios')
const { URLSearchParams } = require('url');

var verify = function(key, address, sourcecode, contractname, parameters) {

    setTimeout(async function() {
        const data = {
            apikey: key,
            module: 'contract',
            action: 'verifysourcecode',
            contractaddress: address,
            sourceCode: sourcecode,
            codeformat: 'solidity-single-file',
            contractname: contractname,
            compilerversion: 'v0.5.15+commit.6a57276f',
            optimizationUsed: 1,
            runs: 200,
            constructorArguements: parameters.substring(2),
            evmversion: 'istanbul',
            licenseType: 1
        };

        try {
            let result = await axios.post(`${getEtherscanUrl()}/api`, new URLSearchParams(data));
            console.log(`Contract ${address} verified -> ${result.toString()}`)
        } catch (error) {
            console.log(`Contract ${address} not verified -> ${error.toString()}`)
        }


    }, 30000);

};

var getEtherscanUrl = function() {
    switch (process.env.NETWORK_ID) {
        case "mumbai":
            return `https://api-testnet.polygonscan.com`;
        case "polygon":
            return `https://api.polygonscan.com/`
        case "ethereum":
            return `https://api.etherscan.io`;
        case "sepolia":
            return `https://api-sepolia.etherscan.io`;
    }
};

var getEtherscanApiKey = function () {
    switch (process.env.NETWORK_ID) {
        case "mumbai":
        case "polygon":
            return `${process.env.POLYGONSCAN_API_KEY}`;
        case "ethereum":
        case "sepolia":
            return `${process.env.ETHERSCAN_API_KEY}`;
    }
}

var getInfuraUrl = function() {
    switch (process.env.NETWORK_ID) {
        case "mumbai":
            return `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;
        case "polygon":
            return `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
        case "ethereum":
            return `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;
        case "sepolia":
            return `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;

    }
};

var getChainId = function() {
    switch (process.env.NETWORK_ID) {
        case "mumbai":
            return 80001;
        case "polygon":
            return 137;
        case "ethereum":
            return 1;
        case "sepolia":
            return 11155111;
    }
};

module.exports = {
    verify,
    getInfuraUrl,
    getChainId,
    getEtherscanUrl,
    getEtherscanApiKey,
}
