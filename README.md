# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
``` ps aux | grep hardhat kill -9 pid ```

# Incluir

Deben incluir README con:
Breve introducción del proyecto.
Cuál es el objetivo o qué problema busca resolver.
Instrucciones precisas para su testing, deploy y uso.









#Up the node of the fork mainnet 
npx hardhat node 
#Test with the fork mainet
npx hardhat test --network localhost test/FlashLoan.ts 
#Connect to the console HardHat
npx hardhat console --network localhost

#Deploy and transfer usdc 
npx hardhat run --network localhost scripts/getDai.ts 

#PoolAddressesProvider-Aave Goerli 
0xc4dCB5126a3AfEd129BC3668Ea19285A9f56D15D

#USDC contract
0x9FD21bE27A2B059a288229361E2fA632D8D2d074

#Youtube
https://www.youtube.com/watch?v=MxTgk-kvtRM
#Github
https://github.com/stakewithus/defi-by-example


#Datos Curiosos 

Quisimos hacer un flashLoan del pool de DAI/WETH 


Aprendizajes
Y despues hacer un swap en el mismo pool de DAI/WETH   --> Tuvimos un problema ya que al usar el mismo pair pool, esta bloqueado para que no puedas llamar 
                                                            al mismo pool, tiene un guard de reentrancy. 
                                                            
                                                            
                                                            
Usar Version aave v3 para hacer flashloans --> no tienen deploy en mainnet, solo en sidechains. El fork lo teniamos en la mainnet, incluido el swap de UniSwap
Usar Version aave v2 para hacer flashloans --> Tenian version 0.6.12 en los smart contracts lo cual no permitia compilar con la version ^0.8 que usabamos en el proyecto.


Usamos Flashloan con v2 de uniswap--> Funciono perfecto
