/// Copyright ⓒ 2024 Bithead LLC. All rights reserved.

/**
 * Bithead OS aka BOSS
 *
 * Provides system-level features
 * - Access to UI API
 * - Access to Network API
 * - Signing in and out
 * - Clock
 */
function OS() {

    // Displayed in OS menu, settings, etc.
    this.username = "";

    this.network = new Network(this);
    this.ui = new UI(this);

    // List of installed (registered) apps the OS is aware of.
    // object{bundleId:{name:icon:system:}}
    let apps = {};

    function init() {
        this.ui.init();
        startClock();
    }
    this.init = init;

    /**
     * Log user out of system.
     */
    function logOut() {
        os.ui.showDeleteModal("Are you sure you want to log out?", null, function() {
            os.network.redirect('/account/signout');
        });
    }
    this.logOut = logOut;

    /**
     * Sign user into system.
     *
     * @param {string} username - The username that is signed in
     */
    function signIn(username) {
        this.username = username;

        // Update the OS bar
        var option = document.getElementById("log-out-of-system");
        if (option === null) {
            console.warn("Signed in but not showing OS bar");
            return;
        }
        option.innerHTML = "Log out " + username + "...";
    }

    this.signIn = signIn;

    /**
     * Get the current time formatted in DDD MMM dd HH:MM AA.
     *
     * e.g. Fri Nov 15 9:24 PM
     *
     * @returns formatted string
     */
    function getCurrentFormattedTime() {
        const date = new Date();

        // Get parts of the date
        const day = date.toLocaleString('default', { weekday: 'short' });  // Short day name
        const month = date.toLocaleString('default', { month: 'short' });  // Short month name
        const dayOfMonth = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();

        // Determine AM or PM
        const ampm = hours >= 12 ? 'PM' : 'AM';

        // Convert to 12-hour format
        let formattedHours = hours % 12 || 12;

        // 9:23 PM
        const time = `${formattedHours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

        // e.g. Fri Nov 15 9:23 PM
        return `${day} ${month} ${dayOfMonth} ${time}`;
    }

    /**
     * Update the clock's time.
     */
    function updateClock() {
        var time = getCurrentFormattedTime(); // "Fri Nov 15 10:23 AM";
        var option = document.getElementById("clock");
        if (option === null) {
            console.warn("Attemping to update clock when OS bar is not visible.");
            return;
        }
        option.innerHTML = time;
    }

    /**
     * Start updating clock.
     */
    function startClock() {
        updateClock();
        setInterval(updateClock, 2000);
    }

    /**
     * Copy string `item` to clipboard.
     *
     * This temporarily changes the label of `button` for 2 seconds before
     * displaying the previous label again.
     *
     * @param {HTMLElement} button - The button invoking the copy action
     * @param {string} item - The string item to copy to clipboard
     */
    function copyToClipboard(button, item) {
        navigator.clipboard.writeText(item);
        let originalHTML = button.innerHTML;
        button.innerHTML = "Copied!";
        setInterval(function() {
            button.innerHTML = originalHTML;
        }, 2000);
    }
    this.copyToClipboard = copyToClipboard;

    /**
     * Register applications available to BOSS.
     *
     * This is primarily used by the `io.bithead.applications` app to inform
     * user which applications are installed. This may change in the future.
     *
     * @param {object[bundleId:name:]} apps - List of installed apps
     */
    function registerApplications(_apps) {
        apps = _apps;
    }
    this.registerApplications = registerApplications;

    /**
     * Open a BOSS application.
     *
     * TODO: In the future, this will check if the user has permission to
     * open the app.
     *
     * @param {string} bundleId - The Bundle ID of the application to open e.g. 'io.bithead.test-management'
     */
    function openApplication(bundleId) {
        if (!(bundleId in apps)) {
            os.ui.showAlert(`Application with Bundle ID (${bundleId}) is not installed. Make sure to register the app with the OS before attempting to open.`);
            return;
        }

        let app = apps[bundleId];

        let progressBar = os.ui.showProgressBar(`Loading application ${app.name}...`);

        function showError(msg, error) {
            if (!isEmpty(error)) {
                console.error(error);
            }
            os.ui.showAlert(msg);
            progressBar.ui.close();
        }


        os.network.get(`/boss/app/${bundleId}/application.json`, "json", function(result) {
            if (!result.ok) {
                showError(`Failed to load application bundle (${bundleId}).`, result.error);
                return;
            }

            let resp = result.value;
            if (resp.main === "application.json") {
                showError("Loading an application's UIApplication not yet supported");
                return;
            }

            progressBar.setProgress(50, "Loading controller...");
            let ctrl = resp.controllers[resp.main];
            if (isEmpty(ctrl)) {
                showError(`Could not find main application controller (${resp.main}). Make sure 'application.main' references a controller name in 'controllers'.`);
                return;
            }

            if (!isEmpty(ctrl.renderer) && ctrl.renderer !== "html") {
                showError(`Unsupported renderer (${ctrl.renderer}) defined in controller (${ctrl.name}).`);
                return;
            }
            os.network.get(`/boss/app/${bundleId}/controller/${resp.main}.${ctrl.renderer}`, "text", function(result) {
                if (!result.ok) {
                    showError(`Failed to load application bundle (${bundleId}) controller (${resp.main}).`, result.error);
                    return;
                }

                progressBar.ui.close();
                let win = os.ui.makeWindow(html);
                win.show();

                // TODO: The application is officially "launched". Set it as the
                // current application if it is _not_ a system app.
                // TODO: Start calling application life-cycle methods
            });
        });
    }
    this.openApplication = openApplication;

    /**
     * Returns all user-space installed applications.
     *
     * This is assumed to be used in a `UIListBox`. Therefore, `name` also
     * contains the application's icon.
     *
     * @returns [object{id:value:}]
     */
    function installedApplications() {
        let _apps = [];
        for (key in apps) {
            let app = apps[key];
            if (app.system !== true) {
                let name = null;
                if (isEmpty(app.icon)) {
                    name = app.name;
                }
                else {
                    name = `img:${app.icon},app.name`;
                }
                _apps.push({id: key, name: name});
            }
        }
        return _apps;
    }
    this.installedApplications = installedApplications;
}

/**
 * Provides network functions.
 */
function Network(os) {

    /**
     * Redirect to a page using a GET request.
     */
    function redirect(url, redirectTo) {
        // TODO: If `redirectTo` provided, URL encode the value and add it as a GET parameter to the URL
        window.location = url;
    }

    // @deprecated - Use `this.redirect`
    this.request = redirect;
    this.redirect = redirect;

    /**
     * Make a GET request.
     *
     * Note: Displays error message if request failed.
     *
     * @param {string} url
     * @param {string} decoder - Response decoder. Supported: text | json
     * @param {function} fn(Result)? - Response function
     * @param {string} msg? - Show progress bar with message
     */
    function get(url, decoder, fn, error_fn, msg) {
        let progressBar = null;
        if (!isEmpty(msg)) {
            progressBar = os.ui.showProgressBar(msg);
        }
        let response = fetch(url, {
            method: "GET"
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`GET request (${url}) unexpectedly failed`);
                }
                if (decoder === "json") {
                    return response.json();
                }
                else {
                    return response.text();
                }
            })
            .then(data => {
                fn(new Result(data));
            })
            .catch(error => {
                fn(new Result(error));
            })
            .then(() => {
                progressBar?.ui.close();
            });
    }
    this.get = get;

    /**
     * Make a POST request with an object that can be converted into JSON.
     *
     * Note: Displays error message if request failed.
     *
     * @param {string} url
     * @param {File} body - Object to pass as JSON
     * @param {function} fn? - Response function
     * @param {string} msg? - Show progress bar with message
     */
    function json(url, body, fn, msg) {
        if (body === null || body.length < 1) {
            body = '{}';
        }
        else {
            body = JSON.stringify(body);
        }
        let progressBar = null;
        if (!isEmpty(msg)) {
            progressBar = os.ui.showProgressBar(msg);
        }
        let response = fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: body
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Request unexpectedly failed");
                }
                return response.json();
            })
            .then(data => {
                // If there is an `error` struct, the response is considered to be in error
                if (!isEmpty(data.error)) {
                    throw new Error(data.error.message);
                }
                fn(data);
            })
            .catch(error => {
                os.ui.showErrorModal(error.message);
            })
            .then(() => {
                progressBar?.ui.close();
            });
    }

    // @deprecated - Use `post` instead
    this.json = json;
    this.post = json;

    /**
     * Upload a file.
     *
     * Note: Displays error message if request failed.
     *
     * @param {string} url
     * @param {File} file - File object to upload
     * @param {function} fn? - Response function
     * @param {string} msg? - Show progress bar with message
     */
    function upload(url, file, fn, msg) {
        let formData = new FormData();
        formData.append("file", file);

        let progressBar = null;
        if (!isEmpty(msg)) {
            progressBar = os.ui.showProgressBar(msg);
        }

        fetch(url, {
            method: "POST",
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Request unexpectedly failed");
                }
                return response.json();
            })
            .then(data => {
                // If there is an `error` struct, the response is considered to be in error
                if (data.error !== undefined) {
                    throw new Error(data.error.message);
                }
                fn(data);
            })
            .catch(error => {
                os.ui.showErrorModal(error.message);
            })
            .then(() => {
                progressBar?.ui.close();
            });
    }
    this.upload = upload;

    function __delete(url, fn, msg) {
        let progressBar = null;
        if (!isEmpty(msg)) {
            progressBar = os.ui.showProgressBar(msg);
        }

        fetch(url, {
            method: "DELETE"
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Request unexpectedly failed");
                }
                return response.json();
            })
            .then(data => {
                // If there is an `error` struct, the response is considered to be in error
                if (data.error !== undefined) {
                    throw new Error(data.error.message);
                }
                fn(data);
            })
            .catch(error => {
                os.ui.showErrorModal(error.message);
            })
            .then(() => {
                progressBar?.ui.close();
            });
    }

    /**
     * Make a DELETE request.
     *
     * Note: Displays error message if request failed.
     *
     * @param {string} url
     * @param {object} body - request object to send as JSON to `url`
     * @param {function} fn? - Response function
     * @param {string} msg? - Show progress bar with message
     */
    function _delete(url, msg, fn, dmsg) {
        if (msg === null) {
            __delete(url, fn, dmsg);
            return;
        }
        os.ui.showDeleteModal(msg, null, function () {
            __delete(url, fn, dmsg);
        });
    }
    this.delete = _delete;

    /**
     * Make PATCH request.
     *
     * Note: Displays error message if request failed.
     *
     * @param {string} url
     * @param {object} body - request object to send as JSON to `url`
     * @param {function} fn? - Response function
     * @param {string} msg? - Show progress bar with message
     */
    function patch(url, body, fn, msg) {
        if (body === null || body.length < 1) {
            body = '{}';
        }
        else {
            body = JSON.stringify(body);
        }

        let progressBar = null;
        if (!isEmpty(msg)) {
            progressBar = os.ui.showProgressBar(msg);
        }

        fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: body
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Request unexpectedly failed");
                }
                return response.json();
            })
            .then(data => {
                // If there is an `error` struct, the response is considered to be in error
                if (data.error !== undefined) {
                    throw new Error(data.error.message);
                }
                fn(data);
            })
            .catch(error => {
                os.ui.showErrorModal(error.message);
            })
            .then(() => {
                progressBar?.ui.close();
            });
    }
    this.patch = patch;

    /**
     * Load a stylesheet asynchronously.
     */
    function stylesheet(href) {
        return new Promise((resolve, reject) => {
            let link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.onload = resolve;
            link.onerror = reject;
            link.href = '/codemirror/lib/codemirror.css';
            document.head.appendChild(link);
        });
    }
    this.stylesheet = stylesheet;

    function javascript(href) {
        return new Promise((resolve, reject) => {
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = href;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    this.javascript = javascript;
}
