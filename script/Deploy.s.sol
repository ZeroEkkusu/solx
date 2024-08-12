// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.26;

import "@forge-std/Script.sol";

contract Delpoy is Script {
    function run() public {
        vm.broadcast(vm.promptSecretUint("Deployer private key"));
    }
}
