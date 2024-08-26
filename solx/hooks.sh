# Override for 'forge build', 'forge test', 'forge b', and 'forge t'
forge() {
    if [ "$1" = "build" ] || [ "$1" = "b" ]; then
        bun solx/transpiler.ts && command forge build "${@:2}"
    elif [ "$1" = "test" ] || [ "$1" = "t" ]; then
        bun solx/transpiler.ts && command forge test "${@:2}"
    else
        command forge "$@"
    fi
}
