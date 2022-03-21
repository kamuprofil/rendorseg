document.addEventListener("click", addCommentLabels);

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

function addCommentLabels() {
    for (const name of fakeAccounts) {
        const comments = document.querySelectorAll('div ul div[role=article] a[href*="' + name + '"]');
        for (const comment of comments) {
            const style = comment.getAttribute("style");
            if (style === undefined || style == null) {
                comment.setAttribute("style", "color: red");

                const label = document.createElement("span");
                label.innerHTML = "Kamu Profil ";

                comment.prepend(label);
            }
        }
    }
}

init();
