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
        option.innerHTML = time;
    }

    /**
     * Start updating clock.
     */
    this.startClock = function() {
        this.updateClock();
        setInterval(this.updateClock, 2000);
    }

    // TODO: updateClock every second

    return this;
}
