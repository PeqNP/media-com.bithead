function initUI() {
    stylePopupMenus();
    styleFolders();
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

    // Will contain all of the metadata information
    var table = document.createElement("table");

    // Get the metadata associated to the parent `ul` (folder)
    var metadataTitle = folder.getElementsByClassName("metadata-title")[0];
    if (metadataTitle === undefined) {
        console.error("The parent folder must have an element `ul.metadata-title`");
        return null;
    }
    var metadata = metadataTitle.getElementsByTagName("li");
    if (metadata.length == 0) {
        console.error("There must be at least one metadata value in `ul.metadata-title`");
        return null;
    }
    this.metadata = getFolderMetadata(metadata);
    this.numFolders = 0;
    // Contains the folder hiearchy table cell. The rowspan must be updated as
    // children are added or removed from the table.
    this.folderHierarchy = null;

    function hideMetadata(file) {
        // Hide this `li` and all children under it
    }

    function showMetadata(file) {
    }

    var files = folder.getElementsByTagName("li");
    // Used to determine the first "real" file within the folder. The folder tree
    // will be displayed in the first folder's row.
    var firstFileFound = false;
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
            span.innerHTML = li.childNodes[0].textContent.trim();
            li.childNodes[0].remove();
            li.appendChild(span);
        }

        var tr = document.createElement("tr");
        tr.id = file.id;

        // TODO: Set the width of the rows accordingly. Only the first columns should have widths
        // The metadata in this `li` is the first one. Retrieve widths and assign to the first tds
        // accordingly.
        if (!firstFileFound) {
            var td = document.createElement("td");
            td.appendChild(folder.cloneNode(true));
            tr.appendChild(td);
            this.folderHierarchy = td;
            firstFileFound = true;
        }

        // Get the corresponding metadata for the child
        var foundMetadata = false;
        for (var j = 0; j < file.childNodes.length; j++) {
            if (file.childNodes[j].classList === undefined) {
                continue;
            }
            if (!file.childNodes[j].classList.contains("metadata")) {
                continue;
            }
            foundMetadata = true;
            // `ul` that contains metadata
            var data = file.childNodes[j];
            var metadata = data.getElementsByTagName("li");
            // The metadata must have N-1 the number of metadata from parent. The reason being
            // is that the first metadata column is the name of the node.
            if (metadata.length != this.metadata.length - 1) {
                console.warn("Invalid number of metadata in li (" + span.innerHTML + ") id (" + file.id + ")");
            }
            for (var k = 0; k < metadata.length; k++) {
                var td = document.createElement("td");
                td.innerHTML = metadata[k].innerHTML;
                tr.appendChild(td);
            }
        }
        if (!foundMetadata) {
            console.warn("Found no metadata in li (" + span.innerHTML + ") id (" + file.id + ")");
        }

        table.appendChild(tr);

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

            // Display the respective metadata for `li`s that are visible
        });
    }

    var parentNode = folder.parentNode;
    parentNode.replaceChild(table, folder);

    if (this.folderHiearchy === null) {
        console.warn("A folder hierarchy must exist");
    }
    else {
        this.folderHierarchy.rowSpan = this.numFolders;
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
        // FIXME: This _should_ always be the `0`th element
        choicesLabel.innerHTML = selectElement.options[selectElement.selectedIndex].innerHTML;
        container.appendChild(choicesLabel);

        // Container for all choices
        var choices = document.createElement("div");
        choices.setAttribute("class", "popup-choices popup-inactive");

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
                // The select element, which represents the source of truth.
                var s = this.parentNode.parentNode.parentNode.getElementsByTagName("select")[0];
                // This is the div that displays the "selected" option
                var sibling = this.parentNode.previousSibling;
                for (var z = 0; z < s.length; z++) {
                    if (s.options[z].innerHTML == this.innerHTML) {
                        s.selectedIndex = z;
                        sibling.innerHTML = this.innerHTML;
                        break;
                    }
                }
                closeAllPopupMenus();
            });
            choices.appendChild(choice);
        }
        container.appendChild(choices);

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
            console.log("Clicked select (" + e.target + ")");
            var choices = this.parentNode.querySelector(".popup-choices");
            var isSelected = choices.classList.contains("popup-active");
            e.stopPropagation();
            closeAllPopupMenus();
            // User tapped on pop-up menu when it was active. This means they wish to collapse
            // (toggle) the menu's activate state.
            if (!isSelected) {
                choices.classList.remove("popup-inactive");
                choices.classList.add("popup-active");
                this.classList.add("popup-arrow-active");
            }
        });
    }

    /**
     * Close all popup menus.
     */
    function closeAllPopupMenus() {
        console.log("Closing all pop-up menus");
        var containers = document.getElementsByClassName("popup-container");
        for (var j = 0; j < containers.length; j++) {
            var container = containers[j];
            var choices = container.getElementsByClassName("popup-choices");
            for (var i = 0; i < choices.length; i++) {
                if (choices[i].classList.contains("popup-inactive")) {
                    continue;
                }
                console.log("Closing pop-up menu (" + choices[i] + ")");
                choices[i].classList.remove("popup-active");
                choices[i].classList.add("popup-inactive");
            }
            // Reset arrow
            var choicesLabel = container.querySelector(".popup-choices-label");
            choicesLabel.classList.remove("popup-arrow-active");
        }
    }

    /**
     * Close select box if user clicks outside of select
     */
    document.addEventListener("click", closeAllPopupMenus);
}
