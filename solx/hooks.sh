# Override for 'forge build' and 'forge test'
forge() {
    if [ "$1" = "build" ]; then
        bun solx/transpiler.ts && command forge build "${@:2}"
    elif [ "$1" = "test" ]; then
        bun solx/transpiler.ts && command forge test "${@:2}"
    else
        command forge "$@"
    fi
}
