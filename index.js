const ethers = require("ethers");
const fs = require('fs');
const ics = require('ics');
require('dotenv').config();

// Setup the providers
const ethereumProvider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
const avalancheProvider = new ethers.providers.JsonRpcProvider(process.env.AVALANCHE_RPC_URL);
const fantomProvider = new ethers.providers.JsonRpcProvider(process.env.FANTOM_RPC_URL);

// XEN contract address
const XEN_ADDRESS_ETHEREUM  = "0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8";
const XEN_ADDRESS_AVALANCHE = "0xC0C5AA69Dbe4d6DDdfBc89c0957686ec60F24389";
const XEN_ADDRESS_FANTOM    = "0xeF4B763385838FfFc708000f884026B8c0434275";

const contractAbi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function userMints(address user) view returns (address, uint256, uint256, uint256, uint256, uint256)",
]

const xenEthereumContract = new ethers.Contract(XEN_ADDRESS_ETHEREUM, contractAbi, ethereumProvider);
xenEthereumContract.blockchain = "Ethereum";
xenEthereumContract.urlPath = "mainnet"

const xenAvalancheContract = new ethers.Contract(XEN_ADDRESS_AVALANCHE, contractAbi, avalancheProvider);
xenAvalancheContract.blockchain = "Avalanche";
xenAvalancheContract.urlPath = "avalanche";

const xenFantomContract = new ethers.Contract(XEN_ADDRESS_FANTOM, contractAbi, fantomProvider);
xenFantomContract.blockchain = "Fantom";
xenFantomContract.urlPath = "fantom";

// Read lines from accounts.txt and store as array
const accounts = fs.readFileSync('accounts.txt').toString().split("\n");

const getMintData = (mintData, contract) => {
    [account, term, maturityTs, rank, amplifier, eaaRate] = mintData;
    if (account !== "0x0000000000000000000000000000000000000000") {
        console.log(`Account: ${account}. Term: ${term}. Maturity ${maturityTs}`);
        console.log(`Unlock date: ${new Date(maturityTs * 1000)}`);
        const timestamp = new Date(maturityTs * 1000)
            .toISOString()
            .split(/[-T:.]/)
            .map((x) => parseInt(x))
            .splice(0, 6);
        return {
            title: `XEN Unlock for ${account} (${contract.blockchain})`,
            start: timestamp,
            startInputType: 'utc',
            duration: { minutes: 30 },
            description: `XEN Mint Unlock for ${account} on ${contract.blockchain}`,
            location: 'XEN',
            url: `https://xen.network/${contract.urlPath}/mint`,
            status: 'CONFIRMED'
        }
    }
};

const main = async () => {
    const events = [];
    for (const contract of [xenEthereumContract, xenAvalancheContract, xenFantomContract]) {
        console.log(`Getting mint data for ${contract.blockchain}...`);
        const promises = accounts.map(async (account) => {
             const mintData = await contract.userMints(account);
             return getMintData(mintData, contract);
        });

        let unlockEvents = await Promise.all(promises);
        unlockEvents = unlockEvents.filter((event) => event !== undefined);
        console.log(`Adding ${unlockEvents.length} events for ${contract.blockchain}`);
        events.push(...unlockEvents);
    }
    const {error, value} = ics.createEvents(events);
    if (error) {
        console.error("There was an error attempting to generate the events...");
        console.error(error);
        return;
    }
    fs.writeFileSync('xen-unlocks.ics', value);
};

main().then(() => {
    console.log("Finished processing all accounts.");
});