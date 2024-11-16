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
    this.showVersion = function() {
        console.log("Version 1.0");
    }

    this.signIn = function(username) {
        this.username = username;

        // Update the OS bar
        var option = document.getElementById("log-out-of-system");
        option.innerHTML = "Log out " + username + "...";
    }

    /**
     * Make a network request.
     */
    this.request = function(url) {
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
     * Update the clocks time.
     */
    this.updateClock = function() {
        // TODO: Get time
        // TODO: Format time
        var time = "Fri Nov 15 10:23 AM";
        var option = document.getElementById("clock");
        option.innerHTML = time;
    }

    // TODO: updateClock every second

    return this;
}
