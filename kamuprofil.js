document.addEventListener("click", addCommentLabels);
document.addEventListener("load",  addCommentLabels, true);

let fakeAccounts = [];

async function init() {
    fakeAccounts = await getList();
    addCommentLabels();
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

const fakeLabel = {
    text: 'Kamu Profil',
    color: '#f00',
    contrast: '#fff',
};
const labelTemplate = createLabelElement(fakeLabel);

function addCommentLabels() {
    for (const name of fakeAccounts) {
        const commentSelector = 'div ul div[role=article]';

        // Add label to author names
        const commentAuthors = document.querySelectorAll(`${commentSelector} a[href*="${name}"] > span`);
        for (const commentAuthor of commentAuthors) {
            const comment = commentAuthor.parentNode;
            const hasLabel = comment.getAttribute('data-has-label');
            if (!hasLabel) {
                comment.setAttribute('data-has-label', 'fake');
                const label = labelTemplate.cloneNode(true);
                comment.prepend(label);
            }
        }

        // Add highlight to author images
        const commentImages = document.querySelectorAll(`${commentSelector} a[href*="${name}"] > div`);
        for (const commentImage of commentImages) {
            const anchor = commentImage.parentNode;
            const hasLabel = anchor.getAttribute('data-has-label');
            if (!hasLabel) {
                anchor.setAttribute('data-has-label', 'fake');
                addImageBorder(anchor, fakeLabel)
            }
        }
    }
}

init();
