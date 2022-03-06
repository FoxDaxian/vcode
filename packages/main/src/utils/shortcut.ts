export const isMac = process.platform === 'darwin';

export const alt = 'Alt';
export const shift = 'Shift';
export const ctrl = isMac ? 'Cmd' : 'Ctrl';


export const build = `${ctrl}+${shift}+b`;
