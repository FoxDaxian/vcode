let rootCom: Element | null = null;

interface MD {
    rootCom?: Element | null;
}

export const memoData = {} as MD;

import.meta.hot?.on('vite:beforeUpdate', () => {
    const timer = setInterval(function () {
        if (rootCom !== document.querySelector('.virtual-browser .main')) {
            rootCom = document.querySelector('.virtual-browser .main');
            clearInterval(timer);
        }
    }, 30);
});

Object.defineProperty(memoData, 'rootCom', {
    get() {
        if (rootCom) {
            return rootCom;
        }
        rootCom = document.querySelector('.virtual-browser .main');
        return rootCom;
    }
});
