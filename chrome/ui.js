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
    let parentClassName = className + "-container";
    var containers = document.getElementsByClassName(parentClassName);
    for (var j = 0; j < containers.length; j++) {
        var container = containers[j];
        if (container.classList.contains("popup-inactive")) {
            continue;
        }
        // console.log("Closing menu (" + container + ")");
        container.classList.remove("popup-active");
        container.classList.add("popup-inactive");
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
 * Represents a Pop-up menu.
 *
 * Provides extensions to a `.popup-menu select`.
 *
 * The first option in the `select` provides information about what
 * is in the drop-down. This option is unfortunately necessary if
 * no options exist in the `select`. Otherwise, the height of the
 * drop-down will be 0, causing the `.popup-menu` to collapse.
 */
function UIPopupMenu(select) {

    // Represents the parent view container (div.popup-menu)
    let node = select.parentNode;

    function updateSelectedOptionLabel() {
        let label = select.parentNode.querySelector(".popup-choices-label");
        label.innerHTML = select.options[select.selectedIndex].innerHTML;
    }

    function selectOption(index) {
        select.selectedIndex = index;
        updateSelectedOptionLabel();
    }

    this.selectOption = selectOption;

    /**
     * Returns the selected option.
     */
    function selectedOption(disabled) {
        // Disabled selects are not allowed to have a selected value
        if (disabled !== true && select.disabled) {
            return null;
        }
        // The option label is not a selectable value
        if (select.selectedIndex == 0) {
            return null;
        }
        let idx = select.selectedIndex;
        return select.options[idx]
    }

    this.selectedOption = selectedOption;

    /**
     * Returns the selected option's value.
     */
    function selectedValue(disabled) {
        // Disabled selects are not allowed to have a selected value
        if (disabled !== true && select.disabled) {
            return null;
        }
        // The option label is not a selectable value
        if (select.selectedIndex == 0) {
            return null;
        }
        let idx = select.selectedIndex;
        let value = select.options[idx].value;
        return value;
    }

    this.selectedValue = selectedValue;

    function _removeAllOptions() {
        let container = select.parentNode.querySelector(".popup-choices");
        // Remove all options from the select and facade except first option
        for (;select.options.length > 1;) {
            select.removeChild(select.lastElementChild);
            container.removeChild(container.lastElementChild);
        }
    }

    /**
     * Remove all `option`s from `select`.
     */
    function removeAllOptions() {
        _removeAllOptions();
        styleOptions();
        updateSelectedOptionLabel();
    }

    this.removeAllOptions = removeAllOptions;

    /**
     * Add new choices into pop-up menu.
     *
     * - Parameter select: The `select` `HTMLElement`
     * - Parameter choices: Array of dictionaries, where each dictionary has an `id` and `name`.
     */
    function addNewOptions(options) {
        _removeAllOptions();

        for (let i = 0; i < options.length; i++) {
          var option = document.createElement('option');
          var opt = options[i];
          option.value = opt["id"];
          option.text = opt["name"];
          select.appendChild(option);
        }
        styleOptions();
    }

    this.addNewOptions = addNewOptions;

    /**
     * Enable a pop-up menu.
     */
    function enable() {
        select.disabled = false;
        if (node.classList.contains("disabled")) {
            node.classList.remove("disabled");
        }
    }

    this.enable = enable;

    /**
     * Disable a pop-up meu.
     */
    function disable() {
        select.disabled = true;
        if (!node.classList.contains("disabled")) {
            node.classList.add("disabled");
        }
    }

    this.disable = disable;

    /**
     * Adds, and styles, all choices within the `select` element into the
     * `div.popup-choices`.
     */
    function styleOptions() {
        // Find the container for the popup-menu
        var container = node.querySelector(".popup-choices");
        if (container === undefined || container === null) {
            console.error("Could not find .popup-choices in select " + select);
            return;
        }

        // Create choices - ignore first choice
        for (var j = 1; j < select.length; j++) {
            var option = select.options[j];
            if (option.classList.contains("group")) {
                var group = document.createElement("div");
                group.setAttribute("class", "popup-choice-group");
                container.appendChild(group);
                continue;
            }
            var choice = document.createElement("div");
            choice.setAttribute("class", "popup-choice");
            choice.innerHTML = option.innerHTML;

            // Select a choice
            choice.addEventListener("click", function(e) {
                // This div displays the "selected" option
                var sibling = this.parentNode.parentNode.previousSibling;
                for (var z = 0; z < select.length; z++) {
                    if (select.options[z].innerHTML == this.innerHTML) {
                        select.selectedIndex = z;
                        sibling.innerHTML = this.innerHTML;
                        break;
                    }
                }
                if (select.onchange !== null) {
                    select.onchange();
                }
            });
            container.appendChild(choice);
        }
    }

    this.styleOptions = styleOptions;
}

/**
 * Style all popup menu elements.
 */
function stylePopupMenus() {
    // FIX: Does not select respective select menu. Probably because it has to be reselected.
    var menus = document.getElementsByClassName("popup-menu");
    for (var i = 0; i < menus.length; i++) {
        let selectElement = menus[i].getElementsByTagName("select")[0];
        selectElement.ui = new UIPopupMenu(selectElement);

        // The container is positioned absolute so that when a selection is made it overlays
        // the content instead of pushing it down.
        let container = document.createElement("div");
        container.setAttribute("class", "popup-container popup-inactive");
        // Inherit the parent's width (style)
        container.setAttribute("style", menus[i].getAttribute("style"));
        menus[i].removeAttribute("style");
        menus[i].appendChild(container);

        // Displays the selected option when the pop-up is inactive
        let choicesLabel = document.createElement("div");
        choicesLabel.setAttribute("class", "popup-choices-label");
        // Display the selected default option
        choicesLabel.innerHTML = selectElement.options[selectElement.selectedIndex].innerHTML;
        container.appendChild(choicesLabel);

        // Container for all choices
        var choices = document.createElement("div");
        choices.setAttribute("class", "popup-choices");

        // Disable drop-down if select element is disabled
        if (selectElement.disabled) {
            menus[i].classList.add("disabled");
        }

        var subContainer = document.createElement("div");
        subContainer.setAttribute("class", "sub-container");
        subContainer.appendChild(choices);
        container.appendChild(subContainer);

        selectElement.ui.styleOptions(selectElement);

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
            var popupMenu = this.parentNode.parentNode;
            if (!popupMenu.classList.contains("popup-menu")) {
                console.error("Expected parent to be a popup-menu")
                return;
            }
            // Do nothing if the control is disabled
            if (popupMenu.classList.contains("disabled")) {
                return;
            }
            var container = popupMenu.querySelector(".popup-container");
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
        container.setAttribute("class", "os-menu-container popup-inactive");
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
        subContainer.setAttribute("class", "sub-container");
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
            var container = this.parentNode; // os-menu-container
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
