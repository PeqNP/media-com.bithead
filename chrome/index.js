function initUI() {
    styleOSMenus();
    stylePopupMenus();
    styleFolders();

    /**
     * Close all menus when user clicks outside of `select`.
     */
    document.addEventListener("click", closeAllMenus);
}

function styleFolders() {
    var folders = document.getElementsByClassName("folder");
    for (var i = 0; i < folders.length; i++) {
        var folder = new UIFolder(folders[i]);
    }
}

/**
 * Represents a metadata column title.
 */
function UIFolderMetadata(name, style) {
    this.name = name;
    this.style = style;
    return this;
}

function closeMenuType(className) {
    // console.log("Closing all (" + className + ")s");
    var containers = document.getElementsByClassName(className + "-container");
    for (var j = 0; j < containers.length; j++) {
        var container = containers[j];
        var subContainer = container.getElementsByClassName("sub-container")[0];
        if (subContainer.classList.contains("popup-inactive")) {
            continue;
        }
        // console.log("Closing menu (" + container + ")");
        subContainer.classList.remove("popup-active");
        subContainer.classList.add("popup-inactive");
        // Reset arrow
        var choicesLabel = container.querySelector("." + className + "-choices-label");
        choicesLabel.classList.remove("popup-arrow-active");
    }
}

/**
 * Close all popup menus.
 */
function closeAllMenus() {
    closeMenuType("os-menu");
    closeMenuType("popup");
}

/**
 * Extract metadata column name, and style info, from list of `li`s.
 *
 * @param [li] - List of `li`s to parse that provides metadata column title information
 * @returns UIFolderMetadata
 */
function getFolderMetadata(lis) {
    var metadata = Array();
    for (var i = 0; i < lis.length; i++) {
        var name = lis[i].innerHTML;
        var style = lis[i].style;
        var m = new UIFolderMetadata(name, style);
        metadata.push(m);
    }
    return metadata;
}

/**
 * Provides folder behavior.
 *
 * @note Represents a `ul.folder` element.
 * @note To provide collapsing behavior, place a `details` element within a `ul li`
 * element.
 *
 * FIXME: Does this cause a memory leak? The `folder` instantiated outside of
 * this function may or may not be held on to.
 * @param [ul.folder] - List of `ul.folder` elements
 * @returns UIFolder | null if error
 */
function UIFolder(folder) {
    // Previously selected file
    var selectedFile = null;

    this.numFolders = 0;

    var files = folder.getElementsByTagName("li");
    // Used to determine the first "real" file within the folder. The folder tree
    // will be displayed in the first folder's row.
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        // We need to ignore the `li`s associated to metadata
        if (file.parentNode.classList.contains("metadata-title") || file.parentNode.classList.contains("metadata")) {
            // console.log("Ignoring metadata(-title) li");
            continue;
        }
        if (file.id === "") {
            console.warn("File (" + file.innerHTML  +") must have an ID");
        }

        this.numFolders = this.numFolders + 1;

        // Wrap content in a span. This allows only the text to be highlighted
        // when selected.
        var span = document.createElement("span");
        // - Parent
        if (file.firstElementChild !== null && file.firstElementChild.nodeName == "DETAILS") {
            // Get only the first summary.
            // FIXME: Should the click be on span?
            var summary = file.firstElementChild.getElementsByTagName("summary")[0];
            span.innerHTML = summary.innerHTML;
            summary.innerHTML = "";
            summary.appendChild(span);
        }
        // - Child
        else if (file.firstChild !== null && file.firstChild.nodeName == "#text") {
            var li = file;
            span.innerHTML = li.innerHTML;
            li.innerHTML = ""
            li.appendChild(span);
        }

        // Change selected li
        span.addEventListener("click", function(e) {
            e.stopPropagation();
            if (selectedFile === e.target) {
                return;
            }
            if (selectedFile !== null) {
                selectedFile.classList.remove("active");
            }
            selectedFile = e.target;
            e.target.classList.add("active");
        });
    }

    return this;
}

/**
 * Style all popup menu elements.
 */
function stylePopupMenus() {
    // FIX: Does not select respective select menu. Probably because it has to be reselected.
    var menus = document.getElementsByClassName("popup-menu");
    for (var i = 0; i < menus.length; i++) {
        var selectElement = menus[i].getElementsByTagName("select")[0];

        // The container is positioned absolute so that when a selection is made it overlays
        // the content instead of pushing it down.
        var container = document.createElement("div");
        container.setAttribute("class", "popup-container");
        menus[i].appendChild(container);

        // The first option is the label for the group of choicese. This will be removed upon selecting a choice.
        var choicesLabel = document.createElement("div");
        choicesLabel.setAttribute("class", "popup-choices-label");
        // Inherit the parent's width (style)
        choicesLabel.setAttribute("style", menus[i].getAttribute("style"));
        menus[i].removeAttribute("style");
        // FIXME: This _should_ always be the `0`th element
        choicesLabel.innerHTML = selectElement.options[selectElement.selectedIndex].innerHTML;
        container.appendChild(choicesLabel);

        // Container for all choices
        var choices = document.createElement("div");
        choices.setAttribute("class", "popup-choices");

        // Create choices
        // NOTE: This skips the first choice, which is used as the label for the menu.
        for (var j = 1; j < selectElement.length; j++) {
            var option = selectElement.options[j];
            if (option.classList.contains("group")) {
                var group = document.createElement("div");
                group.setAttribute("class", "popup-choice-group");
                choices.appendChild(group);
                continue;
            }
            var choice = document.createElement("div");
            choice.setAttribute("class", "popup-choice");
            choice.innerHTML = option.innerHTML;

            /**
             * Select a (new) choice.
             */
            choice.addEventListener("click", function(e) {
                // TODO: This is broken
                // The select element, which represents the source of truth.
                var s = this.parentNode.parentNode.parentNode.parentNode.getElementsByTagName("select")[0];
                // This is the div that displays the "selected" option
                var sibling = this.parentNode.parentNode.previousSibling;
                for (var z = 0; z < s.length; z++) {
                    if (s.options[z].innerHTML == this.innerHTML) {
                        s.selectedIndex = z;
                        sibling.innerHTML = this.innerHTML;
                        break;
                    }
                }
            });
            choices.appendChild(choice);
        }
        var subContainer = document.createElement("div");
        subContainer.setAttribute("class", "sub-container popup-inactive");
        subContainer.appendChild(choices);
        container.appendChild(subContainer);

        /**
         * Toggle the popup-menu's state.
         *
         * If the state is inactive, the menu will be displayed. If active,
         * the menu will become hidden.
         *
         * NOTE: Only the first div in the container should have the click
         * event associated to the toggle state.
         */
        choicesLabel.addEventListener("click", function(e) {
            // console.log("Clicked select (" + e.target + ")");
            var container = this.parentNode.getElementsByClassName("sub-container")[0];
            var isActive = container.classList.contains("popup-active");
            e.stopPropagation();
            closeAllMenus();
            // Show menu
            if (!isActive) {
                container.classList.remove("popup-inactive");
                container.classList.add("popup-active");
                this.classList.add("popup-arrow-active");
            }
            // User tapped on pop-up menu when it was active. This means they wish to collapse
            // (toggle) the menu's activate state.
            else {
                container.classList.remove("popup-active");
                container.classList.add("popup-inactive");
                this.classList.remove("popup-arrow-active");
            }
        });
    }
}

/**
 * Style menus displayed in the OS bar.
 */
function styleOSMenus() {
    // FIX: Does not select respective select menu. Probably because it has to be reselected.
    var menus = document.getElementsByClassName("os-menu");
    for (var i = 0; i < menus.length; i++) {
        var selectElement = menus[i].getElementsByTagName("select")[0];

        // The container is positioned absolute so that when a selection is made it overlays
        // the content instead of pushing it down.
        var container = document.createElement("div");
        container.setAttribute("class", "os-menu-container");
        menus[i].appendChild(container);

        // The first option is the label for the group of choicese. This will be removed upon selecting a choice.
        var choicesLabel = document.createElement("div");
        choicesLabel.setAttribute("class", "os-menu-choices-label");
        // FIXME: This _should_ always be the `0`th element
        var label = selectElement.options[selectElement.selectedIndex].innerHTML;
        if (label.startsWith("img:")) {
            var img = document.createElement("img");
            img.src = label.split(":")[1];
            choicesLabel.appendChild(img);
        }
        else {
            choicesLabel.innerHTML = label;
        }
        container.appendChild(choicesLabel);

        // Container for all choices
        var choices = document.createElement("div");
        choices.setAttribute("class", "popup-choices");

        // Create choices
        // NOTE: This skips the first choice, which is used as the label for the menu.
        for (var j = 1; j < selectElement.length; j++) {
            var option = selectElement.options[j];
            if (option.classList.contains("group")) {
                var group = document.createElement("div");
                group.setAttribute("class", "popup-choice-group");
                choices.appendChild(group);
                continue;
            }
            var choice = document.createElement("div");
            choice.setAttribute("class", "popup-choice");
            // Adopt ID
            choice.setAttribute("id", option.getAttribute("id"));
            option.setAttribute("id", "");
            choice.innerHTML = option.innerHTML;
            // Inherit click event
            choice.setAttribute("onclick", option.getAttribute("onclick"));
            choices.appendChild(choice);
        }
        // Required to display border around options
        var subContainer = document.createElement("div");
        subContainer.setAttribute("class", "sub-container popup-inactive");
        // Inherit the parent's width (style)
        subContainer.setAttribute("style", menus[i].getAttribute("style"));
        menus[i].removeAttribute("style");
        subContainer.appendChild(choices);
        container.appendChild(subContainer);

        /**
         * Toggle the menu's state.
         *
         * If the state is inactive, the menu will be displayed. If active,
         * the menu will become hidden.
         *
         * NOTE: Only the first div in the container should have the click
         * event associated to the toggle state.
         */
        choicesLabel.addEventListener("click", function(e) {
            // console.log("Clicked select (" + e.target + ")");
            var container = this.parentNode.getElementsByClassName("sub-container")[0];
            var isActive = container.classList.contains("popup-active");
            e.stopPropagation();
            closeAllMenus();
            // User tapped on pop-up menu when it was active. This means they wish to collapse
            // (toggle) the menu's activate state.
            if (!isActive) {
                container.classList.remove("popup-inactive");
                container.classList.add("popup-active");
                this.classList.add("popup-arrow-active");
            }
            else {
                container.classList.remove("popup-active");
                container.classList.add("popup-inactive");
                this.classList.remove("popup-arrow-active");
            }
        });
    }
}
