//-- Utilities
/** Converts an array of usernames into a dictionary usable for direct lookup.
 *
 * The provided value will be returned on lookup, used to identify different sources after merging lookup tables. */
function toLookup(lookupResult, accounts) {
    const lookup = {};
    for (const account of accounts) {
        for (const name of account.names) {
            lookup[name] = lookupResult;
        }
    }
    return lookup;
}

/** Selects elements whose direct children match another selector.
 *
 * An alternative to the :has() selector, which has minimal support. Fixed depth restriction allows for faster code. */
function* hasChild(selector, hasSelector) {
    const descendants = document.querySelectorAll(`${selector} ${hasSelector}`);
    for (const child of descendants) {
        // Navigate back up to the elements we want to select, return those
        yield child.parentElement;
    }
}

/** Select an ancestor of an element, going up the given number of levels. */
function ancestor(element, levels) {
    let current = element;
    for (let i = 0; i < levels; i++) {
        current = current.parentElement;
    }
    return current;
}

//-- Main extension code
const labels = {
    fake: createLabel({
        text: 'Kamu Profil',
        color: '#f00',
        contrast: '#fff',
        hide: false,
        source: "https://raw.githubusercontent.com/kamuprofil/rendorseg/main/data/fake.json",
    }),
    prop: createLabel({
        text: 'Propaganda',
        color: '#ff6a00',
        contrast: '#fff',
        hide: false,
        source: "https://raw.githubusercontent.com/kamuprofil/rendorseg/main/data/ner.json",
    })
}

const debugLabel = createLabel({
    text: 'Debug',
    color: '#f0f',
    contrast: '#000',
});

/** When enabled, applies a label to every element, regardless of URL. Useful for troubleshooting CSS selectors. */
const debugMode = false;

/** For each label ID, contains the list of targeted accounts (ID, names, notes) */
let accountData = {};

/** Maps account names to a label ID. */
let accountLookup = {};
async function initLabels() {
    for (const labelId in labels) {
        const labelConfig = labels[labelId];
        const accounts = await fetchJson(labelConfig.source);
        accountData[labelId] = accounts;
        const lookup = toLookup(labelId, accounts);
        Object.assign(accountLookup, lookup);
    }
}

async function init() {
    // Load built-in user lists
    try {
        // No lookups needed in debug mode
        if (!debugMode) {
            initLabels();
            initCollector();
        }
    } catch (err) {
        console.error("Error fetching tagged account list: " + err);
        return;
    }

    // Check DOM immediately, and every second
    processElements();
    setInterval(processElements, 1000);

    // Re-check DOM after each click (opening replies, etc)
    document.addEventListener('click', function() {
        // Wait for all other click handlers to be processed first
        setTimeout(processElements, 0);
    });
}

async function fetchJson(url) {
    const response = await fetch(url)
    return await response.json();
}

function createLabelElement(label) {
    const element = document.createElement('span');
    element.setAttribute('style', `
        background-color: ${label.color};
        color: ${label.contrast};
        padding: 0 4px;
        border-radius: 4px;
        margin-right: 4px;
    `);

    const text = document.createTextNode(`${label.text}`);
    element.appendChild(text);

    return element;
}
function addImageBorder(element, label) {
    element.setAttribute('style', `border: 3px solid ${label.color}; border-radius: 100%;`);
}

/** Create runtime data structures needed for rendering a label. */
function createLabel(config) {
    const template = createLabelElement(config);
    return {
        ...config,
        template,
    }
}

const profileUrlPattern = /^https:\/\/www\.facebook\.com\/profile\.php\?id=(\d+)/;
const aliasUrlPattern = /^https:\/\/www\.facebook\.com\/([a-zA-Z0-9.]+)/;
/** Takes a link and returns the account name / identifier part from it */
function extractAccountName(url) {
    // ID-based profile links
    const matches = url.match(profileUrlPattern);
    if (matches) {
        return matches[1];
    }
    // Name-based profile links
    const aliasMatches = url.match(aliasUrlPattern);
    if (aliasMatches) {
        return aliasMatches[1];
    }
    return null;
}

/** Determine what label an anchor element needs based on the link, and mark it as processed. */
function processAnchor(anchor) {
    if (debugMode) {
        anchor.setAttribute('data-has-label', 'debug');
        return debugLabel;
    }

    const accountName = extractAccountName(anchor.getAttribute('href'));
    const needsLabel = accountLookup[accountName];
    anchor.setAttribute('data-has-label', needsLabel ?? 'null');
    return labels[needsLabel];
}

const commentSelector = 'div ul div[role=article]';

/** Add labels to new comments on a post. */
function addCommentLabels() {
    // Add label to author names
    // TODO: Try to exclude links to comments here already
    const commentAuthors = hasChild(`${commentSelector} a[href]:not([data-has-label])`, `> span`);
    for (const comment of commentAuthors) {
        const matchingLabel = processAnchor(comment);
        if (matchingLabel) {
            const label = matchingLabel.template.cloneNode(true);
            comment.prepend(label);
        }
    }

    // Add highlight to author images
    const commentImages = hasChild(`${commentSelector} a[href]:not([data-has-label])`, `> div`);
    for (const anchor of commentImages) {
        const matchingLabel = processAnchor(anchor);
        if (matchingLabel) {
            addImageBorder(anchor, matchingLabel)
        }
    }
}

/** Adds labels to profiles show on the friends list. */
function processFriendsList() {
    // Find block containing friends list
    const friendsHeader = document.querySelector('span > a[href$=friends]');
    if (!friendsHeader) {
        return;
    }
    const friendsBlock = ancestor(friendsHeader, 7);

    // Add border to friend image
    const friendImages = friendsBlock.querySelectorAll('div > div > a[role=link]:not([data-has-label]) > img');
    for (const friendImage of friendImages) {
        const anchor = friendImage.parentElement;
        const matchingLabel = processAnchor(anchor);
        if (matchingLabel) {
            friendImage.setAttribute('style', `border: 3px solid ${matchingLabel.color};`);
        }
    }

    // Add tag next to username
    // TODO: Use extended hasChild with root node
    const friendNames = friendsBlock.querySelectorAll('div > div > a[role=link]:not([data-has-label]) > span:first-child');
    for (const friendName of friendNames) {
        const anchor = friendName.parentElement;
        const matchingLabel = processAnchor(anchor);
        if (matchingLabel) {
            const label = matchingLabel.template.cloneNode(true);
            anchor.prepend(label);
        }
    }
}

/** Main entry point, adds labels to all new elements.
 *
 * Elements that have already been processed get a 'data-has-label' attribute, and are ignored afterwards.
 * The relevant user info is extracted from the link an anchor element points to, and the user's corresponding label
 * is applied (if any).
 *
 * The relevant elements are identified based on the surrounding DOM structures, since IDs and class names are
 * machine generated, and not stable. So unfortunately we need some rather complicated selectors to find the elements
 * we need.
 */
function processElements() {
    addCommentLabels();
    processFriendsList();
    updateProfileData();
}

/** Lookup from account name to account data reference, containing only accounts with no ID */
const unknownIds = {};
/** Lookup from account ID to account data reference, containing only accounts with a known ID */
const accountsById = {};
// TODO: Wrap into namespace/module?
function initCollector() {
    // Create lookup used to check if we already have the ID for a profile with a given name
    for (const labelId in accountData) {
        const accounts = accountData[labelId];
        for (const account of accounts) {
            // Build lookup by ID
            if (account.id) {
                accountsById[account.id] = account;
            }
            // Build lookup by name for ID-less accounts
            else {
                for (const name of account.names) {
                    unknownIds[name] = account;
                }
            }
        }
    }
}

function updateProfileData() {
    // Check if we're on the profile page, process it if needed
    const userNameHeader = document.querySelector('span > div > h1:not([data-has-label])');
    if (!userNameHeader) {
        return;
    }

    // Mark page so we don't reprocess itt
    userNameHeader.setAttribute('data-has-label', 'null');

    // Get profile name and ID
    const profileName = window.location.pathname.slice(1);
    const id = findUserId();

    // Known name, new ID
    const relatedAccount = unknownIds[profileName];
    if (relatedAccount && !relatedAccount.id) {
        if (id) {
            relatedAccount.id = id;
            delete unknownIds[profileName];
            console.log(`### NEW ID: ${id} for account ${profileName}`);
        }
    }

    // Known ID, new name
    if (id) {
        const previousAccount = accountsById[id];
        if (previousAccount) {
            if (!previousAccount.names.includes(profileName)) {
                previousAccount.names.push(profileName);
                console.log(`### NEW NAME: ${profileName} for account ID ${id}`);
            }
        }
    }
}

const USER_ID_PATTERN = /"userVanity":"[a-zA-Z0-9.]+","userID":"(\d+)"/
/** Extracts the userID from the current page, from one of the script blocks. */
function findUserId() {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
        const text = script.innerText;
        const matches = text.match(USER_ID_PATTERN);
        if (matches) {
            return parseInt(matches[1], 10);
        }
    }
    return null;
}

init();
