# SOLX

Write Solidity AND **any other programming language** <ins>at the same time</ins> in Foundry tests and scripts!

<img src="./demo.gif"></img>

## Usage

> [!CAUTION]
> This is an experimental proof of concept. Do not use in development or production environments.
> SOLX is designed to work exclusively in Foundry's local EVM and <ins>cannot be used for actual smart contracts</ins>.

<details>
<summary><b>I have read and understood the above warning. Show me the usage instructions.</b></summary>

<br>

**Clone**

```shell
git clone https://github.com/ZeroEkkusu/solx
```

**Install**

```shell
soldeer install & bun install
```

**Hook**

```
source solx/hooks.sh
```

**Build**

```shell
forge build
```

**Test**

```shell
forge test
```

**Experiment**

[Playground ↗](./test/Example.solx)

Sync variables between Solidity and TypeScript:

```solidity
uint256 a;
// @typescript-start (uint256 a)
a++;
// @typescript-end ()
assertEq(a, 1);
```

Clone variables from TypeScript:

```solidity
uint256 a = 1;
// @typescript-start ()
const b = 1;
// @typescript-end (uint256 b)
assertEq(a, b);
```

`console.log` in TypeScript:

```solidity
// @typescript-start ()
console.log("solx");
// @typescript-end ()
```

Only TypeScript is supported currently.

</details>

## License
​
Licensed under either of

- Apache License, Version 2.0, ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

at your option.

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.

---

© 2024 Zero Ekkusu