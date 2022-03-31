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

//-- Main extension code
const labels = {
    fake: createLabel({
        text: 'Kamu Profil',
        color: '#f00',
        contrast: '#fff',
        hide: false,
    }),
    prop: createLabel({
        text: 'Propaganda',
        color: '#ff6a00',
        contrast: '#fff',
        hide: false,
    })
}

let accountLookup = {}
async function init() {
    const fakeAccounts = toLookup('fake', await getList());
    accountLookup = {
        // Add more user lists here...
        ...fakeAccounts,
    };

    // Check DOM immediately, and every second
    addCommentLabels();
    setInterval(addCommentLabels, 1000);

    // Re-check DOM after each click (opening replies, etc)
    document.addEventListener('click', function() {
        // Wait for all other click handlers to be processed first
        setTimeout(addCommentLabels, 0);
    });
}

async function getList() {
    let response;
    try {
        response = await fetch("https://raw.githubusercontent.com/kamuprofil/rendorseg/main/lista.json")
    } catch (e) {
        console.error("Error fetching fake account list - " + e);
        return [];
    }
    if (!response.ok) {
        console.error("Error fetching fake account list - " + response.statusText);
        return [];
    }

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
    const accountName = extractAccountName(anchor.getAttribute('href'));
    const needsLabel = accountLookup[accountName];
    anchor.setAttribute('data-has-label', needsLabel ?? 'null');
    return needsLabel;
}

const commentSelector = 'div ul div[role=article]';

/** Adds labels to all new elements.
 *
 * Elements that have already been processed get a 'data-has-label' attribute, and are ignored afterwards.
 * The relevant user info is extracted from the link an anchor element points to, and the user's corresponding label
 * is applied (if any).
 */
function addCommentLabels() {
    // Add label to author names
    // TODO: Try to exclude links to comments here already
    const commentAuthors = hasChild(`${commentSelector} a[href]:not([data-has-label])`, `> span`);
    for (const comment of commentAuthors) {
        const needsLabel = processAnchor(comment);
        if (needsLabel) {
            const label = labels[needsLabel].template.cloneNode(true);
            comment.prepend(label);
        }
    }

    // Add highlight to author images
    const commentImages = hasChild(`${commentSelector} a[href]:not([data-has-label])`, `> div`);
    for (const anchor of commentImages) {
        const needsLabel = processAnchor(anchor);
        if (needsLabel) {
            addImageBorder(anchor, labels[needsLabel])
        }
    }
}

init();
