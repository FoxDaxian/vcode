const noBreakSpace = ' ';

export function setSpace(count: number, base = 4) {
    return noBreakSpace.repeat(count * base);
}
