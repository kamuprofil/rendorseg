document.addEventListener("click", kamuProfil);
document.addEventListener("load",  kamuProfil, true);

async function getList() {
    var response;
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
    getList().then(resp => {
        for (var j = 0; j < resp.length; j++) {
            var name = resp[j];

            var spans = document.querySelectorAll('a[href*="' + name + '"]');
            if (spans.length > 0) {
                spans.forEach(sp => {
                    var prevStyle = sp.getAttribute("style");
                    if (prevStyle === undefined || prevStyle == null) {
                        sp.setAttribute("style", "color: red");

                        var lbl = document.createElement("span");
                        lbl.innerHTML = "Kamu Profil ";

                        sp.prepend(lbl);
                    }
                });
            }
        }
    });
}
