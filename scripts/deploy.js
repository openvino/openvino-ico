require('dotenv').config()
const https = require('https')
const axios = require('axios')
const { URLSearchParams } = require('url');

// Preparing wallet and web3 endpoint (Infura based)
const Web3 = require('web3');
const HDWalletProvider = require('truffle-hdwallet-provider');
const provider = new HDWalletProvider(process.env.PRIVATE_KEY, `https://ropsten.infura.io/v3/` + process.env.INFURA_PROJECT_ID);
const web3 = new Web3(provider);
var BigNumber = web3.utils.BN;

// Reading smart contracts to be deployed (Single-file-based)
var fs = require('fs');

const tokenABI = JSON.parse(fs.readFileSync('./abi/Token.abi', 'utf8'));
const tokenBIN  = fs.readFileSync('./bin/Token.bin', 'utf8');
const tokenSourceCode = fs.readFileSync('./contracts/Token.sol', 'utf8');

const crowdsaleABI = JSON.parse(fs.readFileSync('./abi/CrowdsaleToken.abi', 'utf8'));
const crowdsaleBIN  = fs.readFileSync('./bin/CrowdsaleToken.bin', 'utf8');
const crowdsaleSourceCode = fs.readFileSync('./contracts/CrowdsaleToken.sol', 'utf8');

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

        let response = await axios.post('http://api-ropsten.etherscan.io/api', new URLSearchParams(data));

    }, 30000);

};

(async () => {

	const accounts = await web3.eth.getAccounts();

	console.log(`Attempting to deploy from account: ${accounts[0]}`);

	const deployedToken = await new web3.eth.Contract(tokenABI)
		.deploy({
			data: '0x' + tokenBIN.toString(),
            arguments: [new BigNumber(10).pow(new BigNumber(process.env.TOKEN_DECIMALS)).mul(new BigNumber(process.env.TOKEN_CAP)), 
                web3.utils.toChecksumAddress(process.env.TOKEN_PREFUND_ADDRESS), 
                new BigNumber(10).pow(new BigNumber(process.env.TOKEN_DECIMALS)).mul(new BigNumber(process.env.TOKEN_PREFUND_AMOUNT)), 
                process.env.TOKEN_NAME, 
                process.env.TOKEN_SYMBOL, 
                process.env.TOKEN_DECIMALS]
        })
        .send({ from: accounts[0] });

    console.log(`Token was deployed at address: ${deployedToken.options.address}`);

    verify(process.env.ETHERSCAN_API_KEY, 
            deployedToken.options.address, 
            tokenSourceCode,
            'Token', 
            web3.eth.abi.encodeParameters(
                ['uint256', 'address', 'uint256', 'string', 'string', 'uint8'],
                    [new BigNumber(10).pow(new BigNumber(process.env.TOKEN_DECIMALS)).mul(new BigNumber(process.env.TOKEN_CAP)), 
                        web3.utils.toChecksumAddress(process.env.TOKEN_PREFUND_ADDRESS), 
                        new BigNumber(10).pow(new BigNumber(process.env.TOKEN_DECIMALS)).mul(new BigNumber(process.env.TOKEN_PREFUND_AMOUNT)), 
                        process.env.TOKEN_NAME, 
                        process.env.TOKEN_SYMBOL, 
                        process.env.TOKEN_DECIMALS]));

    const deployedCrowdsale = await new web3.eth.Contract(crowdsaleABI)
        .deploy({
            data: '0x' + crowdsaleBIN.toString(),
            arguments: [new BigNumber(10).pow(new BigNumber(process.env.TOKEN_DECIMALS)).div(new BigNumber(web3.utils.toWei(process.env.CROWDSALE_PRICE, 'ether'))),
                process.env.CROWDSALE_ADMIN_ADDRESS, 
                deployedToken.options.address, 
                process.env.CROWDSALE_OPENNING_TIME, 
                process.env.CROWDSALE_CLOSING_TIME],
        })
        .send({ from: accounts[0],
            });


    console.log(`Crowdsale was deployed at address: ${deployedCrowdsale.options.address}`);
    
    verify(process.env.ETHERSCAN_API_KEY,
            deployedCrowdsale.options.address,
            crowdsaleSourceCode,
            'CrowdsaleToken',
            web3.eth.abi.encodeParameters(
                ['uint256', 'address', 'address', 'uint256', 'uint256'],
                    [new BigNumber(10).pow(new BigNumber(process.env.TOKEN_DECIMALS)).div(new BigNumber(web3.utils.toWei(process.env.CROWDSALE_PRICE, 'ether'))),
                        process.env.CROWDSALE_ADMIN_ADDRESS, 
                        deployedToken.options.address, 
                        process.env.CROWDSALE_OPENNING_TIME, 
                        process.env.CROWDSALE_CLOSING_TIME]));

    deployedToken.methods.addMinter(deployedCrowdsale.options.address).send({ from: accounts[0] });

    provider.engine.stop();
    
})();