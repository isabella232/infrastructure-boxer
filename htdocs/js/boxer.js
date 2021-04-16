let gh_org = "asftest";
let gh_client_id = '8c54a8ee6f5be892bb41';
let state = Math.random().toString(20).substr(2, 6) + Math.random().toString(20).substr(2, 6) + Math.random().toString(20).substr(2, 6);

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
                canvas.innerText = "An invitation has been sent to your email address. You may also review it here: "
                let a = document.createElement("a");
                a.setAttribute("href", "https://github.com/asftest/");
                a.setAttribute("target", "_new");
                a.innerText = "Review invitation";
                canvas.appendChild(a);
                let p = document.createElement('p');
                p.innerText = "Once you have accepted your invitation, the Boxer service will start including you in the teams you have been assigned to. It may take up to five minutes before this happens. This page will reload once your invitation has been recorded as accepted, sit tight...";
                canvas.appendChild(p);
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
    canvas.innerText = "You do not appear to be a part of the Apache GitHub organization yet. This is the first step towards getting write-access to repositories. Click the link below to initate an invitation";
    canvas.appendChild(document.createElement('br'));
    let a = document.createElement("a");
    a.setAttribute("href", "#");
    a.addEventListener("click", () => invite_github(canvas));
    a.innerText = "Invite me to the GitHub organization!";
    canvas.appendChild(a);

}

async function prime() {
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
        let oauth_url = encodeURIComponent("https://localhost.apache.org/boxer.html?action=oauth&state=" + state);
        location.href = "https://oauth.apache.org/auth?redirect_uri=" + oauth_url + "&state=" + state;
        return
    }

    let canvas = document.getElementById('main');


    // Not authed via GitHub yet
    if (!login.github || !login.github.login) {
        canvas.innerText = "Please authenticate yourself on GitHub before we can continue: ";
        let a = document.createElement("a");
        a.setAttribute("href", "#");
        a.addEventListener("click", begin_oauth_github);
        a.innerText = "Auth with GitHub";
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

    if (!formdata.action) {
        canvas.innerText = `Welcome, ${login.credentials.fullname.split(' ')[0]}! You are authed as ${login.github.login} on GitHub. You will have access to the following repositories:`;
        let ul = document.createElement('ul');
        canvas.appendChild(ul);
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
    }
}



function begin_oauth_github() {
    let oauth_url = encodeURIComponent("https://localhost.apache.org/boxer.html?action=oauth&key=github&state=" + state);
    let ghurl = `https://github.com/login/oauth/authorize?client_id=${gh_client_id}&redirect_uri=${oauth_url}&scope=read%3Aorg%2C%20repo%2C%20user%3Aemail`;
    console.log(ghurl);
    location.href = ghurl;
}