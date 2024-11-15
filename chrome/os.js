function OS() {
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

    return this;
}
