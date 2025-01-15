/**
 * Provides application manager facilities.
 *
 * Purpose: To open, close, and manage application states.
 *
 * This creates application menus, mini application states (buttons displayed in
 * OS bar that switch applications), etc.
 */
function ApplicationManager(os) {
    // List of installed (registered) apps the OS is aware of.
    // object{bundleId:{name:icon:system:}}
    let apps = {};

    // Represents any app that was loaded. Loaded apps are considered
    // to be running, even if their application context is not active.
    // {bundleId:UIApplication}
    let loadedApps = {};

    // Defines the "active" application. When an application is "active", it
    // means the application has focus on the desktop. Only one non-system
    // application may be displayed at a time.
    let activeApplication = null;

    function init(_apps) {
        apps = _apps;
    }
    this.init = init;

    /**
     * Register applications available to BOSS.
     *
     * This is designed to display apps that a user has access to. This
     * over-writes any registered applications, except system apps, that may
     * have been initialized or registered at a previous time.
     *
     * @param {object{bundleId:{name:system:icon:}}} apps - List of installed apps
     */
    function registerApplications(_apps) {
        let rapps = {};

        // Re-create app list. Include only system apps.
        for (bundleId in apps) {
            let app = apps[bundleId];
            if (app.system) {
                rapps[bundleId] = app;
            }
        }

        // Add apps to list
        for (bundleId in _apps) {
            if (bundleId in rapps) {
                console.log("You may not overwrite a system app");
                continue;
            }

            let app = _apps[bundleId];
            if (app.system) {
                console.log("System apps may not be registered");
                continue;
            }
            rapps[bundleId] = app;
        }

        apps = rapps;
    }
    this.registerApplications = registerApplications;

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
                    name = `img:${app.icon},${app.name}`;
                }
                _apps.push({id: key, name: name});
            }
        }
        return _apps;
    }
    this.installedApplications = installedApplications;

    /**
     * Returns bundle ID's application instance.
     *
     * @returns UIApplication?
     */
    function application(bundleId) {
        let app = loadedApps[bundleId];
        if (isEmpty(app)) {
            console.error(`Application (${bundleId}) is not loaded.`);
            return null;
        }
        return app;
    }
    this.application = application;

    /**
     * Open a BOSS application.
     *
     * TODO: Check if user has permission to access app.
     * TODO: Move this into an ApplicationManager.js - it's part of UI but does not need to live in there.
     *
     * @param {string} bundleId - The Bundle ID of the application to open e.g. 'io.bithead.test-management'
     * @returns UIApplication
     * @throws
     */
    async function open(bundleId, fn) {
        let loadedApp = loadedApps[bundleId];
        if (!isEmpty(loadedApp)) {
            // TODO: Switch app context, if not passive

            // Load/focus on the app's main controller
            if (!loadedApp.system && loadedApp.main != "Application") {
                let ctrl = await loadedApp.loadController(loadedApp.main);
                ctrl.ui.show();
            }
            return loadedApp;
        }

        if (!(bundleId in apps)) {
            throw new Error(`Application (${bundleId}) is not installed. Make sure to register the app with the OS before attempting to open.`);
        }

        let progressBar = await os.ui.showProgressBar(`Loading application ${apps[bundleId].name}...`);

        function showError(msg, error) {
            if (!isEmpty(error)) {
                console.error(error);
            }
            progressBar?.ui.close();
            throw new Error(msg);
        }

        let config;
        try {
            config = await os.network.get(`/boss/app/${bundleId}/application.json`);
        }
        catch (error) {
            showError(`Failed to load application bundle (${bundleId}) configuration.`, error);
        }

        let objectId = makeObjectId();
        let app = new UIApplication(objectId, config);
        loadedApps[bundleId] = app;

        // Application may contain app delegate and menus
        let hasAppController = Object.keys(config.controllers).includes("Application");
        // When `true`, the app controller defines its own menu
        let hasAppMenu = false;

        let controller;
        if (hasAppController) {
            let html;
            try {
                html = await os.network.get(`/boss/app/${bundleId}/controller/Application.html`, "text");
            }
            catch (error) {
                showError(`Failed to load UIApplication for application bundle (${bundleId}).`, error);
            }

            const attr = {
                "app": {
                    bundleId: bundleId
                },
                "this": {
                    id: app.scriptId,
                    controller: `os.application('${bundleId}').controller()`
                }
            }

            // Like, `UIController`s, the script must be re-attached
            // to the body as HTML5 does not parse or execute Javascript
            // set to `innerHTML`.
            let div = document.createElement("div");
            div.innerHTML = interpolate(html, attr);
            let script = div.querySelector("script");
            if (!isEmpty(script)) {
                let parentNode = script.parentNode;
                parentNode.removeChild(script);

                let sc = document.createElement("script");
                sc.id = app.scriptId; // Required to unload script later
                sc.setAttribute("type", "text/javascript");
                let inline = document.createTextNode(script.innerHTML + `\n//@ sourceURL=/application/${bundleId}`);
                sc.appendChild(inline);
                document.head.appendChild(sc);
                controller = new window[app.scriptId]();
            }

            // Load app menu, if any
            let menus = div.querySelector(".ui-menus");
            if (!isEmpty(menus) && !app.system) {
                hasAppMenu = true;

                // Remove menu declaration from app
                menus.remove();
                menus.id = app.menuId;

                os.ui.styleUIMenus(menus);
                os.ui.addOSBarMenu(menus);
            }
        }

        // Create menu with only `Quit <app_name>` if app menu is not defined
        if (!hasAppMenu && !app.system) {
            let menus = document.createElement("div");
            menus.classList.add("ui-menus");
            menus.id = app.menuId;
            let menu = document.createElement("div");
            menu.classList.add("ui-menu");
            menu.style.width = "180px";
            let select = document.createElement("select");
            let title = document.createElement("option");
            title.innerHTML = config.application.name;
            select.appendChild(title);
            let option = document.createElement("option");
            // TODO: Add Command + Q in future
            option.innerHTML = `Quit ${config.application.name}`;
            option.setAttribute("onclick", `os.closeApplication('${bundleId}');`);
            select.appendChild(option);
            menu.appendChild(select);
            menus.appendChild(menu);
            os.ui.styleUIMenus(menus);
            os.ui.addOSBarMenu(menus);
        }

        // Application delegate will manage which controller is shown, if any
        if (config.application.main == "Application") {
            if (app.system) {
                app.applicationDidStart(controller);
            }
            else {
                if (!isEmpty(activeApplication)) {
                    activeApplication.applicationDidBlur();
                }

                // TODO: Switch application context

                activeApplication = app;

                app.applicationDidStart(controller);
                app.applicationDidFocus();
            }

            progressBar?.ui.close();

            return app;
        }

        progressBar?.setProgress(50, "Loading controller...");

        let container;
        try {
            container = await app.loadController(config.application.main);
        }
        catch (error) {
            showError(`Failed to load application (${bundleId}) main controller (${config.application.main})`, error);
        }

        // TODO: Switch application context if app is not passive

        if (app.system) {
            app.applicationDidStart(controller);
            container.ui.show();
        }
        else {
            if (!isEmpty(activeApplication)) {
                activeApplication.applicationDidBlur();
            }

            activeApplication = app;
            app.applicationDidStart(controller);

            container.ui.show();

            app.applicationDidFocus();
        }

        progressBar?.ui.close();

        return app;
    }
    this.open = open;

    // Tracks the state of closing apps. Sometimes multiple signals may be
    // sent to close an application.
    let closingApps = {};

    /**
     * Close an application.
     */
    function close(bundleId) {
        let app = loadedApps[bundleId];
        if (isEmpty(app)) {
            console.warn(`Attempting to close application (${bundleId}) that is not loaded.`);
            return;
        }

        // In the process of closing app
        if (bundleId in closingApps) {
            return;
        }
        closingApps[bundleId] = true;

        // Remove application menu
        let div = document.getElementById(app.menuId);
        div?.remove(); // NOTE: System apps do not have menus

        // TODO: If this is focused application, show empty desktop?
        // Show a window that lists all open applications to switch to?

        let script = document.getElementById(app.scriptId);
        if (!isEmpty(script)) {
            script.remove();
        }

        app.applicationDidStop();

        delete closingApps[bundleId];
        delete loadedApps[bundleId];
    }
    this.close = close;

    /**
     * Switch to a different application context.
     */
    function switchTo(bundleId) {
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
    this.switchTo = switchTo;

}
