import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";


import { CCIPLocalSimulator, CrossChainNameServiceRegister, CrossChainNameServiceReceiver, CrossChainNameServiceLookup } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


describe("CrossChainNameService", function (){
      let alice: SignerWithAddress;


async function deployFixture(){

    const ccipLocalSimulatorFactory = await hre.ethers.getContractFactory("CCIPLocalSimulator");
    const ccipLocalSimulator : CCIPLocalSimulator = await ccipLocalSimulatorFactory.deploy();


 // 1.  Get signer accounts
  const [deployer, aliceSigner] = await hre.ethers.getSigners();
  alice = aliceSigner;


 //2.    Call the configuration() function to get Router contract address.

    const config: {
        chainSelector_: bigint;
        sourceRouter_: string;
        destinationRouter_: string;
        wrappedNative_: string;
        linkToken_: string;
        ccipBnM_: string;
        ccipLnM_: string;
      } = await ccipLocalSimulator.configuration();


    


   // 3.    Create instances of CrossChainNameServiceRegister.sol, 
    //   CrossChainNameServiceReceiver.sol and CrossChainNameServiceLookup.sol 
    //   smart contracts and 

const crossChainNameServiceRegisterFactory = 
await hre.ethers.getContractFactory("CrossChainNameServiceRegister");


const crossChainNameRegister : CrossChainNameServiceRegister = 
await crossChainNameServiceRegisterFactory.deploy(
    config.sourceRouter_,
    config.linkToken_
);


const crossChainNameServiceReceiverFactory = 
await hre.ethers.getContractFactory("CrossChainNameServiceReceiver");


const crossChainReceiver : CrossChainNameServiceReceiver = 
await crossChainNameServiceReceiverFactory.deploy(
config.destinationRouter_,
alice.address,
1
);



// 4.   config.sourceRouter_,
// config.destinationRouter_,
// alice.address

const crossChainServiceLookupFactory = 
await hre.ethers.getContractFactory("CrossChainNameServiceLookup");

const crossChainLookUp : CrossChainNameServiceLookup = await crossChainServiceLookupFactory.deploy();


return { ccipLocalSimulator, config, crossChainNameRegister, crossChainReceiver, crossChainLookUp };

};

it("LOOKUP ADDRESS SHOULD BE SAME AS SAME AS ALICE EOA",async function (){
  
const { ccipLocalSimulator, config, crossChainNameRegister, crossChainReceiver, crossChainLookUp } = await loadFixture(
        deployFixture
      );
const senderAdress  = await crossChainNameRegister.signer.getAddress();;
const receiverAdress = await crossChainReceiver.signer.getAddress();


// call the enableChain() 
// function where needed.

await crossChainNameRegister.enableChain(config.chainSelector_, 
    receiverAdress,5_000_000_000_000_000_000n )


    // Call the setCrossChainNameServiceAddress 
    // function of the CrossChainNameServiceLookup.sol 
    // smart contract "source" instance and provide the address of the 
    // CrossChainNameServiceRegister.sol smart contract instance. 
    // Repeat the process for the CrossChainNameServiceLookup.sol 
    // smart contract "receiver" instance and provide the address of 
    // the CrossChainNameServiceReceiver.sol smart contract instance. 

 await crossChainLookUp.setCrossChainNameServiceAddress(senderAdress);
 await crossChainLookUp.setCrossChainNameServiceAddress(receiverAdress);
    
//  Call the register() function and provide “alice.ccns” 
//  and Alice’s EOA address as function arguments.


const aliceName = "alice.ccns";
await crossChainLookUp.register(aliceName, alice.address);

// Call the lookup() function and provide “alice.ccns” as a function argument. 
// Assert that the returned address is Alice’s EOA address.

const lookedUpAddr = await crossChainLookUp.lookup(aliceName);
expect(lookedUpAddr).to.equal(alice.address);
console.log(lookedUpAddr);
console.log(alice.address);

})
});