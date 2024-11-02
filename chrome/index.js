function initUI() {
    stylePopupMenus();
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
        var containers = document.getElementsByClassName("popup-container");
        for (var j = 0; j < containers.length; j++) {
            var container = containers[j];
            var choices = container.getElementsByClassName("popup-choices");
            for (var i = 0; i < choices.length; i++) {
                if (choices[i].classList.contains("popup-inactive")) {
                    continue;
                }
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
