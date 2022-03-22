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

function createLabelElement() {
    const element = document.createElement('span');
    const text = document.createTextNode('Kamu Profil ');
    element.appendChild(text);
    element.setAttribute('style', 'color: red');
    return element;
}

function addCommentLabels() {
    for (const name of fakeAccounts) {
        const commentSelector = 'div ul div[role=article]';
        const commentAuthors = document.querySelectorAll(`${commentSelector} a[href*="${name}"] > span`);
        for (const commentAuthor of commentAuthors) {
            const comment = commentAuthor.parentNode;
            const hasLabel = comment.getAttribute('data-has-label');
            if (!hasLabel) {
                comment.setAttribute('data-has-label', 'fake');
                const label = createLabelElement();
                comment.prepend(label);
            }
        }
    }
}

init();
