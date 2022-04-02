const USER_ID_PATTERN = /"userVanity":"[a-zA-Z0-9.]+","userID":"(\d+)"/
/** Extracts the userID from the current page, from one of the script blocks. */
function findUserId() {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
        const text = script.innerText;
        const matches = text.match(USER_ID_PATTERN);
        if (matches) {
            return matches[1];
        }
    }
    return null;
}
