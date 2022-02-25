export const setItem = (key, val) => {
    try {
        window.localStorage.setItem(key, val);
    } catch (e) {
        console.warn(e);
    }
};

export const getItem = (key) => {
    try {
        return window.localStorage.getItem(key);
    } catch (e) {
        console.warn(e);
        return null;
    }
};
