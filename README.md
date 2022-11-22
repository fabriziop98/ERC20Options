# OptionTrigger
Github:
https://github.com/fabriziop98/ERC20Options

EtherScan:
ERC20Pool:
https://goerli.etherscan.io/address/0x6D5993F08bf89ea3F3Fb5c30635e87583d6211Ad#code
OptionContract:
https://goerli.etherscan.io/address/0xf3a705d4128352aD5174712F41Fb221f0c510524#code

OptionTrigger is a blockchain protocol that connects two Peers: a buyer and a seller in the interaction and operation of Options contracts for any compatible ERC20 token.

The protocol uses an American based Option that allows holders to exercise their rights
at any time before and including the expiration date.

A peer can:
- Sell (offer) a CALL or PUT option of any ERC20 Token with the following attributes:
 - ERC20 token which is being offered
 - ERC20 token on which the premium and strike / exercise is payed for 
 - Expiration date of the option
 - Premium amount

Any Option will have the following states, which are validated in every operation that is being done with any Option:
- New
- Locked
- Exercised
- Expired
- Canceled

The attributes of any Option:
- state
- seller
- buyer
- strike
- amount
- premium
- expiration
- optionType
- paymentToken
- optionToken
- fee

Objective:

The objective of the protocol is to give full independence to both buyer and seller to create or exercise options with ANY ERC20 token, as long as there's a buyer, there's a posible Option to be sold.

In the v2 of the protocol, the posibility of applying flash loans to the exercising of any option will be posible, where if the buyer of any option doesn't hold the necesary ammount for the contract to be exercised, a flashloan for the payment of the option token will take place, and the buyer of the option will only receive the surplus of the investment, giving the opportunity to the buyer to access to any Option being sold as long as the buyer holds the necesary ammount of premium token.

Testing and deployment: 
Remix guide for use of OptionContract:
https://docs.google.com/document/d/1eIWe5JqQRbY72jeTpuCTnGRMsKrspNiSyukZyh9D2r8

For running unit test (OptionContract without flashloan and ERC20Pool contracts):
npx hardhat test

For running unit test (OptionContract with flashloan):
#Up the node of the fork mainnet 
npx hardhat node 
#Test with forked mainnet
npx hardhat test --network localhost test/FlashLoan.ts 
#Connect to the HardHat console
npx hardhat console --network localhost

#Deploy and transfer usdc 
npx hardhat run --network localhost scripts/UniSwap-SwapV3.ts 

#PoolAddressesProvider-Aave Goerli 
0xc4dCB5126a3AfEd129BC3668Ea19285A9f56D15D

#USDC contract
0x9FD21bE27A2B059a288229361E2fA632D8D2d074

#Youtube
https://www.youtube.com/watch?v=MxTgk-kvtRM
#Github
https://github.com/stakewithus/defi-by-example

For deploying contracts:
npx hardhat run --network goerli scripts/deploy-ERC20Pool.ts
npx hardhat run --network goerli scripts/deploy-OptionTrigger.ts

For verifying:
npx hardhat verify --network goerli <contract address> --contract contracts/ERC20Pool.sol:ERC20Pool
npx hardhat verify --network goerli <contract address> --contract contracts/OptionTrigger.sol:OptionTrigger <ERC20Pool contract addess>

Aditional docs
https://drive.google.com/drive/u/2/folders/1GsOYjR3z86Wtfk0WorzU1kkQO_hGSzUh

#Español
#Datos Curiosos 

Quisimos hacer un flashLoan del pool de DAI/WETH 

Aprendizajes
Y despues hacer un swap en el mismo pool de DAI/WETH   --> Tuvimos un problema ya que al usar el mismo pair pool, esta bloqueado para que no puedas llamar al mismo pool, tiene un guard de reentrancy. 
                                                            
Usar Version aave v3 para hacer flashloans --> no tienen deploy en mainnet, solo en sidechains. El fork lo teniamos en la mainnet, incluido el swap de UniSwap
Usar Version aave v2 para hacer flashloans --> Tenian version 0.6.12 en los smart contracts lo cual no permitia compilar con la version ^0.8 que usabamos en el proyecto.

Usamos Flashloan con v2 de uniswap--> Funcionó perfecto