// ==UserScript==
// @name         Remix Custom Filter
// @namespace    http://tampermonkey.net/
// @version      2024-09-14
// @description  Custom description filters for RemixShop
// @author       rodopiip
// @match        https://www.tampermonkey.net/index.php?ext=dhdg&updated=true&version=5.2.3
// @match        https://remixshop.com/*
// @icon         https://remixshop.com/images/ld/logo/logo-remix.svg
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    // Load from localStorage or use default values
    let minFilterValue = localStorage.getItem("minFilterValue")
        ? parseFloat(localStorage.getItem("minFilterValue"))
        : 80.0;
    let maxFilterValue = localStorage.getItem("maxFilterValue")
        ? parseFloat(localStorage.getItem("maxFilterValue"))
        : 100.0;
    let regexStringPattern =
        localStorage.getItem("regexStringPattern") ||
        "Талия\\s+(\\d+(?:\\.\\d+)?)\\s+см";

    // HTML template for configuration modal
    const modalHTML = `
        <div id="filterConfigModal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); padding:20px; background-color:white; border:1px solid #ccc; z-index:9999;">
            <h2>Конфигурация на филтъра</h2>
            <label>Минимална стойност на филтъра:</label>
            <input type="number" step="0.1" id="minFilterValueInput" value="${minFilterValue}"><br><br>
            <label>Максимална стойност на филтъра:</label>
            <input type="number" step="0.1" id="maxFilterValueInput" value="${maxFilterValue}"><br><br>
            <label>Regex филтър на описание:</label>
            <input type="text" id="regexInput" value="${regexStringPattern}"><br><br>
            <button id="saveConfigButton">Запази</button>
            <button id="closeModalButton">Затвори</button>
        </div>
    `;

    // Inject modal into the body
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const modal = document.getElementById("filterConfigModal");
    const minFilterValueInput = document.getElementById("minFilterValueInput");
    const maxFilterValueInput = document.getElementById("maxFilterValueInput");
    const regexInput = document.getElementById("regexInput");

    // Show the modal when Ctrl+Shift+B is pressed
    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.shiftKey && event.key === "B") {
            event.preventDefault();
            modal.style.display = "block";
        }
    });

    // Save button of modal functionality
    document.getElementById("saveConfigButton").addEventListener("click", () => {
        const parsedMin = parseFloat(minFilterValueInput.value);
        const parsedMax = parseFloat(maxFilterValueInput.value);
        minFilterValue = Math.min(parsedMin, parsedMax);
        maxFilterValue = Math.max(parsedMin, parsedMax);

        // In case those two values were swapped (user entered a min >= max)
        // swap them in the input fields as well for consistency
        minFilterValueInput.value = minFilterValue;
        maxFilterValueInput.value = maxFilterValue;
        regexStringPattern = regexInput.value;

        // Save to localStorage
        localStorage.setItem("minFilterValue", minFilterValue);
        localStorage.setItem("maxFilterValue", maxFilterValue);
        localStorage.setItem("regexStringPattern", regexStringPattern);

        modal.style.display = "none";
    });

    // Close button of modal functionality
    document.getElementById("closeModalButton").addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Filtering logic when Ctrl+B is pressed
    document.addEventListener("keydown", (event) => {
        // On Ctrl+B run filter
        if (event.ctrlKey && event.key === "b") {
            event.preventDefault();
            const regex = new RegExp(regexStringPattern);

            console.log(
                "Filter configuration:",
                JSON.stringify({ minFilterValue, maxFilterValue, regex }),
            );

            const items = document.querySelectorAll(
                ".product-listing .product-brand",
            );

            items.forEach((item) => {
                const itemAnchor = item;
                const url = itemAnchor.href;

                $.ajax({
                    url,
                    success: (data) => {
                        const descriptionsText = $(data)
                            .find(".product-description")
                            .text()
                            .trim();
                        const match = descriptionsText.match(regex);
                        const isMatchValid =
                            match &&
                            parseFloat(match[1]) >= minFilterValue &&
                            parseFloat(match[1]) <= maxFilterValue;

                        // Prevents spam of ✅ and ❌
                        if (
                            itemAnchor.innerText.startsWith("✅") ||
                            itemAnchor.innerText.startsWith("❌")
                        ) {
                            itemAnchor.innerText = itemAnchor.innerText.substring(1);
                        }

                        itemAnchor.innerText =
                            (isMatchValid ? "✅" : "❌") + itemAnchor.innerText;
                    },
                });
            });
        }
    });
})();
