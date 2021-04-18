let gh_org = "asftest";
let gh_client_id = '8c54a8ee6f5be892bb41';
let state = Math.random().toString(20).substr(2, 6) + Math.random().toString(20).substr(2, 6) + Math.random().toString(20).substr(2, 6);
let hostname = location.hostname;


let txt = (a) => document.createTextNode(a);
let br = (a) => document.createElement('br');
let h2 = (a) => {let x = document.createElement('h2'); x.innerText = a ? a : ""; return x}


function blurbg(blur = false) {
    if (blur) document.body.setAttribute("class", "blurbg");
    else  document.body.setAttribute("class", "");
}

async function POST(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data)
    });
    return response.json();
}

async function GET(url = '') {
    const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
    });
    return response.json();
}

function logout() {
    GET("/api/preferences?logout=true").then(() => location.href = '/');
}

function check_github_invite(canvas) {
    GET("/api/preferences.json").then((js) => {
        if (js.credentials.github_org_member) {
            canvas.innerText = "GitHub organization invite recorded! Hang tight, we're loading things for you...";
            window.setTimeout(() => { location.search = ''; location.reload();}, 4000);
        } else {
            window.setTimeout(() => { check_github_invite(canvas); }, 10000);
        }
    });
}


function invite_github(canvas) {
    GET("/api/invite").then(
        (js) => {
            if (js.okay) {
                canvas.innerHTML = "";
                init_step(canvas, 2)
                canvas.appendChild(h2("GitHub Organization Membership"))
                canvas.appendChild(txt("An invitation has been sent to your email address. You may also review it here: "));
                let a = document.createElement("a");
                a.setAttribute("href", `https://github.com/orgs/${gh_org}/invitation`);
                a.setAttribute("target", "_new");
                a.innerText = "Review invitation";
                canvas.appendChild(a);
                let p = document.createElement('p');
                p.appendChild(txt("Once you have accepted your invitation, the Boxer service will start including you in the teams you have been assigned to. "));
                p.appendChild(br());
                p.appendChild(txt("It may take up to five minutes before this happens. This page will reload once your invitation has been recorded as accepted, sit tight..."));
                canvas.appendChild(p);
                let loader = document.createElement('div');
                loader.setAttribute('class', 'loader');
                canvas.appendChild(loader);
                check_github_invite(canvas);
            } else {
                if (js.reauth === true) {
                    canvas.innerText = "It looks like something went wrong with the invitation. You have likely previously been a member of the organization and then left. To fix this, we'll need to re-authenticate you on GitHub. Please hang on while we sort that out....";
                    window.setTimeout(() => { location.search = ''; location.reload();}, 3000);
                }
                else {
                    canvas.innerText = "Oops! Something went wrong, you may already have an invitation pending."
                }
            }
        }
    )
}

function show_page_github_invite(canvas) {
    init_step(canvas, 2)
    canvas.appendChild(h2("GitHub Organization Membership"))
    canvas.appendChild(txt("You do not appear to be a part of the Apache GitHub organization yet. "))
    canvas.appendChild(document.createElement('br'));
    canvas.appendChild(document.createElement('br'));
    let a = document.createElement("button");
    a.addEventListener("click", () => invite_github(canvas));
    a.innerText = "Send GitHub Invitation!";
    canvas.appendChild(document.createTextNode('Click this button receive an invitation so you can gain write-access on GitHub: '));
    canvas.appendChild(a);

}

function show_page_profile(canvas, login) {
    canvas.innerText = "";
    init_step(canvas, 5);

    let card = document.createElement('div');
    card.setAttribute('id', "card");

    let avatar = document.createElement('img');
    avatar.setAttribute('src', `https://github.com/${login.github.login}.png`);
    avatar.setAttribute('class', 'avatar');
    card.appendChild(avatar);

    let name = document.createElement('h1');
    name.innerText = login.credentials.fullname;
    card.appendChild(name);

    card.appendChild(document.createElement('hr'));

    let boxerstatus = document.createElement('table');
    boxerstatus.style.border = "none";
    boxerstatus.style.width = "95%"

    // ASF Auth
    if (login.credentials.uid) {
        let tr = document.createElement('tr');
        let icon = document.createElement('td');
        icon.style.textAlign = 'center';
        let iconimg = document.createElement('img');
        iconimg.setAttribute('src', 'images/asf.png');
        iconimg.style.height = '24px';
        icon.appendChild(iconimg);
        let txt = document.createElement('td');
        txt.innerText = `Authed at ASF as: ${login.credentials.uid}`;
        tr.appendChild(icon);
        tr.appendChild(txt);
        boxerstatus.appendChild(tr);
    }

    // GitHub Auth
    if (login.github.login) {
        let tr = document.createElement('tr');
        let icon = document.createElement('td');
        icon.style.textAlign = 'center';
        let iconimg = document.createElement('img');
        iconimg.setAttribute('src', 'images/github.png');
        iconimg.style.height = '24px';
        icon.appendChild(iconimg);
        let txt = document.createElement('td');
        txt.innerText = `Authed at GitHub as: ${login.github.login}`;
        tr.appendChild(icon);
        tr.appendChild(txt);
        boxerstatus.appendChild(tr);
    }

    // GitHub MFA
    if (login.github.mfa) {
        let tr = document.createElement('tr');
        let icon = document.createElement('td');
        icon.style.textAlign = 'center';
        let iconimg = document.createElement('img');
        iconimg.setAttribute('src', 'images/mfa_enabled.png');
        iconimg.style.height = '24px';
        icon.appendChild(iconimg);
        let txt = document.createElement('td');
        txt.innerText = "GitHub MFA status: Enabled";
        tr.appendChild(icon);
        tr.appendChild(txt);
        boxerstatus.appendChild(tr);
    } else {
        let tr = document.createElement('tr');
        let icon = document.createElement('td');
        icon.style.textAlign = 'center';
        let iconimg = document.createElement('img');
        iconimg.setAttribute('src', 'images/mfa_disabled.png');
        iconimg.style.height = '24px';
        icon.appendChild(iconimg);
        let txt = document.createElement('td');
        txt.innerText = "GitHub MFA status: DISABLED";
        tr.appendChild(icon);
        tr.appendChild(txt);
        boxerstatus.appendChild(tr);
    }


    card.appendChild(boxerstatus);

    canvas.appendChild(card);

    if (login.github.mfa) {
        if (login.github.repositories.length > 0) {
            let ul = document.createElement('ul');
            ul.setAttribute('class', 'striped');
            canvas.appendChild(ul);
            ul.innerText = "You have write access to the following repositories:";
            login.github.repositories.sort();
            for (let i = 0; i < login.github.repositories.length; i++) {
                let repo = login.github.repositories[i];
                let a = document.createElement('a');
                let link = `https://github.com/${gh_org}/${repo}`;
                a.setAttribute("href", link);
                a.innerText = link;
                let li = document.createElement('li');
                li.appendChild(a);
                ul.appendChild(li);
            }
        } else {
            canvas.appendChild(document.createTextNode("You do not appear to have access to any git repositories right now."));
        }
    } else {
        canvas.appendChild(document.createTextNode("You need to enable multi-factor authentication at GitHub to get write access to repositories there."));
        let a = document.createElement('a');
        a.setAttribute('href', 'https://github.com/settings/security');
        a.setAttribute('target', '_new');
        a.innerText = "GitHub Account Security";
        canvas.appendChild(document.createElement('br'));
        canvas.appendChild(document.createTextNode("Please follow this link to set it up: "));
        canvas.appendChild(a);
        canvas.appendChild(document.createElement('br'));
        canvas.appendChild(document.createTextNode("It may take up to five minutes for Boxer to recognize your MFA being enabled."));
    }
}

function init_step(canvas, step) {

    canvas.innerHTML = "";

    let header = document.createElement('h1');
    header.style.textAlign = "center";
    header.style.width = "100%";
    let verified = document.createElement('img');
    verified.setAttribute('src', `images/v_step${step}.png`);
    verified.style.width = "600px";
    header.appendChild(verified);
    canvas.appendChild(header);
}

async function prime() {

    let canvas = document.getElementById('main');

    let formdata = {};
    let matches = location.search.match(/[^?=&]+=[^&]+/g);
    if (matches) {
        matches.reduce((acc, value) => {
                let a = value.split("=", 2);
                formdata[a[0]] = decodeURIComponent(a[1]);
            }, 10
        );
    }
    // Fetch prefs, see if we're authed
    let login = await GET("/api/preferences.json");

    // If OAuth call, bypass the prefs check
    if (formdata.action == "oauth") {
        oauth = await POST("/api/oauth.json", formdata);
        if (oauth.okay) {
            location.href = "boxer.html";
            return
        } else {
            alert("Something went wrong... :(");
        }
    }

    // Otherwise, if not logged in yet, go to OAuth
    else if (!login.credentials.uid) {
        let oauth_url = encodeURIComponent(`https://${hostname}/boxer.html?action=oauth&state=` + state);
        location.href = "https://oauth.apache.org/auth?redirect_uri=" + oauth_url + "&state=" + state;
        return
    }




    // Not authed via GitHub yet
    if (!login.github || !login.github.login) {
        init_step(canvas, 1)
        canvas.appendChild(h2("Authenticate on GitHub"))
        canvas.appendChild(txt("Please authenticate yourself on GitHub to proceed. This will ensure we know who you are in GitHub, and can invite you to the organization in case you are not apart of Apache on GitHub yet: "))
        canvas.appendChild(document.createElement('br'));
        let a = document.createElement("button");
        a.addEventListener("click", begin_oauth_github);
        a.innerText = "Authenticate with GitHub";
        canvas.appendChild(a);
        return
    }

    // Authed via GitHub but not in Apache Org yet
    if (login.credentials && !login.credentials.github_org_member) {
        show_page_github_invite(canvas);
        return
    }
    // Authed via GitHub but not linked
    if (!login.github || login.credentials.github_login != login.github.login) {
        canvas.innerText = `You are authed on GitHub as ${login.credentials.github_login}, but this account has not been linked to your Apache account yet.`;
        return
    }

    if (!login.github.mfa) {
        canvas.innerHTML = "";
        init_step(canvas, 3)
        canvas.appendChild(h2("Multi-factor Authentication Check"))
        canvas.appendChild(txt("You do not appear to have enabled Multi-factor Authentication (MFA) on GitHub yet. "));
        canvas.appendChild(br());
        canvas.appendChild(txt("Please enable this and reload this page, as we cannot grant write access to GitHub repositories to accounts without MFA enabld."));
        canvas.appendChild(br());
        canvas.appendChild(txt("If you already have MFA enabled, it may take up to five minutes for the Boxer service to recognize it."));
        return
    }

    if (!formdata.action || formdata.action == 'preferences') show_page_profile(canvas, login);
}



function begin_oauth_github() {
    let oauth_url = encodeURIComponent(`https://${hostname}/boxer.html?action=oauth&key=github&state=` + state);
    let ghurl = `https://github.com/login/oauth/authorize?client_id=${gh_client_id}&redirect_uri=${oauth_url}&scope=read%3Aorg%2C%20repo`;
    console.log(ghurl);
    location.href = ghurl;
}