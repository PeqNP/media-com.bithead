
/**
 * Bithead OS
 *
 * Provides system-level features
 * - OS bar menus
 * - Signing in and out
 * - App and window management
 * - Making network requests
 * - Clock
 */
function OS() {

    // Displayed in OS menu, settings, etc.
    this.username = "";

    this.network = new Network(this);

    // List of "open" window controllers.
    let controllers = {};

    /**
     * Execute an OS bar system action.
     */
    function executeSystemOption(option) {
        if (option == "logOut") {
            logOut();
        }
        else if (option == "showVersion") {
            showVersion();
        }
        else {
            console.log("Invalid system option (" + option + ")");
        }
    }

    this.executeSystemOption = executeSystemOption;

    /**
     * Log user out of system.
     */
    function logout() {
        console.log("Log out user");
    }

    this.logout = logout;

    /**
     * Show Bithead OS version.
     */
    function showAbout() {
        var modal = document.getElementById("os-about");
        if (modal === null) {
            console.warn("OS About modal not found");
            return;
        }
        if (modal.style.display == "block") {
            return;
        }
        modal.style.display = "block";
    }

    this.showAbout = showAbout;

    function hideAbout() {
        var modal = document.getElementById("os-about");
        if (modal === null) {
            console.warn("OS About modal not found");
            return;
        }
        if (modal.style.display == "none") {
            return;
        }
        modal.style.display = "none";
        return false;
    }

    this.hideAbout = hideAbout;

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
     * Make a network request.
     */
    function request(url, redirectTo) {
        // TODO: If `redirectTo` provided, URL encode the value and add it as a GET parameter to the URL
        window.location = url;
    }

    this.request = request;

    /**
     * Add a menu to the OS bar.
     */
    function addOSBarMenu(menu) {
        var p = document.getElementById("menus");
        p.appendChild(menu);
    }

    this.addOSBarMenu = addOSBarMenu

    /**
     * Get the current time formatted in DDD MMM dd HH:MM AA.
     *
     * e.g. Fri Nov 15 9:24 PM
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
     * Update the clocks time.
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

    this.startClock = startClock;

    /**
     * Close a (modal) window.
     *
     * Removes the window from the view hierarchy.
     *
     * - Parameter win: The window to close.
     */
    function closeWindow(win) {
        const parent = win.parentNode;
        parent.removeChild(win);
    }

    /**
     * Show an error modal above all other content.
     */
    function showErrorModal(error) {
        var fragment = document.getElementById("error-modal");
        var modal = fragment.querySelector("div.modal").cloneNode(true);
        var message = modal.querySelector("p.message");
        message.innerHTML = error;
        var button = modal.querySelector("button.default");
        button.addEventListener("click", function() {
            closeWindow(modal);
        });
        // Center modal in the middle of the screen.
        modal.classList.add("center-control");
        // Display modal in desktop container
        var desktop = document.getElementById("desktop-container");
        desktop.appendChild(modal);
    }

    this.showErrorModal = showErrorModal;

    /**
     * Register all windows with the OS.
     *
     * This allows for window menus to be displayed in the OS bar.
     */
    function registerWindows() {
        var windows = document.getElementsByClassName("window");
        for (var i = 0; i < windows.length; i++) {
            registerWindow(windows[i]);
        }
    }

    this.registerWindows = registerWindows;

    /**
     * Register a window with the OS.
     *
     * This allows the OS to display the window's menus in the OS bar.
     */
    function registerWindow(win) {
        // Register window for life-cycle events
        let id = win.getAttribute("id");
        if (id !== null && id.length > 0) {
            let code = "new window." + id + "();";
            let controller = eval(code);
            console.log(controller);
            if (controller !== null && controller !== "undefined") {
                // TODO: Eventually the controller will be registered and life-cycle events passed.
                // TODO: Eventually an instance of the controller will be created, container
                // content rendered, and then viewDidLoad called before it is visible in the #desktop.
                if (controller.viewDidLoad !== undefined) {
                    controller.viewDidLoad();
                }
                // For now, only the viewDidAppear life-cycle event is relevant
                // as everything is rendered at once.
                if (controller.viewDidAppear !== undefined) {
                    controller.viewDidAppear();
                }
                controllers[id] = controller;
            }
        }

        var osMenus = win.getElementsByClassName("os-menus");
        if (osMenus.length < 1) {
            return;
        }
        osMenus = osMenus[0];

        var menus = osMenus.getElementsByClassName("os-menu");
        for (;menus.length > 0;) {
            var menu = menus[0];
            menu.parentNode.removeChild(menu);
            addOSBarMenu(menu);
        }
        osMenus.parentNode.removeChild(osMenus);
    }

    /**
     * Copy string `item` to clipboard.
     *
     * - Parameter button: The button invoking the copy action
     * - Parameter item: The string item to copy to clipboard.
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
     * Return instance of resgistered controller, given its `controllerID`.
     */
    function controller(controllerID) {
        let controller = controllers[controllerID];
        if (controller === null || controller === undefined) {
            console.error("No controller has been registerd with ID: " + controllerID);
            return null;
        }
        return controller;
    }

    this.controller = controller;
}

/**
 * Provides protocol definition for a Controller.
 *
 * A Controller allows a `div.window` to receive life-cycle events from the OS.
 *
 * All functions are optional. Therefore, implement only the functions needed.
 *
 * A Controller is defined on a `div.window` with the `id` attribute.
 * e.g. <div class="window" id="my_controller">
 *
 * When the `id` attribute exists, it is assumed there is a `script` tag inside the `div.window`.
 * The `script` tag must have a function with the same name as its `id`.
 * This `script` is used to send view life-cycle signals to the respective controller.
 *
 * e.g.
 * ```
 * function my_controller() {
 *     this.viewDidAppear = function() {
 *         // Do something when the view appears
 *     }
 *
 *     // Return an instance to this object
 *     return this;
 * }
 * ```
 */
function Controller() {
    /**
     * Called directly before the window is rendered.
     *
     * TODO: Not yet implemented.
     */
    function viewDidLoad() { }
    /**
     * Called after the window has been rendered.
     */
    function viewDidAppear() { }
}

/**
 * Provides network functions.
 */
function Network(os) {
    /**
     * Make a POST request with an object that can be converted into JSON.
     *
     * Displays an error model if an error occurred.
     * Returns a JSON object.
     */
    function json(url, body, fn) {
        if (body !== null) {
            body = JSON.stringify(body);
        }
        fetch(url, {
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
                if (data.error !== undefined) {
                    throw new Error(data.error.message);
                }
                fn(data);
            })
            .catch(error => {
                os.showErrorModal(error.message);
            });
    }

    this.json = json;
}
