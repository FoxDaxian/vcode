export function getComponentName(path: string) {
    return path.split(window.path.sep).pop();
}
