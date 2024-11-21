
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

    /**
     * Execute an OS bar system action.
     */
    this.executeSystemOption = function(option) {
        if (option == "logOut") {
            this.logOut();
        }
        else if (option == "showVersion") {
            this.showVersion();
        }
        else {
            console.log("Invalid system option (" + option + ")");
        }
    }
    /**
     * Log user out of system.
     */
    this.logOut = function() {
        console.log("Log out user");
    }

    /**
     * Show Bithead OS version.
     */
    this.showAbout = function() {
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

    this.hideAbout = function() {
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

    this.signIn = function(username) {
        this.username = username;

        // Update the OS bar
        var option = document.getElementById("log-out-of-system");
        if (option === null) {
            console.warn("Signed in but not showing OS bar");
            return;
        }
        option.innerHTML = "Log out " + username + "...";
    }

    /**
     * Make a network request.
     */
    this.request = function(url, redirectTo) {
        // TODO: If `redirectTo` provided, URL encode the value and add it as a GET parameter to the URL
        window.location = url;
    }

    /**
     * Add a menu to the OS bar.
     */
    this.addOSBarMenu = function(menu) {
        var p = document.getElementById("menus");
        p.appendChild(menu);
    }

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
    this.updateClock = function() {
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
    this.startClock = function() {
        this.updateClock();
        setInterval(this.updateClock, 2000);
    }

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
    this.showErrorModal = function(error) {
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

    /**
     * Copy string `item` to clipboard.
     *
     * - Parameter button: The button invoking the copy action
     * - Parameter item: The string item to copy to clipboard.
     */
    this.copyToClipboard = function(button, item) {
        navigator.clipboard.writeText(item);
        let originalHTML = button.innerHTML;
        button.innerHTML = "Copied!";
        setInterval(function() {
            button.innerHTML = originalHTML;
        }, 2000);
    }

    return this;
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
