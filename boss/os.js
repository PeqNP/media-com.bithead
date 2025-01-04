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

    // Indicates that the OS is loaded. Some facilities will not work until
    // the OS if fully loaded. Such as showing system modals, progress bars,
    // etc.
    let loaded = false;

    function isLoaded() {
        return loaded;
    }
    this.isLoaded = isLoaded;

    // List of installed (registered) apps the OS is aware of.
    // object{bundleId:{name:icon:system:}}
    let apps = {};

    // Represents any app that was loaded. Loaded apps are considered
    // to be running, even if their application context is not active.
    let loadedApps = {};

    // Defines the "active" application. When an application is "active", it
    // means the application has focus on the desktop. Only one non-system
    // application may be displayed at a time.
    let activeApplication = null;

    /**
     * Initialize the BOSS OS.
     *
     * Loads installed apps and opens the BOSS app.
     */
    async function init() {
        this.ui.init();
        startClock();

        // Load installed apps
        try {
            apps = await os.network.get("/boss/app/installed.json", "json");
            await os.openApplication("io.bithead.boss");
            loaded = true;
        }
        catch (error) {
            console.log(error);
        }
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
     * TODO: Check if user has permission to access app.
     *
     * @param {string} bundleId - The Bundle ID of the application to open e.g. 'io.bithead.test-management'
     * @returns UIApplication
     * @throws
     */
    async function openApplication(bundleId, fn) {
        let loadedApp = loadedApps[bundleId];
        if (!isEmpty(loadedApp)) {
            // TODO: Switch to non-system application
            return loadedApp;
        }

        if (!(bundleId in apps)) {
            throw new Error(`Application (${bundleId}) is not installed. Make sure to register the app with the OS before attempting to open.`);
        }

        let progressBar = os.ui.showProgressBar(`Loading application ${apps[bundleId].name}...`);

        function showError(msg, error) {
            if (!isEmpty(error)) {
                console.error(error);
            }
            progressBar?.ui.close();
            throw new Error(msg);
        }

        let config;
        try {
            config = await os.network.get(`/boss/app/${bundleId}/application.json`, "json");
        }
        catch (error) {
            showError(`Failed to load application bundle (${bundleId}).`, error);
        }

        let app = new UIApplication(config);
        loadedApps[bundleId] = app;

        if (config.application.main === "Application") {
            let html;
            try {
                html = await os.network.get(`/boss/app/${bundleId}/controller/Application.html`, "text");
            }
            catch (error) {
                showError(`Failed to load UIApplication for application bundle (${bundleId}).`, error);
            }

            let objectId = makeObjectId();
            id = `Application_${objectId}`;
            const attr = {
                "this": {id: id}
            }

            // Like, `UIController`s, the script must be re-attached
            // to the body as HTML5 does not parse or execute Javascript
            // set to `innerHTML`.
            let div = document.createElement("div");
            div.innerHTML = interpolate(html, attr);
            let script = div.querySelector("script");
            if (isEmpty(script)) {
                showError(`Application (${bundleId}) UIApplication must have a script tag.`);
            }
            script.id = id; // Required to unload script later
            let parentNode = script.parentNode;
            parentNode.removeChild(script);

            let sc = document.createElement("script");
            sc.setAttribute("type", "text/javascript");
            let inline = document.createTextNode(script.innerHTML);
            sc.appendChild(inline);
            document.head.appendChild(sc);

            if (app.system) {
                app.applicationDidStart();
            }
            else {
                if (!isEmpty(activeApplication)) {
                    activeApplication.applicationDidBlur();
                }

                activeApplication = app;

                app.applicationDidStart();
                app.applicationDidFocus();
            }

            progressBar?.ui.close();

            return app;
        } // Load UIApplication

        progressBar?.setProgress(50, "Loading controller...");

        try {
            let container = await app.loadController(config.application.main);
        }
        catch (error) {
            showError(`Failed to load application (${bundleId}) main controller (${config.application.main})`, error);
        }

        // TODO: Switch application context if app is non-system

        if (app.system) {
            app.applicationDidStart();
            container.ui.show();
        }
        else {
            if (!isEmpty(activeApplication)) {
                activeApplication.applicationDidBlur();
            }

            activeApplication = app;
            app.applicationDidStart();

            container.ui.show();

            app.applicationDidFocus();
        }

        progressBar?.ui.close();

        return app;
    }
    this.openApplication = openApplication;

    /**
     * Close an application.
     */
    function closeApplication(bundleId) {
        // TODO: Remove `script` from document.body
    }

    /**
     * Switch to application context.
     *
     * The application must be loaded first.
     *
     * @param {string} bundleId
     */
    function switchApplication(bundleId) {
        let app = loadedApps[bundleId];
        if (isEmpty(app)) {
            os.ui.showAlert(`Application bundle (${bundleId}) is not loaded.`);
            return;
        }

        if (!isEmpty(activeApplication)) {
            activeApplication.applicationDidBlur();
        }

        activeApplication = app;
        app.applicationDidFocus();

        // TODO: Switch controllers being viewed
        // There's a lot that needs to be done here. For example, the controllers must be
        // associated to an application. They need to be managed by UI and the window.
        // Essentially, the window needs to store the state of an application before it is
        // switched. This function may even need to exist in UI.
    }

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
    async function get(url, decoder, fn, msg) {
        let progressBar = null;
        if (!isEmpty(msg)) {
            progressBar = os.ui.showProgressBar(msg);
        }
        return fetch(url, {
            method: "GET",
            // FIXME: Required when loading controller files. Failing to do this
            // will prevent controller JSON files from being loaded when changes
            // are made, as the older cached version will be served. How these
            // files are served (using Etag) could be smarter as it has more to
            // do with the backend (probably) then the front-end.
            cache: "no-cache"
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
                // NOTE: This will not work for `text` decoded responses. This
                // relies on `response.ok`. Even then, that won't work if the
                // server responds with custom error message w/ 200 because
                // it can't find the resource.
                if (isEmpty(data.error)) {
                    return data;
                }
                else {
                    throw new Error(data.error.message);
                }
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
