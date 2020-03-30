require('dotenv').config()

const { verify, getInfuraUrl } = require('./utils');

// Preparing wallet and web3 endpoint (Infura based)
const Web3 = require('web3');
const HDWalletProvider = require('truffle-hdwallet-provider');
const provider = new HDWalletProvider(process.env.PRIVATE_KEY, getInfuraUrl());
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

const exchangeFactoryABI = JSON.parse(fs.readFileSync('./abi/ExchangeFactory.abi', 'utf8'));
const exchangeABI = JSON.parse(fs.readFileSync('./abi/Exchange.abi', 'utf8'));

(async () => {

	const accounts = await web3.eth.getAccounts();

	console.log(`Attempting to deploy from account: ${accounts[0]}`);


    // Deploying ERC20 Token
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

    // Verify ERC20 Token contract
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

    // Deploying Crowdsale
    const deployedCrowdsale = await new web3.eth.Contract(crowdsaleABI)
        .deploy({
            data: '0x' + crowdsaleBIN.toString(),
            arguments: [new BigNumber(10).pow(new BigNumber(process.env.TOKEN_DECIMALS)).div(new BigNumber(web3.utils.toWei(process.env.CROWDSALE_PRICE, 'ether'))),
                process.env.CROWDSALE_ADMIN_ADDRESS, 
                deployedToken.options.address, 
                process.env.CROWDSALE_OPENNING_TIME, 
                process.env.CROWDSALE_CLOSING_TIME],
        })
        .send({ from: accounts[0] });


    console.log(`Crowdsale was deployed at address: ${deployedCrowdsale.options.address}`);
    
    // Verify Crowdsale contract
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

    // Adding Crowdsale contract as ERC20 Minter
    await deployedToken.methods.addMinter(deployedCrowdsale.options.address).send({ from: accounts[0] });

    // Creating & Retrieving exchange contract for the ERC20 Token
    const exchangeFactory = new web3.eth.Contract(exchangeFactoryABI, process.env.EXCHANGE_FACTORY_ADDRESS);
    await exchangeFactory.methods.createExchange(deployedToken.options.address).send({ from: accounts[0] });
    let tokenExchangeAddress = await exchangeFactory.methods.getExchange(deployedToken.options.address).call({ from: accounts[0] });

    console.log(`Exchange created at address ${tokenExchangeAddress}`);


    // Allowing to add initial token supply to the exchange
    await deployedToken.methods.approve(
        tokenExchangeAddress, 
        new BigNumber(10).pow(new BigNumber(process.env.TOKEN_DECIMALS)).mul(new BigNumber(process.env.EXCHANGE_LIQUIDITY))
    ).send({ from: accounts[0] });
    
    // Adding liquidity to the exchange contract
    const exchange = new web3.eth.Contract(exchangeABI, tokenExchangeAddress);
    await exchange.methods.addLiquidity(
        1, 
        new BigNumber(10).pow(new BigNumber(process.env.TOKEN_DECIMALS)).mul(new BigNumber(process.env.EXCHANGE_LIQUIDITY)),
        process.env.EXCHANGE_DEADLINE
    ).send({ value: web3.utils.toWei(process.env.CROWDSALE_PRICE, 'ether'), from: accounts[0] });

    console.log(`Liquidity added to exchange ${tokenExchangeAddress}`)

    provider.engine.stop();
    
})();