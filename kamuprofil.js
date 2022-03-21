document.addEventListener("click", kamuProfil);
document.addEventListener("load",  kamuProfil, true);

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

function kamuProfil() {
    getList().then(fakeAccounts => {
        for (const name of fakeAccounts) {
            const spans = document.querySelectorAll('a[href*="' + name + '"]');
            for (const sp of spans) {
                const prevStyle = sp.getAttribute("style");
                if (prevStyle === undefined || prevStyle == null) {
                    sp.setAttribute("style", "color: red");

                    const lbl = document.createElement("span");
                    lbl.innerHTML = "Kamu Profil ";

                    sp.prepend(lbl);
                }
            }
        }
    });
}
